-- ============================================
-- dbugym v2 schema (phpMyAdmin paste-ready)
-- MySQL / MariaDB (XAMPP)
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `dbugym`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `dbugym`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `approval_history`;
DROP TABLE IF EXISTS `payment_transactions`;
DROP TABLE IF EXISTS `memberships`;
DROP TABLE IF EXISTS `member_profiles`;
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `equipment`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(60) NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NOT NULL DEFAULT '',
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','member') NOT NULL DEFAULT 'member',
  `account_status` ENUM('pending_approval','active','rejected','suspended') NOT NULL DEFAULT 'pending_approval',
  `email_verified_at` TIMESTAMP NULL,
  `remember_token` VARCHAR(100) NULL,
  `avatar_path` VARCHAR(255) NULL,
  `last_login_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_username_unique` (`username`),
  KEY `users_role_status_index` (`role`, `account_status`),
  KEY `users_created_at_index` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` VARCHAR(255) NOT NULL,
  `user_id` BIGINT UNSIGNED NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `payload` LONGTEXT NOT NULL,
  `last_activity` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`),
  CONSTRAINT `sessions_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_index` (`user_id`),
  KEY `audit_logs_action_index` (`action`),
  KEY `audit_logs_created_at_index` (`created_at`),
  CONSTRAINT `audit_logs_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `admins` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `admin_role` VARCHAR(50) NOT NULL DEFAULT 'system_admin',
  `permissions_set` JSON NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admins_user_id_unique` (`user_id`),
  CONSTRAINT `admins_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `member_profiles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `member_id` VARCHAR(50) NOT NULL,
  `member_type` ENUM('university','external') NOT NULL,
  `gender` ENUM('male','female','other') NULL,
  `membership_type` ENUM('monthly','3months','6months','1year') NULL,
  `membership_expiry_date` DATE NULL,
  `university_id` VARCHAR(50) NULL,
  `department` VARCHAR(100) NULL,
  `national_id` VARCHAR(100) NULL,
  `address` VARCHAR(255) NULL,
  `date_of_birth` DATE NULL,
  `emergency_contact_name` VARCHAR(100) NULL,
  `emergency_contact_phone` VARCHAR(20) NULL,
  `terms_accepted_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `member_profiles_user_id_unique` (`user_id`),
  UNIQUE KEY `member_profiles_member_id_unique` (`member_id`),
  KEY `member_profiles_member_type_index` (`member_type`),
  KEY `member_profiles_membership_type_index` (`membership_type`),
  CONSTRAINT `member_profiles_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `memberships` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `membership_type` ENUM('monthly','3months','6months','1year') NOT NULL,
  `plan_cost` DECIMAL(12,2) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'ETB',
  `membership_status` ENUM('pending','approved','active','expired','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `plan_start_at` TIMESTAMP NULL,
  `plan_expires_at` TIMESTAMP NULL,
  `approved_by` BIGINT UNSIGNED NULL,
  `approved_at` TIMESTAMP NULL,
  `rejected_by` BIGINT UNSIGNED NULL,
  `rejected_at` TIMESTAMP NULL,
  `rejection_reason` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `memberships_user_id_index` (`user_id`),
  KEY `memberships_status_filter_index` (`membership_status`, `payment_status`),
  KEY `memberships_cost_index` (`plan_cost`),
  KEY `memberships_date_index` (`created_at`),
  KEY `memberships_approved_by_index` (`approved_by`),
  KEY `memberships_rejected_by_index` (`rejected_by`),
  CONSTRAINT `memberships_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `memberships_approved_by_foreign`
    FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `memberships_rejected_by_foreign`
    FOREIGN KEY (`rejected_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payment_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tx_ref` VARCHAR(255) NOT NULL,
  `gateway` ENUM('chapa') NOT NULL DEFAULT 'chapa',
  `status` ENUM('pending','success','failed','cancelled','expired') NOT NULL DEFAULT 'pending',
  `amount` DECIMAL(12,2) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'ETB',
  `email` VARCHAR(255) NULL,
  `checkout_url` TEXT NULL,
  `registration_payload` JSON NULL,
  `gateway_response` JSON NULL,
  `verified_at` TIMESTAMP NULL,
  `failed_at` TIMESTAMP NULL,
  `failure_reason` VARCHAR(255) NULL,
  `user_id` BIGINT UNSIGNED NULL,
  `membership_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_transactions_tx_ref_unique` (`tx_ref`),
  KEY `payment_transactions_status_gateway_index` (`status`, `gateway`),
  KEY `payment_transactions_user_id_index` (`user_id`),
  KEY `payment_transactions_membership_id_index` (`membership_id`),
  CONSTRAINT `payment_transactions_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `payment_transactions_membership_id_foreign`
    FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `approval_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `membership_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `action` ENUM('approved','rejected') NOT NULL,
  `acted_by` BIGINT UNSIGNED NOT NULL,
  `reason` TEXT NULL,
  `payment_status` ENUM('pending','paid','failed','refunded') NULL,
  `acted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `approval_history_membership_id_index` (`membership_id`),
  KEY `approval_history_user_id_index` (`user_id`),
  KEY `approval_history_acted_by_index` (`acted_by`),
  KEY `approval_history_action_acted_at_index` (`action`, `acted_at`),
  CONSTRAINT `approval_history_membership_id_foreign`
    FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE CASCADE,
  CONSTRAINT `approval_history_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `approval_history_acted_by_foreign`
    FOREIGN KEY (`acted_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `system_settings` (
  `id` TINYINT UNSIGNED NOT NULL,
  `system_name` VARCHAR(255) NOT NULL DEFAULT 'DBU Gym System',
  `logo_path` VARCHAR(255) NULL,
  `language` VARCHAR(10) NOT NULL DEFAULT 'en',
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'Africa/Addis_Ababa',
  `maintenance_mode` TINYINT(1) NOT NULL DEFAULT 0,
  `two_fa` TINYINT(1) NOT NULL DEFAULT 1,
  `password_min_length` SMALLINT UNSIGNED NOT NULL DEFAULT 8,
  `password_expiry_days` SMALLINT UNSIGNED NOT NULL DEFAULT 90,
  `password_special_chars` TINYINT(1) NOT NULL DEFAULT 1,
  `session_timeout` SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  `max_login_attempts` SMALLINT UNSIGNED NOT NULL DEFAULT 3,
  `max_file_size` SMALLINT UNSIGNED NOT NULL DEFAULT 2,
  `email_notifications` TINYINT(1) NOT NULL DEFAULT 1,
  `sms_notifications` TINYINT(1) NOT NULL DEFAULT 0,
  `sender_email` VARCHAR(255) NOT NULL DEFAULT 'support@dbugym.com',
  `api_key` VARCHAR(255) NULL,
  `auto_backup` TINYINT(1) NOT NULL DEFAULT 1,
  `backup_frequency` ENUM('daily','weekly','monthly') NOT NULL DEFAULT 'weekly',
  `theme` ENUM('light','dark') NOT NULL DEFAULT 'dark',
  `accent_color` VARCHAR(20) NOT NULL DEFAULT '#51CCF9',
  `layout_style` ENUM('comfortable','compact') NOT NULL DEFAULT 'comfortable',
  `updated_by` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `system_settings_updated_by_index` (`updated_by`),
  CONSTRAINT `system_settings_updated_by_foreign`
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional operational tables
CREATE TABLE `equipment` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `equipment_code` VARCHAR(20) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `type` VARCHAR(50) NULL,
  `status` ENUM('available','maintenance','out_of_service') NOT NULL DEFAULT 'available',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `equipment_code_unique` (`equipment_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `schedules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scheduled_datetime` TIMESTAMP NOT NULL,
  `status` ENUM('scheduled','cancelled','completed') NOT NULL DEFAULT 'scheduled',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `schedules_datetime_status_index` (`scheduled_datetime`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL,
  `content` TEXT NOT NULL,
  `type` VARCHAR(40) NOT NULL,
  `sent_datetime` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_index` (`user_id`),
  CONSTRAINT `notifications_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(30) NOT NULL,
  `date_range` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reports_type_index` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed singleton settings row
INSERT INTO `system_settings` (`id`) VALUES (1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Seed default admin user (email: admin@gmail.com, password: 12345678)
-- Password hash generated with PHP password_hash('12345678', PASSWORD_BCRYPT)
INSERT INTO `users` (
  `name`, `username`, `email`, `phone`, `password`, `role`, `account_status`, `created_at`, `updated_at`
) VALUES (
  'System Admin',
  'admin',
  'admin@gmail.com',
  '',
  '$2y$10$LU9tDlMSamrjtUiGxNtN4.OgNkS9tZHzk7/bfx7MPyGKpMEzf0Lh.',
  'admin',
  'active',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `role` = 'admin',
  `account_status` = 'active',
  `password` = VALUES(`password`),
  `updated_at` = NOW();

INSERT INTO `admins` (`user_id`, `admin_role`, `created_at`, `updated_at`)
SELECT `id`, 'system_admin', NOW(), NOW()
FROM `users`
WHERE `email` = 'admin@gmail.com'
ON DUPLICATE KEY UPDATE
  `admin_role` = VALUES(`admin_role`),
  `updated_at` = NOW();

-- Add login attempt tracking fields
ALTER TABLE `users` ADD COLUMN `login_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER `last_login_at`;
ALTER TABLE `users` ADD COLUMN `lockout_until` TIMESTAMP NULL AFTER `login_attempts`;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
