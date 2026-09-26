#!/bin/sh
#
# What the image cannot know until it starts: the port, and what is inside the
# persistent volume.
#
set -eu

PERSIST_ROOT="${PERSIST_ROOT:-/var/lib/pawsandfound}"
UPLOADS="$PERSIST_ROOT/uploads"
SESSIONS="${SESSION_SAVE_PATH:-$PERSIST_ROOT/sessions}"
WEB_UPLOADS=/var/www/html/api/uploads
PORT="${PORT:-80}"

# ------------------------------------------------------------ 1. the volume
#
# One volume mounts at PERSIST_ROOT and holds both. A fresh volume arrives
# empty and owned by root, so both directories are made and handed to www-data
# — without that, move_uploaded_file() fails while the request still returns
# 201 and the database row is still written, which is the worst shape a bug
# can take.
mkdir -p "$UPLOADS" "$SESSIONS"
chown www-data:www-data "$PERSIST_ROOT" "$UPLOADS" "$SESSIONS"
chmod 755 "$UPLOADS"
# Session files are bearer tokens sitting in a directory.
chmod 700 "$SESSIONS"

# The .htaccess that stops an uploaded file being executed lives in the volume
# now, so an empty volume has no protection until this puts it back. Restored
# only when absent: never overwrite what is already there.
if [ ! -f "$UPLOADS/.htaccess" ] && [ -f /var/www/html/api/uploads.htaccess.bak ]; then
    cp /var/www/html/api/uploads.htaccess.bak "$UPLOADS/.htaccess"
    chown www-data:www-data "$UPLOADS/.htaccess"
fi

# api/uploads is a symlink into the volume, made at build time. Checked rather
# than assumed, and repaired only if something replaced it — a plain `ln -sf`
# over an existing REAL directory would leave uploaded files stranded where
# nothing serves them.
if [ ! -L "$WEB_UPLOADS" ]; then
    if [ -d "$WEB_UPLOADS" ] && [ -n "$(ls -A "$WEB_UPLOADS" 2>/dev/null)" ]; then
        echo "[paws] api/uploads is a real directory with files in it; moving them onto the volume"
        cp -a "$WEB_UPLOADS/." "$UPLOADS/"
    fi
    rm -rf "$WEB_UPLOADS"
    ln -s "$UPLOADS" "$WEB_UPLOADS"
fi

# --------------------------------------------------------------- 2. sessions
#
# Outside the document root, on the volume, so signing in survives a redeploy.
#
# NOT a shared session store. Correct only because railway.json pins one
# replica. Scaled to two, half the requests would not find their session and
# people would be signed out at random — at which point sessions move into
# MySQL, not onto a bigger disk.
printf 'session.save_path = "%s"\n' "$SESSIONS" > "$PHP_INI_DIR/conf.d/sessions.ini"

# ------------------------------------------------------------------ 3. apache
#
# The platform chooses the port. Apache's is compiled into ports.conf and the
# default vhost, so both are rewritten.
sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# The image is built with exactly one MPM and configtest passes during the
# build, yet the platform reported "More than one MPM loaded" at run time. So
# anything that is not prefork goes here too, and — more useful — the startup
# log says what Apache actually sees rather than leaving us to guess.
for mpm in mpm_event mpm_worker; do
    if [ -e "/etc/apache2/mods-enabled/${mpm}.load" ]; then
        echo "[paws] disabling ${mpm}, which was not in the image"
        a2dismod -f "$mpm" >/dev/null 2>&1
    fi
done

if [ ! -e /etc/apache2/mods-enabled/mpm_prefork.load ]; then
    echo "[paws] re-enabling mpm_prefork"
    a2enmod mpm_prefork >/dev/null 2>&1
fi

# ---------------------------------------------------------------- 4. say so
#
# Six facts, every one read out of the running container rather than restated
# from the Dockerfile. No credentials, no environment dump, no session ids.
echo "[paws] persistent root : $PERSIST_ROOT"
echo "[paws] upload path     : $WEB_UPLOADS -> $(readlink -f "$WEB_UPLOADS")"
echo "[paws] session path    : $(php -r 'echo ini_get("session.save_path");')"
echo "[paws] apache port     : $(grep -m1 '^Listen' /etc/apache2/ports.conf | awk '{print $2}')"

# `apache2ctl -M` is the real question: not which files are enabled, but which
# modules Apache loaded. If it fails because the configuration is broken, that
# failure is printed here, before Apache is exec'd and the message disappears
# into a restart loop.
if mpm_loaded="$(apache2ctl -M 2>/dev/null | grep 'mpm_.*_module')"; then
    echo "[paws] apache mpm      :$(echo "$mpm_loaded" | tr -d '\n')"
else
    echo "[paws] apache mpm      : COULD NOT BE DETERMINED — apache2ctl -M failed"
    apache2ctl -M 2>&1 | sed 's/^/[paws]   /' || true
fi

echo "[paws] apache config   :"
apache2ctl configtest 2>&1 | sed 's/^/[paws]   /'

exec "$@"
