-- Enrollment award level (AS / A Level) and paper-route preferences.
ALTER TABLE `user_enrollments` ADD `award_level` text;
--> statement-breakpoint
ALTER TABLE `user_enrollments` ADD `paper_preferences` text;
