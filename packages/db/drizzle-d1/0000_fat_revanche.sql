CREATE TABLE `certifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`issuer` text NOT NULL,
	`issue_date` integer NOT NULL,
	`expiry_date` integer,
	`credential_id` text,
	`credential_url` text,
	`certificate_url` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `contributor_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`website_url` text,
	`linkedin_url` text,
	`github_url` text,
	`contributor_level` text DEFAULT 'contributor',
	`contributions_count` integer DEFAULT 0,
	`rating` text,
	`verified_at` integer,
	FOREIGN KEY (`id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`avatar_url` text,
	`created_at` integer,
	`updated_at` integer,
	`role` text DEFAULT 'student' NOT NULL,
	`roles` text NOT NULL,
	`is_public` integer DEFAULT true,
	`bio` text,
	`title` text,
	`social_links` text,
	`projects` text,
	`activities` text,
	`achievements` text,
	`pinned_item_id` text,
	`section_visibility` text,
	`custom_url_slug` text,
	`certification_ids` text,
	`timezone` text DEFAULT 'UTC',
	`onboarding_completed` integer DEFAULT true,
	`preferred_name` text,
	`institution_name` text,
	`telegram_chat_id` text,
	`notification_preferences` text,
	`founder_type` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_username_unique` ON `profiles` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_custom_url_slug_unique` ON `profiles` (`custom_url_slug`);--> statement-breakpoint
CREATE TABLE `role_upgrade_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`current_role` text NOT NULL,
	`requested_role` text NOT NULL,
	`reason` text,
	`status` text DEFAULT 'pending',
	`reviewer_id` text,
	`created_at` integer,
	`reviewed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`target_exam_year` integer,
	`study_goals_metadata` text,
	FOREIGN KEY (`id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tutor_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`institution` text,
	`department` text,
	`specialization` text,
	`telegram_handle` text,
	`hourly_rate` text,
	`teaching_curriculums` text,
	`teaching_subjects` text,
	`availability_slots` text,
	`is_active` integer DEFAULT true,
	`verified` integer DEFAULT false,
	FOREIGN KEY (`id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `curriculums` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`icon_url` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `curriculums_code_unique` ON `curriculums` (`code`);--> statement-breakpoint
CREATE TABLE `editor_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`submitted_by` text NOT NULL,
	`data` text NOT NULL,
	`status` text DEFAULT 'pending',
	`created_at` integer,
	`reviewed_at` integer,
	FOREIGN KEY (`submitted_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`curriculum_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`icon_url` text,
	`color_code` text,
	`created_at` integer,
	FOREIGN KEY (`curriculum_id`) REFERENCES `curriculums`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `topic_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`status` text DEFAULT 'not_started',
	`last_studied_at` integer,
	`completed_at` integer,
	`notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`order_index` integer DEFAULT 0,
	`subtopics_count` integer DEFAULT 0,
	`difficulty_level` text,
	`estimated_hours` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_curriculums` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`curriculum_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_id`) REFERENCES `curriculums`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exam_countdowns` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exam_id` text,
	`subject_id` text,
	`title` text NOT NULL,
	`exam_board` text,
	`paper_name` text,
	`exam_date` integer NOT NULL,
	`color_code` text,
	`target_grade` text,
	`is_mock` integer DEFAULT false,
	`is_pinned` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `exam_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text NOT NULL,
	`paper_name` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`venue` text,
	`created_at` integer,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`curriculum_id` text,
	`title` text NOT NULL,
	`exam_board` text,
	`qualification_type` text,
	`syllabus_code` text,
	`season` text,
	`series` text,
	`paper_number` text,
	`exam_date` integer,
	`duration_minutes` integer,
	`total_marks` integer,
	`created_at` integer,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_id`) REFERENCES `curriculums`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `grade_boundaries` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text,
	`subject_id` text,
	`exam_board` text,
	`series` text,
	`boundaries` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `grade_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exam_id` text,
	`subject_id` text NOT NULL,
	`score` real NOT NULL,
	`max_score` real NOT NULL,
	`percentage` real,
	`grade` text,
	`exam_date` integer,
	`notes` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pomodoro_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject_id` text,
	`topic_id` text,
	`duration_minutes` integer NOT NULL,
	`session_type` text DEFAULT 'focus',
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `pomodoro_user_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`settings` text NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `timetable_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`event_type` text DEFAULT 'study',
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`all_day` integer DEFAULT false,
	`is_recurring` integer DEFAULT false,
	`recurrence_pattern` text,
	`color_code` text,
	`metadata` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`curriculum_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`exam_id` text,
	`enrolled_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_id`) REFERENCES `curriculums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user_exam_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`curriculum_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`exam_id` text,
	`exam_date` integer NOT NULL,
	`result` text,
	`is_mock` integer DEFAULT false,
	`notes` text,
	`recorded_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_id`) REFERENCES `curriculums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user_exam_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exam_id` text NOT NULL,
	`custom_title` text,
	`custom_exam_series` text,
	`custom_exam_date` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `activity_feed` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action_type` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email_enabled` integer DEFAULT true,
	`telegram_enabled` integer DEFAULT false,
	`in_app_enabled` integer DEFAULT true,
	`channels` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_preferences_user_id_unique` ON `notification_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `notification_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`channel` text DEFAULT 'telegram' NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`scheduled_for` integer,
	`sent_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`link_url` text,
	`is_read` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `review_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`contributor_id` text NOT NULL,
	`submission_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`submitted_data` text NOT NULL,
	`is_update` integer DEFAULT false,
	`published_entity_id` text,
	`status` text DEFAULT 'pending',
	`reviewer_id` text,
	`feedback` text,
	`submitted_at` integer,
	`reviewed_at` integer,
	FOREIGN KEY (`contributor_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `version_history` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`changes` text NOT NULL,
	`changed_by` text NOT NULL,
	`review_item_id` text,
	`changed_at` integer,
	FOREIGN KEY (`changed_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`issuer` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'student' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `org_mission` (
	`id` text PRIMARY KEY DEFAULT 'org-mission' NOT NULL,
	`content` text NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `org_team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`bio` text,
	`photo_url` text,
	`linked_profile_username` text,
	`order_index` integer DEFAULT 0 NOT NULL,
	`is_alumni` integer DEFAULT false NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `org_timeline_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`date_label` text NOT NULL,
	`category` text,
	`image_urls` text NOT NULL,
	`location` text,
	`order_index` integer DEFAULT 0 NOT NULL,
	`show_on_timeline` integer DEFAULT true NOT NULL,
	`created_at` integer
);
