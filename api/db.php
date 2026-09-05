<?php
/**
 * Database connection.
 *
 * PDO rather than mysqli, for one reason that matters more than any other:
 * named placeholders in prepared statements. Every query in this API sends the
 * SQL and the values separately, so a value can never be read as SQL. That is
 * what protects us from injection — not escaping, not filtering the input.
 *
 * The connection is created once and reused for the life of the request.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

function db(): PDO
{
    // Held between calls within the same request; PHP throws the whole thing
    // away when the request ends.
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        DB_HOST,
        DB_PORT,
        DB_NAME
    );

    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        // Throw on error instead of returning false. Silent failures are how
        // bugs survive to the demonstration.
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,

        // Return plain associative arrays; json_encode understands them.
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

        // Use MySQL's real prepared statements rather than PDO emulating them
        // by building a string. With emulation off, the value genuinely never
        // touches the SQL text.
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
