-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0002: Past Paper Tracker, Gamification, and Curriculum Topics
-- New tables: past_papers, paper_grade_boundaries, user_past_paper_records,
--             user_xp_ledger, user_badges, user_streaks
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `past_papers` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_board` text NOT NULL,
	`qualification` text NOT NULL,
	`subject` text NOT NULL,
	`syllabus_code` text NOT NULL,
	`subject_id` text,
	`curriculum_id` text,
	`year` integer NOT NULL,
	`series` text NOT NULL,
	`paper_number` text NOT NULL,
	`variant` text,
	`title` text,
	`total_marks` integer,
	`duration_minutes` integer,
	`created_at` integer,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`curriculum_id`) REFERENCES `curriculums`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `paper_grade_boundaries` (
	`id` text PRIMARY KEY NOT NULL,
	`past_paper_id` text NOT NULL,
	`grade` text NOT NULL,
	`min_mark` integer NOT NULL,
	`max_mark` integer,
	`ums_min` integer,
	`ums_max` integer,
	`created_at` integer,
	FOREIGN KEY (`past_paper_id`) REFERENCES `past_papers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `user_past_paper_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`past_paper_id` text NOT NULL,
	`status` text DEFAULT 'not_done' NOT NULL,
	`component_marks` text,
	`raw_score` real,
	`max_score` real,
	`percentage` real,
	`calculated_grade` text,
	`calculated_ums` integer,
	`notes` text,
	`completed_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`past_paper_id`) REFERENCES `past_papers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `user_xp_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`xp_amount` integer NOT NULL,
	`source` text NOT NULL,
	`source_id` text,
	`description` text,
	`earned_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `user_badges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`badge_key` text NOT NULL,
	`earned_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `user_streaks` (
	`user_id` text PRIMARY KEY NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_activity_date` integer,
	`total_xp` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
