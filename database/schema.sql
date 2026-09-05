-- =============================================================================
-- Paws&Found — MySQL schema
-- ITS122P – AM2 Final Project · Phase 2 (Database + Backend)
--
-- Target: MariaDB 10.4+ (what XAMPP ships) or MySQL 8, via phpMyAdmin.
-- Verified imported on MariaDB 10.4.32 (XAMPP) on 2026-08-19:
--   11 tables, 20 foreign keys, 2 CHECK constraints, all enforced.
--
-- NOTE: this XAMPP installation runs MySQL on PORT 3307, not the default 3306,
-- because a separate MySQL 8.0 Windows service holds 3306. phpMyAdmin is already
-- configured for it. From the command line you must pass the port:
--   mysql -u root -h 127.0.0.1 -P 3307 -e "source database/schema.sql"
-- Engine InnoDB throughout, because the project relies on foreign keys and
-- transactions. MyISAM ignores foreign keys silently.
--
-- 11 tables. The guide requires a minimum of 8; the extra three
-- (match_signals, notifications, moderation_cases) exist because three of the
-- application's workspaces have nowhere to store their data without them.
--
-- Every ENUM below matches the values already used in the frontend
-- (src/constants/index.js) exactly, so the API does not have to translate.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS pawsandfound
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pawsandfound;

-- Dropped in reverse dependency order so the file can be re-run while we build.
DROP TABLE IF EXISTS moderation_cases;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS status_logs;
DROP TABLE IF EXISTS match_signals;
DROP TABLE IF EXISTS match_claims;
DROP TABLE IF EXISTS report_images;
DROP TABLE IF EXISTS pet_reports;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS pet_breeds;
DROP TABLE IF EXISTS pet_categories;
DROP TABLE IF EXISTS users;


