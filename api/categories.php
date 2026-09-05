<?php
/**
 * Pet categories — the species list an administrator manages.
 *
 * Public: the report form and the Explore filters both need it before anyone
 * signs in.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

function handle_categories(string $method, ?string $identifier): never
{
    if ($method !== 'GET' || $identifier !== null) {
        json_error('No such endpoint.', 404);
    }

    // Only active categories: a retired one must not appear on a new report,
    // but reports already filed against it keep working.
    $statement = db()->query(
        'SELECT category_id, category_code, category_name
           FROM pet_categories
          WHERE is_active = TRUE
          ORDER BY category_name'
    );

    json_response(['data' => array_map(fn ($c) => [
        'category_id' => (int) $c['category_id'],
        'code' => $c['category_code'],
        'label' => $c['category_name'],
    ], $statement->fetchAll())]);
}
