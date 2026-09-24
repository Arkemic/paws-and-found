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

/**
 * How many times a sign-in may fail before the account is locked and an
 * administrator has to unlock it.
 *
 * Counted per email address in the `login_attempts` table, so the count
 * survives a browser refresh, a new browser and a different device — it is not
 * kept in the session, which the person failing to sign in controls.
 */
const MAX_LOGIN_ATTEMPTS = 3;

/**
 * The date the privacy notice last changed.
 *
 * Stored against each agreement in `privacy_consents`, so a change to the
 * wording can be told apart from the version somebody actually agreed to.
 * Change this whenever src/pages/public/PrivacyPage.jsx changes in a way that
 * alters what people are agreeing to.
 */
const PRIVACY_NOTICE_VERSION = '2026-09-23';
