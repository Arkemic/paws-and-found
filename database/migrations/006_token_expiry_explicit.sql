-- =============================================================================
-- 006 — stop auth_tokens.expires_at from rewriting itself
--
-- `expires_at` was declared `TIMESTAMP NOT NULL` with no DEFAULT. In MySQL and
-- MariaDB the FIRST timestamp column declared that way is silently given both
-- `DEFAULT CURRENT_TIMESTAMP` and `ON UPDATE CURRENT_TIMESTAMP`. The second
-- half is the problem: every UPDATE to the row resets the expiry to now.
--
-- What that looked like — a one-hour reset link, spent immediately:
--
--   created_at           expires_at           minutes_valid
--   2026-09-27 02:22:27  2026-09-27 03:22:27  60     <- as issued
--   ... UPDATE auth_tokens SET used_at = NOW() ...
--   2026-09-27 02:22:27  2026-09-27 02:22:27  0      <- after spending it
--
-- Nothing was exploitable. Both statements that write to this table
-- (`token_invalidate` and `token_consume` in api/tokens.php) also set
-- `used_at`, and both require `used_at IS NULL`, so neither can touch a token
-- that stays live — a link could never have its life extended.
--
-- It is still wrong, for two reasons. The stored expiry of every spent token
-- is a lie, so the table cannot be used to show that the one-hour rule is
-- real. And the safety above is accidental: it holds only because the two
-- existing statements happen to spend the row. Any later statement that
-- touches an unspent token — a cleanup job, an admin screen, a column added
-- next term — would extend every live link without anybody writing a line of
-- code that says so.
--
-- Naming the DEFAULT explicitly suppresses the implicit ON UPDATE. The DEFAULT
-- itself is never used: `token_issue()` always supplies `expires_at`.
--
-- Run against an existing database:
--   mysql -u root -h 127.0.0.1 -P 3307 pawsandfound < 006_token_expiry_explicit.sql
-- =============================================================================

USE pawsandfound;

ALTER TABLE auth_tokens
  MODIFY COLUMN expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;


INSERT INTO schema_migrations (version) VALUES ('006')
  ON DUPLICATE KEY UPDATE version = version;
