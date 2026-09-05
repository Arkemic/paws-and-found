<?php
/**
 * Shared helpers: responses, request input, sessions and the authorisation
 * guards every protected endpoint calls.
 *
 * Small on purpose. If a member has to explain this API during the defence,
 * this is the file they should be able to read in one sitting.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

// -----------------------------------------------------------------------------
// Responses
// -----------------------------------------------------------------------------

/** Send data as JSON and stop. Every endpoint ends here. */
function json_response(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');

    // Escaping slashes and unicode makes the output unreadable in the browser's
    // network tab for no benefit; both are safe to leave alone in JSON.
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send an error the frontend can display.
 *
 * The message is deliberately plain: it never contains SQL, file paths or
 * exception text, because those tell an attacker how the system is built.
 */
function json_error(string $message, int $status = 400, array $extra = []): never
{
    json_response(['error' => $message] + $extra, $status);
}

// -----------------------------------------------------------------------------
// Request input
// -----------------------------------------------------------------------------

/** Decode a JSON request body. Returns an empty array when there is none. */
function request_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        json_error('The request body was not valid JSON.', 400);
    }

    return $decoded;
}

/** A trimmed string from the query string, or null when absent or empty. */
function query_string_param(string $name): ?string
{
    $value = isset($_GET[$name]) && is_string($_GET[$name]) ? trim($_GET[$name]) : '';
    return $value === '' ? null : $value;
}

/** A positive integer from the query string, clamped to a sensible range. */
function query_int_param(string $name, int $default, int $min, int $max): int
{
    $value = filter_input(INPUT_GET, $name, FILTER_VALIDATE_INT);
    if ($value === false || $value === null) {
        return $default;
    }

    return max($min, min($max, $value));
}

/**
 * Reject a value that is not one of the allowed options.
 *
 * Used for anything that reaches an ENUM column or an ORDER BY clause, where a
 * value cannot be parameterised and therefore must be checked against a list we
 * control rather than trusted.
 */
function require_one_of(?string $value, array $allowed, string $field): ?string
{
    if ($value === null) {
        return null;
    }

    if (!in_array($value, $allowed, true)) {
        json_error("'{$field}' must be one of: " . implode(', ', $allowed), 422);
    }

    return $value;
}

// -----------------------------------------------------------------------------
// Sessions and authentication
// -----------------------------------------------------------------------------

/** Start the session with cookie settings suitable for the SPA talking to it. */
function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_set_cookie_params([
        'httponly' => true,   // JavaScript cannot read it, so XSS cannot steal it
        'samesite' => 'Lax',
        'path' => '/',
        // 'secure' => true — switch on when the site is served over HTTPS.
    ]);

    session_start();
}

/** The signed-in user as a row from `users`, or null. */
function current_user(): ?array
{
    start_session();

    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $statement = db()->prepare(
        'SELECT user_id, full_name, email, contact_number, role, account_status,
                preferred_location, created_at
           FROM users
          WHERE user_id = :id'
    );
    $statement->execute([':id' => $_SESSION['user_id']]);
    $user = $statement->fetch();

    if (!$user) {
        // The account was deleted while the session lived on.
        session_destroy();
        return null;
    }

    // A suspended account keeps its session cookie but loses its access.
    if ($user['account_status'] === 'suspended') {
        return null;
    }

    return $user;
}

/** Stop unless somebody is signed in. Returns the user so callers can use it. */
function require_login(): array
{
    $user = current_user();

    if ($user === null) {
        json_error('You need to be signed in to do that.', 401);
    }

    return $user;
}

/**
 * Stop unless the signed-in user holds one of these roles.
 *
 * This is the real access control. The React route guard only keeps the
 * interface coherent — it is trivially bypassed, so every protected endpoint
 * has to check for itself.
 */
function require_role(string ...$roles): array
{
    $user = require_login();

    if (!in_array($user['role'], $roles, true)) {
        json_error('Your account does not have access to that.', 403);
    }

    return $user;
}

// -----------------------------------------------------------------------------
// Cross-origin requests
// -----------------------------------------------------------------------------

/**
 * Allow the React dev server to call this API with its session cookie.
 *
 * In production the built site is served by Apache from the same origin and
 * none of this applies — it exists so `npm run dev` works.
 */
function send_cors_headers(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Vary: Origin');
    }

    // The browser asks permission before sending a PUT or a JSON POST.
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
