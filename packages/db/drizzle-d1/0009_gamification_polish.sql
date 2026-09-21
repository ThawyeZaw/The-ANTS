-- Gamification polish: leaderboard visibility, streak date keys, idempotency indexes

ALTER TABLE `profiles` ADD COLUMN `leaderboard_visible` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint

ALTER TABLE `user_streaks` ADD COLUMN `last_activity_date_key` text;
--> statement-breakpoint

UPDATE `user_xp_ledger` SET `source_id` = '' WHERE `source_id` IS NULL;
--> statement-breakpoint

DELETE FROM `user_xp_ledger`
WHERE `rowid` NOT IN (
  SELECT MIN(`rowid`) FROM `user_xp_ledger`
  GROUP BY `user_id`, `source`, COALESCE(`source_id`, '')
);
--> statement-breakpoint

DELETE FROM `user_badges`
WHERE `rowid` NOT IN (
  SELECT MIN(`rowid`) FROM `user_badges`
  GROUP BY `user_id`, `badge_key`
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `idx_user_xp_ledger_user_source` ON `user_xp_ledger` (`user_id`, `source`, `source_id`);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `idx_user_badges_user_key` ON `user_badges` (`user_id`, `badge_key`);
