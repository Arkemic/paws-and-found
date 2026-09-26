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
# every redeploy, signing everybody out. Put it on the volume when there is one.
#
# This is not the same as making sessions safe across several instances — that
# would need a shared store, and it is only correct here because the service
# runs a single replica. Said plainly rather than implied: if this is ever
# scaled to two, sessions have to move to the database first.
if [ -d "$UPLOADS" ]; then
    SESSIONS="$(dirname "$UPLOADS")/sessions"
    mkdir -p "$SESSIONS"
    chown www-data:www-data "$SESSIONS"
    chmod 700 "$SESSIONS"
    printf 'session.save_path = "%s"\n' "$SESSIONS" > "$PHP_INI_DIR/conf.d/sessions.ini"
fi

exec "$@"
