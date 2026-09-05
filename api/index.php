<?php
/**
 * Paws&Found API — the front controller.
 *
 * Every request reaches this file (see .htaccess) and is dispatched by its
 * first path segment. Deliberately a small, readable router rather than a
 * framework: about thirty lines, and a member can trace any request through it
 * during the defence.
 *
 *   GET    /api/reports           list, with search, filters, sorting, paging
 *   GET    /api/reports/12        one report with photos, location and history
 *   POST   /api/auth/login        sign in
 *   POST   /api/auth/logout       sign out
 *   GET    /api/auth/me           who am I
 *   GET    /api/categories        species list
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

send_cors_headers();

// Work out the path relative to this API, whatever folder it is installed in.
// .htaccess passes it as ?_route=..., and the query string fallback keeps the
// API usable if mod_rewrite is ever unavailable.
$route = $_GET['_route'] ?? '';
$segments = array_values(array_filter(explode('/', trim((string) $route, '/')), fn ($s) => $s !== ''));

$resource = $segments[0] ?? '';
$identifier = $segments[1] ?? null;
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    switch ($resource) {
        case '':
            json_response([
                'name' => 'Paws&Found API',
                'endpoints' => ['/auth', '/reports', '/matches', '/notifications', '/users', '/categories', '/moderation'],
            ]);

        case 'auth':
            require __DIR__ . '/auth.php';
            handle_auth($method, $identifier);

        case 'reports':
            require __DIR__ . '/reports.php';
            handle_reports($method, $identifier);

        case 'matches':
            require __DIR__ . '/matches.php';
            handle_matches($method, $identifier);

        case 'notifications':
            require __DIR__ . '/notifications.php';
            handle_notifications($method, $identifier);

        case 'users':
            require __DIR__ . '/users.php';
            handle_users($method, $identifier);

        case 'categories':
            require __DIR__ . '/categories.php';
            handle_categories($method, $identifier);

        case 'moderation':
            require __DIR__ . '/moderation.php';
            handle_moderation($method, $identifier);

        default:
            json_error('No such endpoint.', 404);
    }
} catch (PDOException $exception) {
    // The real message goes to the server log, never to the browser: it would
    // otherwise disclose table names and query structure.
    error_log('[pawsandfound] ' . $exception->getMessage());
    json_error('The server could not complete that request.', 500);
}
