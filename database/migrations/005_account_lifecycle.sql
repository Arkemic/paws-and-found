-- =============================================================================
-- 005 — proving an email address, and getting back in without an administrator
--
-- Three things the account model could not do:
--
--   say whether an email address was ever proved to belong to the person
--   let somebody who forgot their password recover without a DBA
--   change an email address without trusting the new one on sight
--
-- Verification is NOT another `account_status`. A suspended account and an
-- unverified one are different facts about different things, and overloading
-- one column would mean an administrator reinstating somebody accidentally
-- marks their address proved. They stay separate:
--
--   account_status      active | suspended | locked   — what an admin decides
--   email_verified_at   a timestamp or NULL           — what the person proved
--
-- Run against an existing database:
--   mysql -u root -h 127.0.0.1 -P 3307 pawsandfound < 005_account_lifecycle.sql
-- =============================================================================

USE pawsandfound;

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
ALTER TABLE users
  -- NULL means "never proved". A timestamp is more useful than a boolean: it
  -- answers "when", which is the question asked after the fact.
  ADD COLUMN email_verified_at TIMESTAMP NULL DEFAULT NULL AFTER email,

  -- An address the person has asked to move to and not yet proved. The column
  -- above still governs; this one is a request, not an identity.
  ADD COLUMN pending_email VARCHAR(190) NULL DEFAULT NULL AFTER email_verified_at,

  -- Bumped when every existing session for this account must stop working —
  -- today only a password reset does that. Sessions are files on disk and
  -- cannot be enumerated safely, so instead each session remembers the number
  -- it signed in under and current_user() compares it on every request. The
  -- database stays the authority, which is the same rule the role and the
  -- account status already follow.
  ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 1 AFTER account_status;

-- Every account that already exists is treated as proved.
--
-- The alternative is a deployment that locks out all ten demonstration
-- accounts, including both administrators, the moment it goes live — with the
-- recovery path being the email system that has just been switched on. Their
-- addresses are fictional and will never receive anything.
--
-- created_at rather than NOW(), so the row does not claim the address was
-- proved during a migration it had nothing to do with.
UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL;


-- -----------------------------------------------------------------------------
-- auth_tokens — one table for all three one-time links
--
-- The RAW token goes in the email and is never written down. What is stored is
-- a SHA-256 of it, so a copy of this table is not a set of working links: an
-- attacker with the database still cannot verify an address or reset a
-- password. The same reasoning as password_hash, applied to the thing that can
-- replace a password.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_tokens (
  token_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL,

  purpose      ENUM('email_verification','password_reset','email_change') NOT NULL,

  -- SHA-256 hex. Unique because a collision would let one link act on two
  -- accounts, and because the lookup is by hash.
  token_hash   CHAR(64) NOT NULL,

  -- Only for email_change: the address being proved, which is not yet the
  -- account's address. NULL for the other two purposes.
  target_email VARCHAR(190) NULL DEFAULT NULL,

  -- Corrected by 006 — see that file. Left as written so the history of
  -- what was actually applied on 27 September stays accurate.
  expires_at   TIMESTAMP NOT NULL,

  -- Set the moment it is spent. A used token is kept rather than deleted, so
  -- a replay can be recognised as a replay instead of as an unknown token.
  used_at      TIMESTAMP NULL DEFAULT NULL,

  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (token_id),
  UNIQUE KEY uq_auth_tokens_hash (token_hash),
  KEY idx_auth_tokens_user_purpose (user_id, purpose),
  KEY idx_auth_tokens_expiry (expires_at),

  -- CASCADE: a token belongs to an account and means nothing without it.
  -- Unlike audit_logs, there is nothing to preserve here after the fact.
  CONSTRAINT fk_auth_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- auth_rate_limits — how often an unauthenticated stranger may ask
--
-- Different from the three-attempt account lock, which protects ONE account
-- from guessing. This protects the SYSTEM from somebody registering a thousand
-- accounts or using the password-reset form as a mailing service.
--
-- No foreign key and no domain meaning, so it is operational infrastructure
-- and, like schema_migrations, is deliberately not on the ERD.
--
-- The subject is stored as a keyed hash, never as a raw address or a raw IP:
-- the system needs to count, not to know who.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  rate_limit_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- 'register', 'resend_verification', 'forgot_password', …
  action            VARCHAR(40) NOT NULL,

  -- HMAC of the IP or the email address this limit counts.
  subject_hash      CHAR(64) NOT NULL,

  window_started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attempt_count     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                          ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (rate_limit_id),

  -- One row per action per subject. The insert-or-increment relies on this:
  -- two simultaneous requests cannot both create a row and both count 1.
  UNIQUE KEY uq_auth_rate_limits (action, subject_hash),
  KEY idx_auth_rate_limits_window (window_started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- Three more verbs for the audit trail
--
-- Appended, never reordered: MySQL stores an ENUM as the position of the word,
-- so moving one silently rewrites every row already in the table.
--
-- Tokens are NOT logged, in any form. The detail column is read by people and
-- a raw verification link in it would be a working link sitting in a table
-- administrators can read.
-- -----------------------------------------------------------------------------
ALTER TABLE audit_logs
  MODIFY COLUMN action ENUM(
    'login',
    'login_failed',
    'account_locked',
    'account_unlocked',
    'logout',
    'register',
    'role_changed',
    'account_suspended',
    'account_reinstated',
    'report_status_changed',
    'match_decided',
    'moderation_resolved',
    'category_changed',
    'email_verified',
    'email_change_completed',
    'password_reset'
  ) NOT NULL;


INSERT INTO schema_migrations (version) VALUES ('005')
  ON DUPLICATE KEY UPDATE version = version;
