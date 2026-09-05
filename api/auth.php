<?php
/**
 * Authentication: sign in, sign out, and "who am I".
 *
 * Passwords are never compared with `===`. They are checked with
 * password_verify() against the bcrypt hash in the database, which is both
 * correct and resistant to timing attacks.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

function handle_auth(string $method, ?string $action): never
{
    if ($method === 'POST' && $action === 'login') {
        auth_login();
    }

    if ($method === 'POST' && $action === 'logout') {
        auth_logout();
    }

    if ($method === 'GET' && $action === 'me') {
        auth_me();
    }

    json_error('No such endpoint.', 404);
}

function auth_login(): never
{
    $body = request_body();
    $email = trim((string) ($body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');

    if ($email === '' || $password === '') {
        json_error('Enter your email address and password.', 422);
    }

    $statement = db()->prepare(
        'SELECT user_id, full_name, email, password_hash, role, account_status
           FROM users
          WHERE email = :email'
    );
    $statement->execute([':email' => $email]);
    $user = $statement->fetch();

    // One message for "no such account" and "wrong password" on purpose. Telling
    // them apart would confirm which email addresses are registered.
    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_error('That email address and password do not match.', 401);
    }

    if ($user['account_status'] === 'suspended') {
        json_error('This account has been suspended. Contact an administrator.', 403);
    }

    start_session();

    // A new session id on sign-in, so a session cookie captured beforehand
    // cannot be reused afterwards (session fixation).
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['user_id'];

    json_response([
        'user' => [
            'user_id' => (int) $user['user_id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => $user['role'],
        ],
    ]);
}

function auth_logout(): never
{
    start_session();

    $_SESSION = [];

    // Clear the cookie too, or the browser keeps sending a dead session id.
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'],
            $params['secure'], $params['httponly']);
    }

    session_destroy();

    json_response(['ok' => true]);
}

function auth_me(): never
{
    $user = current_user();

    // Not an error: the public pages call this on load to find out whether
    // anyone is signed in, and "nobody" is a normal answer.
    if ($user === null) {
        json_response(['user' => null]);
    }

    json_response([
        'user' => [
            'user_id' => (int) $user['user_id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'contact_number' => $user['contact_number'],
            'role' => $user['role'],
            'preferred_location' => $user['preferred_location'],
        ],
    ]);
}
