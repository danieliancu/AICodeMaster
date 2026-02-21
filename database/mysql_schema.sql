-- MySQL 8.x schema for AI Code Master
-- Run:
--   mysql -u root -p < database/mysql_schema.sql

CREATE DATABASE IF NOT EXISTS aicodemaster
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aicodemaster;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS user_lesson_events;
DROP TABLE IF EXISTS ai_messages;
DROP TABLE IF EXISTS ai_threads;
DROP TABLE IF EXISTS user_lesson_live_results;
DROP TABLE IF EXISTS user_lesson_code;
DROP TABLE IF EXISTS user_lesson_state;
DROP TABLE IF EXISTS lesson_localizations;
DROP TABLE IF EXISTS lesson_technologies;
DROP TABLE IF EXISTS technologies;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS app_translations;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  preferred_ai_language VARCHAR(12) NOT NULL DEFAULT 'ro',
  preferred_editor_theme ENUM('light', 'dark') NOT NULL DEFAULT 'light',
  preferred_xray_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE user_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_sessions_token_hash (token_hash),
  KEY idx_user_sessions_user_id (user_id),
  KEY idx_user_sessions_expires_at (expires_at),
  CONSTRAINT fk_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE app_translations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  language_code VARCHAR(12) NOT NULL,
  `key` VARCHAR(120) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_translations_lang_key (language_code, `key`)
) ENGINE=InnoDB;

CREATE TABLE lessons (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL,
  internal_name VARCHAR(190) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lessons_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE technologies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL,
  label VARCHAR(64) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_technologies_code (code)
) ENGINE=InnoDB;

CREATE TABLE lesson_technologies (
  lesson_id BIGINT UNSIGNED NOT NULL,
  technology_id BIGINT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (lesson_id, technology_id),
  KEY idx_ltech_technology_id (technology_id),
  CONSTRAINT fk_ltech_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_ltech_technology
    FOREIGN KEY (technology_id) REFERENCES technologies(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE lesson_localizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lesson_id BIGINT UNSIGNED NOT NULL,
  language_code VARCHAR(12) NOT NULL,
  lesson_name VARCHAR(190) NOT NULL,
  lesson_title VARCHAR(190) NOT NULL,
  lesson_description TEXT NOT NULL,
  -- Generic target payload:
  -- { "html": "...", "css": "...", "javascript": "...", "python": "...", "php": "...", "sql": "..." }
  target_code_json JSON NOT NULL,
  -- JSON array of strings
  hints_json JSON NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lesson_localizations_lesson_lang (lesson_id, language_code),
  CONSTRAINT fk_lesson_localizations_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_lesson_state (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  lesson_id BIGINT UNSIGNED NOT NULL,
  progress ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  last_accessed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_lesson_state_user_lesson (user_id, lesson_id),
  KEY idx_user_lesson_state_progress (progress),
  CONSTRAINT fk_user_lesson_state_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_lesson_state_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Elastic code storage per lesson + per technology (HTML/CSS/JS now, extensible later)
CREATE TABLE user_lesson_code (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  lesson_id BIGINT UNSIGNED NOT NULL,
  technology_id BIGINT UNSIGNED NOT NULL,
  code LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_lesson_code (user_id, lesson_id, technology_id),
  KEY idx_user_lesson_code_lesson (lesson_id),
  CONSTRAINT fk_user_lesson_code_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_lesson_code_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_lesson_code_technology
    FOREIGN KEY (technology_id) REFERENCES technologies(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Last computed live output for quick restore (for web preview or runner output)
CREATE TABLE user_lesson_live_results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  lesson_id BIGINT UNSIGNED NOT NULL,
  -- For HTML preview can store rendered iframe doc.
  rendered_output LONGTEXT NULL,
  -- Generic structured output for non-web runtimes:
  -- { "stdout":"", "stderr":"", "tables":[...], "runtimeMs":123 }
  result_json JSON NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_lesson_live_result (user_id, lesson_id),
  CONSTRAINT fk_user_lesson_live_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_lesson_live_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ai_threads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  lesson_id BIGINT UNSIGNED NOT NULL,
  thread_type ENUM('teacher_chat', 'realtime_feedback') NOT NULL DEFAULT 'teacher_chat',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ai_threads_user_lesson (user_id, lesson_id),
  CONSTRAINT fk_ai_threads_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_ai_threads_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ai_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  thread_id BIGINT UNSIGNED NOT NULL,
  role ENUM('user', 'model', 'system') NOT NULL,
  message LONGTEXT NOT NULL,
  is_correct TINYINT(1) NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ai_messages_thread (thread_id),
  KEY idx_ai_messages_created (created_at),
  CONSTRAINT fk_ai_messages_thread
    FOREIGN KEY (thread_id) REFERENCES ai_threads(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Event log for "real-time save" (keystrokes/snapshots/feedback triggers/etc.)
CREATE TABLE user_lesson_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  lesson_id BIGINT UNSIGNED NOT NULL,
  technology_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(64) NOT NULL,
  payload_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_lesson_events_user_lesson_time (user_id, lesson_id, created_at),
  KEY idx_user_lesson_events_event_type (event_type),
  CONSTRAINT fk_user_lesson_events_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_lesson_events_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_lesson_events_technology
    FOREIGN KEY (technology_id) REFERENCES technologies(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- Seed technologies (extensible)
INSERT INTO technologies (code, label) VALUES
  ('html', 'HTML'),
  ('css', 'CSS'),
  ('javascript', 'JavaScript'),
  ('python', 'Python'),
  ('php', 'PHP'),
  ('sql', 'SQL');

-- Seed current hardcoded lessons (slug should match app)
INSERT INTO lessons (slug, internal_name, sort_order) VALUES
  ('basic-layout', 'Basic Page Structure', 10),
  ('tic-tac-toe-grid', 'Joc de X si O (Tic Tac Toe)', 20),
  ('product-card', 'Responsive Product Card', 30),
  ('pocket-calculator', 'Simple Pocket Calculator', 40);

-- Map technologies to current lessons
INSERT INTO lesson_technologies (lesson_id, technology_id, sort_order)
SELECT l.id, t.id, 10
FROM lessons l
JOIN technologies t ON t.code IN ('html', 'css')
WHERE l.slug IN ('basic-layout', 'product-card');

INSERT INTO lesson_technologies (lesson_id, technology_id, sort_order)
SELECT l.id, t.id,
  CASE t.code
    WHEN 'html' THEN 10
    WHEN 'css' THEN 20
    WHEN 'javascript' THEN 30
    ELSE 100
  END
FROM lessons l
JOIN technologies t ON t.code IN ('html', 'css', 'javascript')
WHERE l.slug IN ('tic-tac-toe-grid', 'pocket-calculator');

-- Optional: seed only RO localization as initial source of truth.
-- target_code_json/hints_json should be populated by app import script from hardcoded content.
