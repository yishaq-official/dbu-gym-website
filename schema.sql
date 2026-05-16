-- ============================================
-- DBU Gym membership_type migration
-- Converts old duration plans to the new registration package categories.
-- Run this against the existing `dbugym` database.
-- ============================================

USE `dbugym`;

-- Step 1: temporarily allow both the old and new enum values.
ALTER TABLE `member_profiles`
  MODIFY `membership_type` ENUM(
    'monthly',
    '3months',
    '6months',
    '1year',
    'strength-training',
    'cardio-training',
    'aerobics-training',
    'vip-training'
  ) NULL;

ALTER TABLE `memberships`
  MODIFY `membership_type` ENUM(
    'monthly',
    '3months',
    '6months',
    '1year',
    'strength-training',
    'cardio-training',
    'aerobics-training',
    'vip-training'
  ) NOT NULL;

-- Step 2: convert existing duration values to the default new package.
-- Old duration plans do not identify the client's training category, so they
-- are migrated to Strength Training instead of guessing a different package.
UPDATE `member_profiles`
SET `membership_type` = 'strength-training'
WHERE `membership_type` IN ('monthly', '3months', '6months', '1year');

UPDATE `memberships`
SET `membership_type` = 'strength-training'
WHERE `membership_type` IN ('monthly', '3months', '6months', '1year');

-- Step 3: remove the old enum values and keep only the registration packages.
ALTER TABLE `member_profiles`
  MODIFY `membership_type` ENUM(
    'strength-training',
    'cardio-training',
    'aerobics-training',
    'vip-training'
  ) NULL;

ALTER TABLE `memberships`
  MODIFY `membership_type` ENUM(
    'strength-training',
    'cardio-training',
    'aerobics-training',
    'vip-training'
  ) NOT NULL;

-- Step 4: fix stored membership costs to the current fixed internal/external rates.
UPDATE `memberships` m
JOIN `member_profiles` mp ON mp.`user_id` = m.`user_id`
SET m.`plan_cost` = CASE
  WHEN m.`membership_type` = 'strength-training' AND mp.`member_type` = 'external' THEN 600.00
  WHEN m.`membership_type` = 'strength-training' THEN 400.00
  WHEN m.`membership_type` = 'cardio-training' AND mp.`member_type` = 'external' THEN 700.00
  WHEN m.`membership_type` = 'cardio-training' THEN 500.00
  WHEN m.`membership_type` = 'aerobics-training' AND mp.`member_type` = 'external' THEN 700.00
  WHEN m.`membership_type` = 'aerobics-training' THEN 500.00
  WHEN m.`membership_type` = 'vip-training' AND mp.`member_type` = 'external' THEN 2000.00
  WHEN m.`membership_type` = 'vip-training' THEN 1000.00
  ELSE m.`plan_cost`
END;

UPDATE `payment_transactions` pt
JOIN `memberships` m ON m.`id` = pt.`membership_id`
SET pt.`amount` = m.`plan_cost`;

-- Step 5: add API rate-limit storage for login and registration attempts.
CREATE TABLE IF NOT EXISTS `rate_limits` (
  `key_hash` CHAR(64) NOT NULL,
  `action` VARCHAR(80) NOT NULL,
  `identifier` CHAR(64) NOT NULL,
  `window_start` TIMESTAMP NOT NULL,
  `attempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_hash`),
  KEY `rate_limits_action_identifier_index` (`action`, `identifier`),
  KEY `rate_limits_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
