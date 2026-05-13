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
