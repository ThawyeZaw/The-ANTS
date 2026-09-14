-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0003: Connected study tools
-- - user_enrollments: target_series, target_grade, tier, countdown_mode
-- - exam_countdowns: is_custom
-- - student_profiles: default_exam_series
-- - subject_grade_boundaries: syllabus-level composite thresholds
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `user_enrollments` ADD `target_series` text;
--> statement-breakpoint
ALTER TABLE `user_enrollments` ADD `target_grade` text;
--> statement-breakpoint
ALTER TABLE `user_enrollments` ADD `tier` text;
--> statement-breakpoint
ALTER TABLE `user_enrollments` ADD `countdown_mode` text;
--> statement-breakpoint
ALTER TABLE `exam_countdowns` ADD `is_custom` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `default_exam_series` text;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `subject_grade_boundaries` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`year` integer NOT NULL,
	`series` text NOT NULL,
	`variant` text,
	`tier` text,
	`grade` text NOT NULL,
	`min_mark` integer NOT NULL,
	`max_mark` integer,
	`created_at` integer,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
