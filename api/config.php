<?php
/**
 * Paws&Found API — configuration.
 *
 * One file holds every setting the API needs, so there is exactly one place to
 * look when something is pointing at the wrong database or the wrong origin.
 *
 * WHERE THE VALUES COME FROM
 *
 * Everything below is a default for a developer's laptop. A deployed copy
 * overrides what it needs in `api/config.local.php`, which is NOT in git —
 * a hosted database password has no business in a public repository, and a
 * classmate cloning this should not have to undo somebody else's credentials
 * before the project runs.
 *
 * Copy `config.example.php` to `config.local.php` on the server and fill it in.
 * Anything it does not define keeps the default from this file.
 *
 * NOTE on the port: this XAMPP installation runs MySQL on 3307, not the usual
 * 3306, because a separate MySQL 8.0 Windows service holds 3306. Most machines
 * — and every host — use 3306, which is why it is worth overriding rather than
 * assuming.
 */

declare(strict_types=1);

// Read first, so every default below can step aside for it.
$localConfig = __DIR__ . '/config.local.php';
if (is_file($localConfig)) {
    require_once $localConfig;
}

/**
 * `production` or `development`. Set to production in config.local.php on a
 * deployed copy: it is what switches PHP's error display off and the session
 * cookie's Secure flag on.
 */
defined('APP_ENV') || define('APP_ENV', getenv('APP_ENV') ?: 'development');

/**
 * Read a setting from the environment, falling back to a default.
 *
 * A hosted container has no config.local.php — credentials arrive as
 * environment variables, which is what keeps them out of the image and out of
 * git. Railway's MySQL service publishes MYSQLHOST, MYSQLPORT and the rest, so
 * both spellings are accepted and the deployment needs no variable mapping.
 *
 * Order: config.local.php (already loaded above) wins, then the environment,
 * then the local default. So a developer's machine behaves exactly as it did
 * before — nothing is set, so nothing changes.
 */
function env_setting(string $name, string $alias, string|int $fallback): string|int
{
    foreach ([$name, $alias] as $key) {
        $value = getenv($key);
        if ($value !== false && $value !== '') {
            return $value;
        }
    }

    return $fallback;
}

defined('DB_HOST') || define('DB_HOST', env_setting('DB_HOST', 'MYSQLHOST', '127.0.0.1'));
defined('DB_PORT') || define('DB_PORT', (int) env_setting('DB_PORT', 'MYSQLPORT', 3307));
defined('DB_NAME') || define('DB_NAME', env_setting('DB_NAME', 'MYSQLDATABASE', 'pawsandfound'));
defined('DB_USER') || define('DB_USER', env_setting('DB_USER', 'MYSQLUSER', 'root'));
// XAMPP's default is an empty password. A deployed one never is, and never
// lives in this file — it arrives as MYSQL_ROOT_PASSWORD or MYSQLPASSWORD.
defined('DB_PASS') || define('DB_PASS', env_setting('DB_PASS', 'MYSQLPASSWORD', ''));

/**
 * Where the React development server runs. The browser will not send or accept
 * cookies across origins unless the server names the origin exactly — a
 * wildcard is not allowed once credentials are involved, which is why this is a
 * fixed list rather than '*'.
 *
 * A deployed copy serves the built site and the API from the SAME origin, so
 * none of this applies there and the list stays empty. That is the whole
 * reason for deploying them together: no cross-origin requests means no CORS
 * to get wrong, and no third-party cookie rules to fall foul of.
 */
defined('ALLOWED_ORIGINS') || define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]);

/** Rows per page when a request does not ask for a specific size. */
defined('DEFAULT_PAGE_SIZE') || define('DEFAULT_PAGE_SIZE', 9);
defined('MAX_PAGE_SIZE') || define('MAX_PAGE_SIZE', 50);

/**
 * How many times a sign-in may fail before the account is locked and an
 * administrator has to unlock it.
 *
 * Counted per email address in the `login_attempts` table, so the count
 * survives a browser refresh, a new browser and a different device — it is not
 * kept in the session, which the person failing to sign in controls.
 */
defined('MAX_LOGIN_ATTEMPTS') || define('MAX_LOGIN_ATTEMPTS', 3);

/**
 * The date the privacy notice last changed.
 *
 * Stored against each agreement in `privacy_consents`, so a change to the
 * wording can be told apart from the version somebody actually agreed to.
 * Change this whenever src/pages/public/PrivacyPage.jsx changes in a way that
 * alters what people are agreeing to.
 */
// -----------------------------------------------------------------------------
// Session lifetime
//
// The browser is not the security control, so both of these are enforced on the
// server, in current_user(), on every authenticated request.
//
// Idle is deliberately generous. Somebody composing a lost-pet description with
// a distressed household around them must not lose it, and a short idle timeout
// on a public form is a usability failure dressed as security. The absolute
// lifetime is the one that actually bounds a forgotten administrator session on
// a shared laptop.
// -----------------------------------------------------------------------------
defined('SESSION_IDLE_TIMEOUT') || define('SESSION_IDLE_TIMEOUT', 3600);        // 1 hour
defined('SESSION_ABSOLUTE_TIMEOUT') || define('SESSION_ABSOLUTE_TIMEOUT', 28800); // 8 hours

defined('PRIVACY_NOTICE_VERSION') || define('PRIVACY_NOTICE_VERSION', '2026-09-25');

/**
 * In production, PHP must never print anything.
 *
 * A warning or a notice printed into a JSON response does two bad things at
 * once: it breaks the JSON, so the page reports a nonsense error, and it puts
 * our file paths on somebody else's screen. Many shared hosts leave
 * display_errors ON by default, so this is not a theoretical worry.
 *
 * The errors still happen and are still recorded — they go to the host's error
 * log, where they belong.
 */
if (APP_ENV === 'production') {
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    ini_set('log_errors', '1');
} else {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}
