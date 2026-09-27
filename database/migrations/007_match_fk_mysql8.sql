-- =============================================================================
-- 007 — make match_claims importable on MySQL 8
--
-- Found while rehearsing the Railway import against a real MySQL 8.0 rather
-- than against XAMPP's MariaDB. `schema.sql` stopped dead:
--
--   ERROR 3823 (HY000) at line 321: Column 'lost_report_id' cannot be used in
--   a check constraint 'chk_match_distinct': needed in a foreign key
--   constraint 'fk_match_lost' referential action.
--
-- MySQL 8 refuses a CHECK constraint over a column that a foreign key's
-- referential action could rewrite. `chk_match_distinct` is over
-- lost_report_id and found_report_id, and both keys carried ON UPDATE CASCADE.
-- MariaDB permits the combination, which is why this survived every local
-- import and would have failed on the host.
--
-- Something had to give, and it is not the CHECK. ON UPDATE CASCADE means
-- "follow the parent key if it changes"; report_id is an AUTO_INCREMENT
-- surrogate that nothing ever updates, so the clause has never done anything.
-- `chk_match_distinct` is the database's own guarantee that a report cannot be
-- paired with itself, it is demonstrated in the defence documents, and it is
-- the first of the three refusals in the cheat sheet.
--
-- ON DELETE CASCADE is kept. Deleting a report still takes its pairings with
-- it, which is the behaviour anybody actually relies on.
--
-- The foreign key count does not change: 24 before, 24 after.
--
-- One cosmetic difference this leaves behind: re-adding a foreign key puts its
-- index at the END of the key list, so SHOW CREATE TABLE on a database that ran
-- this migration prints `KEY fk_match_found` in a different place than a fresh
-- import of schema.sql does. The set of keys and constraints is identical — only
-- the order they are printed in differs. Worth knowing before somebody diffs the
-- two and thinks they have found a drift.
--
-- Run against an existing database:
--   mysql -u root -h 127.0.0.1 -P 3307 pawsandfound < 007_match_fk_mysql8.sql
-- =============================================================================

USE pawsandfound;

ALTER TABLE match_claims DROP FOREIGN KEY fk_match_lost;
ALTER TABLE match_claims DROP FOREIGN KEY fk_match_found;

ALTER TABLE match_claims
  ADD CONSTRAINT fk_match_lost
    FOREIGN KEY (lost_report_id) REFERENCES pet_reports (report_id)
    ON DELETE CASCADE;

ALTER TABLE match_claims
  ADD CONSTRAINT fk_match_found
    FOREIGN KEY (found_report_id) REFERENCES pet_reports (report_id)
    ON DELETE CASCADE;


INSERT INTO schema_migrations (version) VALUES ('007')
  ON DUPLICATE KEY UPDATE version = version;
