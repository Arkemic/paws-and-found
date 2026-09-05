<?php
/**
 * Paws&Found API — configuration.
 *
 * One file holds every setting the API needs, so there is exactly one place to
 * look when something is pointing at the wrong database or the wrong origin.
 *
 * NOTE: this XAMPP installation runs MySQL on port 3307, not the default 3306,
 * because a separate MySQL 8.0 Windows service holds 3306.
 */

declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_PORT = 3307;
const DB_NAME = 'pawsandfound';
const DB_USER = 'root';
const DB_PASS = '';          // XAMPP's default. Set one before deploying anywhere real.

/**
 * Where the React development server runs. The browser will not send or accept
 * cookies across origins unless the server names the origin exactly — a
 * wildcard is not allowed once credentials are involved, which is why this is a
 * fixed list rather than '*'.
 */
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

/** Rows per page when a request does not ask for a specific size. */
const DEFAULT_PAGE_SIZE = 9;
const MAX_PAGE_SIZE = 50;
