# Paws&Found — one container serving the built site and the PHP API from one
# origin, exactly as XAMPP does locally.
#
# Same origin is not a convenience here. It is why there is no CORS to
# configure, why the session cookie is first-party, and why nothing had to
# change in the application to deploy it. The only difference from the local
# Apache is that this one listens on the port the platform gives it.
#
# MySQL is a separate service. Nothing in this image knows its address — that
# arrives as environment variables and is read by api/config.php.

# ---------------------------------------------------------------- build stage
FROM node:22-bookworm-slim AS build

WORKDIR /build

# Dependencies first, so a change to the source does not re-download them.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Not `npm run build`: that one targets the local /pawsandfound/ sub-path. This
# builds for a domain root, which is where a deployed copy lives.
RUN npm run build:deploy


# ------------------------------------------------------------- runtime stage
FROM php:8.3-apache

# pdo_mysql is the only extension the application needs.
#
# gd was here, and it was a mistake twice over. Nothing in api/ calls a single
# gd function — the upload check uses getimagesize(), which lives in PHP's
# core `standard` extension, not in gd. And installing it with --auto-remove
# stripped libpng16 and libjpeg62-turbo back out again, so the extension was
# built, shipped, and then failed to load on every single request with a
# startup warning. It validated nothing and warned constantly.
#
# Found by running the container and reading php -i, not by reading the
# Dockerfile, which looked entirely reasonable.
RUN docker-php-ext-install -j"$(nproc)" pdo_mysql

# mod_rewrite serves the SPA fallback and the API's front controller.
# mod_headers sets the cache policy in public/.htaccess.
#
# The MPM lines look redundant — the base image enables mpm_prefork and nothing
# here adds another. They are here because a deploy failed with
#
#     AH00534: apache2: Configuration error: More than one MPM loaded.
#
# and Apache will not start at all in that state, so the container crash-loops
# and the platform answers 502. Whatever put a second one there, saying plainly
# which one this image wants costs nothing and removes a whole class of
# "it works on my machine".
RUN a2dismod -f mpm_event mpm_worker 2>/dev/null || true     && a2enmod mpm_prefork rewrite headers     && test "$(ls /etc/apache2/mods-enabled/ | grep -c 'mpm_.*\.load')" = "1"

# Fail the BUILD, not the deploy, if the configuration is ever wrong again.
RUN apache2ctl configtest 2>&1 | tail -2

# .htaccess is ignored unless Apache is told to read it, and both of this
# application's rewrite rules live in .htaccess files. Without this the site
# returns 404 on every deep link and every API call — which looks like a
# broken application rather than a missing directive.
RUN printf '%s\n' \
    '<Directory /var/www/html>' \
    '    AllowOverride All' \
    '    Require all granted' \
    '</Directory>' \
    > /etc/apache2/conf-available/pawsandfound.conf \
    && a2enconf pawsandfound

# Production error handling: never display, always log. A PHP warning printed
# into a JSON response breaks the JSON and puts file paths on somebody's screen.
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && printf '%s\n' \
       'upload_max_filesize = 8M' \
       'post_max_size = 32M' \
       'expose_php = Off' \
       > "$PHP_INI_DIR/conf.d/pawsandfound.ini"

WORKDIR /var/www/html

# The built site at the root, the API beneath it.
COPY --from=build /build/dist/ ./
COPY api/ ./api/

# public/.htaccess is written for the local deployment, which lives at
# /pawsandfound/. At a domain root the base is /. These two disagreeing is the
# single most likely way a first deployment fails, and the symptom is a blank
# page with 404s on /assets/ — so it is corrected here rather than left to
# somebody to remember.
RUN sed -i 's#RewriteBase /pawsandfound/#RewriteBase /#' .htaccess \
    && grep -q 'RewriteBase /$' .htaccess

# The volume mounts OVER api/uploads at run time. The directory exists here so
# the image is still correct without one, and a copy of its .htaccess is kept
# outside the mount point so the entrypoint can restore it on a first deploy.
# That file is what stops an uploaded file being executed: an empty volume
# must not mean an unprotected one.
RUN mkdir -p api/uploads && \
    cp api/uploads/.htaccess api/uploads.htaccess.bak && \
    chown -R www-data:www-data /var/www/html

# Session storage, outside the document root. Created here so the image runs
# correctly with no volume mounted; a Railway volume mounts over it in
# production and the entrypoint re-applies the ownership and mode, because a
# mounted volume arrives owned by root.
RUN mkdir -p /var/lib/pawsandfound-sessions \
    && chown www-data:www-data /var/lib/pawsandfound-sessions \
    && chmod 700 /var/lib/pawsandfound-sessions

ENV SESSION_SAVE_PATH=/var/lib/pawsandfound-sessions

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV APP_ENV=production

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["apache2-foreground"]
