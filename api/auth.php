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

    if ($method === 'POST' && $action === 'register') {
        auth_register();
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

function auth_register(): never
{
    $body = request_body();
    $fullName = trim((string) ($body['full_name'] ?? ''));
    $email = trim((string) ($body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    $contact = trim((string) ($body['contact_number'] ?? ''));

    // Every problem is collected before answering, so the form can mark all of
    // the bad fields at once instead of revealing them one submission at a time.
    $errors = [];

    if ($fullName === '') {
        $errors['full_name'] = 'Enter your name.';
    } elseif (mb_strlen($fullName) > 120) {
        $errors['full_name'] = 'That name is too long (120 characters maximum).';
    }

    if ($email === '') {
        $errors['email'] = 'Enter your email address.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
        $errors['email'] = 'Enter a valid email address.';
    }

    if (strlen($password) < 8) {
        $errors['password'] = 'Use at least 8 characters.';
    } elseif (strlen($password) > 72) {
        // bcrypt ignores everything past 72 bytes, so a longer password would
        // not mean what the person choosing it thinks it means.
        $errors['password'] = 'Use 72 characters or fewer.';
    }

    if ($contact !== '' && mb_strlen($contact) > 30) {
        $errors['contact_number'] = 'That phone number is too long.';
    }

    if ($errors !== []) {
        json_error('Please check the highlighted fields.', 422, ['fields' => $errors]);
    }

    // The role is never read from the request body. A new account is always an
    // ordinary user; accepting a role here would let anyone register as an
    // administrator by adding one line to the request.
    $statement = db()->prepare(
        "INSERT INTO users (full_name, email, password_hash, contact_number, role, account_status)
              VALUES (:full_name, :email, :password_hash, :contact_number, 'user', 'active')"
    );

    try {
        $statement->execute([
            ':full_name' => $fullName,
            ':email' => $email,
            // Never the password itself. PASSWORD_DEFAULT is bcrypt here, the
            // same algorithm the seeded accounts were hashed with.
            ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
            ':contact_number' => $contact === '' ? null : $contact,
        ]);
    } catch (PDOException $exception) {
        // 23000 is the integrity-constraint class, which here can only be the
        // unique index on email. Letting the database decide closes the gap
        // between checking and inserting, where two people registering the same
        // address at the same moment would both pass a prior SELECT.
        if ($exception->getCode() === '23000') {
            json_error('An account already uses that email address.', 409, [
                'fields' => ['email' => 'An account already uses that email address.'],
            ]);
        }

        throw $exception;
    }

    $userId = (int) db()->lastInsertId();

    // Registering signs you in, so nobody has to retype the password they just
    // chose. Same fresh session id as auth_login(), for the same reason.
    start_session();
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;

    json_response([
        'user' => [
            'user_id' => $userId,
            'full_name' => $fullName,
            'email' => $email,
            'role' => 'user',
        ],
    ], 201);
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
