#!/bin/sh
#
# Three things the image cannot know until it starts.
#
set -eu

# ------------------------------------------------------------------ 0. apache
#
# The image is built with exactly one MPM and `apache2ctl configtest` passes
# during the build. Apache still refused to start on the platform with
#
#     AH00534: apache2: Configuration error: More than one MPM loaded.
#
# so something adds a second one between the image being built and the
# container being started. Guessing at what, from a log that only repeats the
# symptom, was going nowhere — so this says out loud what Apache is actually
# reading, and then makes sure it reads only one.
#
# The listing goes to the deploy log on every start. It is four lines and it
# turns "more than one" into "these ones".
echo "[entrypoint] MPM modules Apache can see:"
ls -1 /etc/apache2/mods-enabled/ 2>/dev/null | grep -i mpm | sed 's/^/[entrypoint]   /' ||     echo "[entrypoint]   (none)"

# Anything that is not prefork goes, at run time as well as at build time.
# a2dismod is quiet about modules that were not enabled, so this is safe when
# there is nothing to remove — which is the case on a correctly built image.
for mpm in mpm_event mpm_worker; do
    if [ -e "/etc/apache2/mods-enabled/${mpm}.load" ]; then
        echo "[entrypoint] disabling ${mpm}, which was not in the image"
        a2dismod -f "$mpm" >/dev/null 2>&1 || true
    fi
done

if [ ! -e /etc/apache2/mods-enabled/mpm_prefork.load ]; then
    echo "[entrypoint] re-enabling mpm_prefork"
    a2enmod mpm_prefork >/dev/null 2>&1 || true
fi

# ---------------------------------------------------------------- 1. the port
#
# The platform chooses it and passes it in. Apache's port is compiled into
# ports.conf and the default vhost, so both are rewritten. Falls back to 80 so
# the image still runs under a plain `docker run`.
PORT="${PORT:-80}"
sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# ------------------------------------------------------------- 2. the uploads
#
# A mounted volume arrives owned by root, and PHP runs as www-data. Without
# this, move_uploaded_file() fails and every photograph silently does not
# appear — the request succeeds, the row is written, the file is not there.
#
# .htaccess is what stops an uploaded file being executed. The volume is empty
# on a first deploy and mounts OVER the copy baked into the image, so it is
# restored here. This is a security control, not a nicety.
UPLOADS=/var/www/html/api/uploads
mkdir -p "$UPLOADS"
if [ ! -f "$UPLOADS/.htaccess" ] && [ -f /var/www/html/api/uploads.htaccess.bak ]; then
    cp /var/www/html/api/uploads.htaccess.bak "$UPLOADS/.htaccess"
fi
chown -R www-data:www-data "$UPLOADS"

# ------------------------------------------------------------- 3. the sessions
#
# PHP's default session directory is inside the container and disappears on
# every redeploy, signing everybody out.
#
# This used to derive the path from the uploads directory, which put it at
# /var/www/html/api/sessions — a SIBLING of the mount, not inside it. So it was
# ephemeral after all, and the documentation claiming otherwise was wrong. It
# also sat under the document root, which is the wrong place for session files
# whatever their durability.
#
# Now: its own path, outside the web root, and its own Railway volume.
#
# NOT a shared session store. Filesystem sessions are correct here only because
# the service runs ONE replica. Scaled to two, half the requests would not find
# their session and people would be signed out at random — at that point the
# sessions have to move into MySQL, not onto a bigger disk.
SESSIONS="${SESSION_SAVE_PATH:-/var/lib/pawsandfound-sessions}"
mkdir -p "$SESSIONS"
chown www-data:www-data "$SESSIONS"
# Only the web server. Session files are bearer tokens in a directory.
chmod 700 "$SESSIONS"
printf 'session.save_path = "%s"
' "$SESSIONS" > "$PHP_INI_DIR/conf.d/sessions.ini"

# One last look before handing over. If the configuration is still wrong, the
# reason is in the deploy log instead of only the symptom.
echo "[entrypoint] apache2ctl configtest:"
apache2ctl configtest 2>&1 | sed 's/^/[entrypoint]   /' || true

exec "$@"
