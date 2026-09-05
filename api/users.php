<?php
/**
 * Accounts.
 *
 *   GET   /api/users        every account (administrators only)
 *   GET   /api/users/5      one account
 *   PATCH /api/users/5      change a role or suspend an account (administrators)
 *
 * Nothing here is public. A person's email and phone number are not browsing
 * material, so every route requires a signed-in account and the listing
 * requires an administrator.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

function handle_users(string $method, ?string $identifier): never
{
    if ($method === 'GET' && $identifier === null) {
        users_list();
    }

    if (ctype_digit((string) $identifier)) {
        $id = (int) $identifier;

        if ($method === 'GET') user_detail($id);
        if ($method === 'PATCH') user_update($id);
    }

    json_error('No such endpoint.', 404);
}

function users_list(): never
{
    require_role('admin');

    $where = [];
    $params = [];

    $role = require_one_of(query_string_param('role'), ['user', 'staff', 'admin'], 'role');
    if ($role !== null) {
        $where[] = 'role = :role';
        $params[':role'] = $role;
    }

    $status = require_one_of(query_string_param('status'), ['active', 'suspended'], 'status');
    if ($status !== null) {
        $where[] = 'account_status = :status';
        $params[':status'] = $status;
    }

    if (($search = query_string_param('q')) !== null) {
        // One placeholder per column: a native prepared statement binds each
        // marker exactly once.
        $where[] = '(full_name LIKE :q1 OR email LIKE :q2)';
        $params[':q1'] = '%' . $search . '%';
        $params[':q2'] = '%' . $search . '%';
    }

    $clause = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

    $statement = db()->prepare(
        "SELECT user_id, full_name, email, contact_number, role, account_status,
                preferred_location, created_at
           FROM users
           {$clause}
           ORDER BY full_name"
    );
    $statement->execute($params);

    json_response(['data' => array_map('shape_user', $statement->fetchAll())]);
}

/**
 * One account.
 *
 * Any signed-in account may look one up — coordinators need the names of the
 * people on a case. Contact details are only included for staff and
 * administrators, who need them to coordinate a handover.
 */
function user_detail(int $id): never
{
    $viewer = require_login();

    $statement = db()->prepare(
        'SELECT user_id, full_name, email, contact_number, role, account_status,
                preferred_location, created_at
           FROM users
          WHERE user_id = :id'
    );
    $statement->execute([':id' => $id]);
    $user = $statement->fetch();

    if (!$user) {
        json_error('That account does not exist.', 404);
    }

    $privileged = in_array($viewer['role'], ['staff', 'admin'], true)
        || (int) $viewer['user_id'] === $id;

    json_response(['data' => shape_user($user, $privileged)]);
}

/** Change a role or suspend an account. Administrators only. */
function user_update(int $id): never
{
    $admin = require_role('admin');
    $body = request_body();

    // An administrator must not be able to lock themselves out, which is what
    // demoting or suspending your own account would do.
    if ((int) $admin['user_id'] === $id) {
        json_error('You cannot change your own role or suspend your own account.', 422);
    }

    $exists = db()->prepare('SELECT user_id FROM users WHERE user_id = :id');
    $exists->execute([':id' => $id]);
    if (!$exists->fetch()) {
        json_error('That account does not exist.', 404);
    }

    $sets = [];
    $params = [':id' => $id];

    if (array_key_exists('role', $body)) {
        $role = require_one_of(trim((string) $body['role']), ['user', 'staff', 'admin'], 'role');
        $sets[] = 'role = :role';
        $params[':role'] = $role;
    }

    if (array_key_exists('account_status', $body)) {
        $status = require_one_of(trim((string) $body['account_status']), ['active', 'suspended'], 'account_status');
        $sets[] = 'account_status = :status';
        $params[':status'] = $status;
    }

    if ($sets === []) {
        json_error('Nothing to change.', 422);
    }

    $statement = db()->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE user_id = :id');
    $statement->execute($params);

    user_detail($id);
}

/** A user row as JSON. Contact details only when the viewer should see them. */
function shape_user(array $row, bool $includeContact = true): array
{
    $user = [
        'user_id' => (int) $row['user_id'],
        'full_name' => $row['full_name'],
        'role' => $row['role'],
        'account_status' => $row['account_status'],
        'preferred_location' => $row['preferred_location'],
        'created_at' => $row['created_at'],
    ];

    if ($includeContact) {
        $user['email'] = $row['email'];
        $user['contact_number'] = $row['contact_number'];
    }

    return $user;
}