-- -----------------------------------------------------------------------------
-- 1. users
--
-- `password_hash`, never `password`. PHP's password_hash() with the default
-- algorithm returns 60 characters today, but the length is documented as
-- variable, so 255 is the recommended column width.
--
-- `account_status` is how an administrator suspends someone. Accounts are
-- suspended, never deleted, because their reports and case history must remain
-- readable (see the ON DELETE RESTRICT on pet_reports.user_id).
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  user_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name       VARCHAR(120)  NOT NULL,
  email           VARCHAR(190)  NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  contact_number  VARCHAR(30)       NULL,
  role            ENUM('user','staff','admin') NOT NULL DEFAULT 'user',
  account_status  ENUM('active','suspended')   NOT NULL DEFAULT 'active',
  preferred_location VARCHAR(120)   NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),
  -- 190 characters so the unique index fits within InnoDB's key limit on
  -- utf8mb4 in older MySQL versions.
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 2. pet_categories  — the species list an administrator manages
--
-- This is the "manage categories" function the guide requires of the
-- Administrator role, and it is already built in the admin workspace.
--
-- `is_active` retires a category without deleting it, because reports already
-- filed against it must keep working.
-- -----------------------------------------------------------------------------
CREATE TABLE pet_categories (
  category_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_code VARCHAR(30)  NOT NULL,   -- 'dog', 'cat', … matches SPECIES in the frontend
  category_name VARCHAR(60)  NOT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,

  PRIMARY KEY (category_id),
  UNIQUE KEY uq_categories_code (category_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 3. pet_breeds — breeds belonging to a category
--
-- Kept from the proposal ERD: it gives a genuine two-level hierarchy
-- (category → breed) and is a normalisation example we can point at.
--
-- NOTE the difference from the draft ERD: a report's breed is OPTIONAL. A
-- finder usually cannot identify a breed, and the report form says as much
-- ("An honest guess is fine"). See pet_reports.breed_id.
-- -----------------------------------------------------------------------------
CREATE TABLE pet_breeds (
  breed_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  breed_name  VARCHAR(80)  NOT NULL,

  PRIMARY KEY (breed_id),
  UNIQUE KEY uq_breed_per_category (category_id, breed_name),
  CONSTRAINT fk_breeds_category
    FOREIGN KEY (category_id) REFERENCES pet_categories (category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 4. locations
--
-- Coordinates are barangay-level on purpose. `precision` records that, and the
-- report detail page draws a 400 m circle so the imprecision is visible rather
-- than implied. An exact home address is never stored (CLAUDE.md §14).
-- -----------------------------------------------------------------------------
CREATE TABLE locations (
  location_id INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  label       VARCHAR(160)       NULL,   -- "Near Poblacion Public Market, Barangay Poblacion"
  city        VARCHAR(80)    NOT NULL,
  province    VARCHAR(80)    NOT NULL,
  latitude    DECIMAL(9,6)       NULL,   -- NULL when the reporter skipped the map pin
  longitude   DECIMAL(9,6)       NULL,
  `precision` ENUM('approximate','exact') NOT NULL DEFAULT 'approximate',

  PRIMARY KEY (location_id),
  KEY idx_locations_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 5. pet_reports — the centre of the system
--
-- Two deliberate differences from the proposal ERD:
--
--   a) `category_id` sits directly on the report and is NOT NULL. In the draft
--      it was only reachable through the breed, which meant a report with an
--      unknown breed could not record its species. Species is a mandatory gate
--      in the matching algorithm, so that would have broken matching for most
--      found reports.
--
--   b) `breed_id` is NULLABLE for the same reason.
--
-- The contact preferences are three booleans rather than a table: there are
-- exactly three, they are always all present, and a join table would add work
-- without adding meaning (CLAUDE.md §15).
-- -----------------------------------------------------------------------------
CREATE TABLE pet_reports (
  report_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED NOT NULL,          -- who filed it
  category_id       INT UNSIGNED NOT NULL,          -- species: a matching gate
  breed_id          INT UNSIGNED     NULL,          -- optional, often unknown
  location_id       INT UNSIGNED NOT NULL,
  assigned_staff_id INT UNSIGNED     NULL,          -- coordinator handling the case

  report_type       ENUM('lost','found') NOT NULL,
  status            ENUM('active','possible_match','returned','closed')
                      NOT NULL DEFAULT 'active',

  -- A found report must not require a pet name: the finder does not know it.
  pet_name          VARCHAR(80)      NULL,
  pet_size          ENUM('small','medium','large')      NULL,
  pet_sex           ENUM('male','female','unknown') NOT NULL DEFAULT 'unknown',
  primary_color     VARCHAR(40)      NULL,
  secondary_color   VARCHAR(40)      NULL,
  distinct_features TEXT             NULL,   -- markings; weighted in matching
  description       TEXT             NULL,   -- "What the finder said"

  -- Found reports only; a finder can observe these, an owner cannot.
  has_collar        ENUM('yes','no','unknown') NOT NULL DEFAULT 'unknown',
  pet_condition     VARCHAR(160)     NULL,

  incident_date     DATE         NOT NULL,
  incident_time     TIME             NULL,   -- "around 07:50", often unknown

  allow_platform_contact BOOLEAN NOT NULL DEFAULT TRUE,
  show_phone             BOOLEAN NOT NULL DEFAULT FALSE,
  show_email             BOOLEAN NOT NULL DEFAULT FALSE,

  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (report_id),

  -- Reporters are suspended, not deleted, so their reports stay readable.
  CONSTRAINT fk_reports_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  -- Mirrors the rule already enforced in the admin UI: a category that is in
  -- use cannot be deleted, only deactivated.
  CONSTRAINT fk_reports_category
    FOREIGN KEY (category_id) REFERENCES pet_categories (category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_reports_breed
    FOREIGN KEY (breed_id) REFERENCES pet_breeds (breed_id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_reports_location
    FOREIGN KEY (location_id) REFERENCES locations (location_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_reports_staff
    FOREIGN KEY (assigned_staff_id) REFERENCES users (user_id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  -- Indexes chosen for the filters the Explore page actually offers, and for
  -- the sort + pagination the guide requires.
  KEY idx_reports_type_status (report_type, status),
  KEY idx_reports_incident_date (incident_date),
  KEY idx_reports_created_at (created_at),
  KEY idx_reports_category (category_id),
  KEY idx_reports_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 6. report_images
--
-- Photos are optional: a finder often has no chance to take one, and refusing
-- the report would lose the sighting entirely.
--
-- Only the file path is stored. The file itself goes in the upload directory —
-- storing images in the database bloats it and makes backups painful.
-- -----------------------------------------------------------------------------
CREATE TABLE report_images (
  image_id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id       INT UNSIGNED NOT NULL,
  image_path      VARCHAR(255) NOT NULL,
  alt_text        VARCHAR(180)     NULL,   -- described by the reporter; used by screen readers
  is_primary_photo BOOLEAN     NOT NULL DEFAULT FALSE,
  uploaded_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (image_id),
  CONSTRAINT fk_images_report
    FOREIGN KEY (report_id) REFERENCES pet_reports (report_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_images_report (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 7. match_claims — a possible pairing of one lost and one found report
--
-- `match_score` is the percentage the matching algorithm produced. The draft
-- ERD had no score column, but the score is the headline of the whole match
-- comparison screen ("85% possible match").
--
-- `staff_notes` is coordinator-only and is never sent to the API responses the
-- public pages use (CLAUDE.md §6.6).
-- -----------------------------------------------------------------------------
CREATE TABLE match_claims (
  match_id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  lost_report_id       INT UNSIGNED NOT NULL,
  found_report_id      INT UNSIGNED NOT NULL,
  submitted_by_user_id INT UNSIGNED     NULL,  -- NULL when the system raised it
  reviewed_by_user_id  INT UNSIGNED     NULL,  -- the coordinator who decided
  match_score          TINYINT UNSIGNED NOT NULL,
  match_status         ENUM('suggested','verification_requested','under_review',
                            'confirmed','rejected','dismissed')
                         NOT NULL DEFAULT 'suggested',
  proof_notes          TEXT             NULL,  -- what the claimant offered as proof
  staff_notes          TEXT             NULL,  -- coordinator only, never public
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (match_id),

  -- The same two reports must never be paired twice.
  UNIQUE KEY uq_match_pair (lost_report_id, found_report_id),

  -- A report cannot be matched with itself.
  CONSTRAINT chk_match_distinct CHECK (lost_report_id <> found_report_id),
  CONSTRAINT chk_match_score CHECK (match_score BETWEEN 0 AND 100),

  CONSTRAINT fk_match_lost
    FOREIGN KEY (lost_report_id) REFERENCES pet_reports (report_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_match_found
    FOREIGN KEY (found_report_id) REFERENCES pet_reports (report_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_match_submitted_by
    FOREIGN KEY (submitted_by_user_id) REFERENCES users (user_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_match_reviewed_by
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users (user_id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  KEY idx_match_status (match_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 8. match_signals — why a match scored what it scored
--
-- One row per compared characteristic. This is what makes the matching
-- explainable rather than a black box: the interface renders these directly as
-- "6 of 7 characteristics matched", with a tick or a cross and a sentence.
--
-- Storing them means a coordinator sees the same reasoning the reporter saw,
-- even if the algorithm's weights are tuned later.
-- -----------------------------------------------------------------------------
CREATE TABLE match_signals (
  signal_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  match_id    INT UNSIGNED NOT NULL,
  signal_key  ENUM('species','location','breed','color','size','date','characteristics')
                NOT NULL,
  is_matched  BOOLEAN      NOT NULL,
  weight      TINYINT UNSIGNED NOT NULL,   -- points this signal contributed
  detail      VARCHAR(255)     NULL,       -- "Both locations are in Makati City, roughly 1 km apart."

  PRIMARY KEY (signal_id),
  UNIQUE KEY uq_signal_per_match (match_id, signal_key),
  CONSTRAINT fk_signals_match
    FOREIGN KEY (match_id) REFERENCES match_claims (match_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 9. status_logs — the case history
--
-- Status history is appended to and never overwritten (CLAUDE.md §6.7). That is
-- what makes a case auditable: you can see when it changed, who changed it and
-- why, rather than only where it ended up.
-- -----------------------------------------------------------------------------
CREATE TABLE status_logs (
  log_id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id           INT UNSIGNED NOT NULL,
  updated_by_user_id  INT UNSIGNED     NULL,   -- NULL when the system did it
  previous_status     ENUM('active','possible_match','returned','closed') NULL,
  new_status          ENUM('active','possible_match','returned','closed') NOT NULL,
  note                VARCHAR(255)     NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (log_id),
  CONSTRAINT fk_logs_report
    FOREIGN KEY (report_id) REFERENCES pet_reports (report_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_logs_user
    FOREIGN KEY (updated_by_user_id) REFERENCES users (user_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  KEY idx_logs_report (report_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 10. notifications
--
-- Not in the draft ERD, but the notification centre is built and used by both
-- customers and coordinators. A notification always belongs to exactly one
-- user and optionally points back at the report or match that caused it.
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
  notification_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED NOT NULL,
  notification_type ENUM('match_suggested','verification_requested','staff_reviewed',
                         'match_confirmed','match_rejected','report_updated',
                         'status_changed','pet_returned','report_flagged') NOT NULL,
  title           VARCHAR(160) NOT NULL,
  body            VARCHAR(255)     NULL,
  report_id       INT UNSIGNED     NULL,
  match_id        INT UNSIGNED     NULL,
  is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (notification_id),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notifications_report
    FOREIGN KEY (report_id) REFERENCES pet_reports (report_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notifications_match
    FOREIGN KEY (match_id) REFERENCES match_claims (match_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- The unread badge counts with this index.
  KEY idx_notifications_user_read (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 11. moderation_cases — a flag raised by the community
--
-- Not in the draft ERD, but the whole administrator moderation workspace is
-- built on it. The four decisions an administrator may take are the approved
-- ones only (CLAUDE.md §6.9): dismiss, warn, remove, remove and suspend.
--
-- "Remove" closes the report rather than deleting the row, so the record of
-- what happened survives the decision.
-- -----------------------------------------------------------------------------
CREATE TABLE moderation_cases (
  case_id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id             INT UNSIGNED NOT NULL,
  reported_by_user_id   INT UNSIGNED     NULL,
  reason                ENUM('false_report','spam','scam','harassment',
                             'inappropriate','duplicate','other') NOT NULL,
  details               TEXT             NULL,
  case_status           ENUM('open','actioned','dismissed') NOT NULL DEFAULT 'open',
  resolved_by_admin_id  INT UNSIGNED     NULL,
  resolution_note       VARCHAR(255)     NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at           TIMESTAMP        NULL,

  PRIMARY KEY (case_id),
  CONSTRAINT fk_moderation_report
    FOREIGN KEY (report_id) REFERENCES pet_reports (report_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_moderation_reporter
    FOREIGN KEY (reported_by_user_id) REFERENCES users (user_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_moderation_admin
    FOREIGN KEY (resolved_by_admin_id) REFERENCES users (user_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  KEY idx_moderation_status (case_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- Reference data
--
-- Categories match the SPECIES values the frontend already uses. Breeds are the
-- ones present in the demonstration data, including Aspin and Puspin — the
-- Philippine native dog and cat, which most breed lists omit.
-- =============================================================================

INSERT INTO pet_categories (category_code, category_name, is_active) VALUES
  ('dog',    'Dog',    TRUE),
  ('cat',    'Cat',    TRUE),
  ('bird',   'Bird',   TRUE),
  ('rabbit', 'Rabbit', TRUE),
  ('other',  'Other',  TRUE);

INSERT INTO pet_breeds (category_id, breed_name) VALUES
  ((SELECT category_id FROM pet_categories WHERE category_code = 'dog'), 'Aspin (Philippine Native Dog)'),
  ((SELECT category_id FROM pet_categories WHERE category_code = 'dog'), 'Shih Tzu'),
  ((SELECT category_id FROM pet_categories WHERE category_code = 'dog'), 'Labrador Retriever'),
  ((SELECT category_id FROM pet_categories WHERE category_code = 'dog'), 'Chihuahua'),
  ((SELECT category_id FROM pet_categories WHERE category_code = 'dog'), 'Pomeranian'),
  ((SELECT category_id FROM pet_categories WHERE category_code = 'dog'), 'Golden Retriever'),
  ((SELECT category_id FROM pet_categories WHERE category_code = 'cat'), 'Puspin (Philippine Domestic Shorthair)'),
  ((SELECT category_id FROM pet_categories WHERE category_code = 'cat'), 'Persian'),
  ((SELECT category_id FROM pet_categories WHERE category_code = 'cat'), 'Siamese'),
  ((SELECT category_id FROM pet_categories WHERE category_code = 'bird'), 'Cockatiel'),
  ((SELECT category_id FROM pet_categories WHERE category_code = 'bird'), 'Lovebird'),
  ((SELECT category_id FROM pet_categories WHERE category_code = 'rabbit'), 'Holland Lop');


-- =============================================================================
-- Verification
--
-- Run after importing. Expect 11 tables and a non-zero foreign key count.
-- =============================================================================

-- SELECT COUNT(*) AS tables_created
--   FROM information_schema.tables
--  WHERE table_schema = 'pawsandfound';

-- SELECT COUNT(*) AS foreign_keys
--   FROM information_schema.table_constraints
--  WHERE table_schema = 'pawsandfound' AND constraint_type = 'FOREIGN KEY';
