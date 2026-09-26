#!/bin/sh
#
# Three things the image cannot know until it starts.
#
set -eu

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

exec "$@"
