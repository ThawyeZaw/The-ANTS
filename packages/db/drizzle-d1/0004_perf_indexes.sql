-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0004: Performance Indexes for Cloudflare D1 Row Read Optimization
-- Eliminates full table scans on foreign keys, lookups, and student tracking.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Past Papers & Grade Boundaries (Grade Calculator & Past Paper Tracker)
CREATE INDEX IF NOT EXISTS `idx_past_papers_subject_id` ON `past_papers` (`subject_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_past_papers_curriculum_id` ON `past_papers` (`curriculum_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_past_papers_lookup` ON `past_papers` (`subject_id`, `year`, `series`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_paper_grade_boundaries_paper_id` ON `paper_grade_boundaries` (`past_paper_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_subject_grade_boundaries_lookup` ON `subject_grade_boundaries` (`subject_id`, `year`, `series`);
--> statement-breakpoint

-- 2. User Past Paper Records
CREATE INDEX IF NOT EXISTS `idx_user_past_paper_records_user_id` ON `user_past_paper_records` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_user_past_paper_records_user_paper` ON `user_past_paper_records` (`user_id`, `past_paper_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_user_past_paper_records_status` ON `user_past_paper_records` (`user_id`, `status`);
--> statement-breakpoint

-- 3. Curriculums, Subjects & Topics (Curriculum Hub & Topic Tracker)
CREATE INDEX IF NOT EXISTS `idx_subjects_curriculum_id` ON `subjects` (`curriculum_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_subjects_code` ON `subjects` (`code`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_topics_subject_id` ON `topics` (`subject_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_topics_subject_order` ON `topics` (`subject_id`, `order_index`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_topic_progress_user_id` ON `topic_progress` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_topic_progress_user_topic` ON `topic_progress` (`user_id`, `topic_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_topic_progress_user_status` ON `topic_progress` (`user_id`, `status`);
--> statement-breakpoint

-- 4. User Enrollments & Curriculums
CREATE INDEX IF NOT EXISTS `idx_user_enrollments_user_id` ON `user_enrollments` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_user_enrollments_user_curriculum` ON `user_enrollments` (`user_id`, `curriculum_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_user_enrollments_user_subject` ON `user_enrollments` (`user_id`, `subject_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_user_curriculums_user_id` ON `user_curriculums` (`user_id`);
--> statement-breakpoint

-- 5. Exams & Exam Countdowns
CREATE INDEX IF NOT EXISTS `idx_exams_subject_id` ON `exams` (`subject_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_exams_curriculum_id` ON `exams` (`curriculum_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_exams_exam_date` ON `exams` (`exam_date`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_exam_countdowns_user_id` ON `exam_countdowns` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_exam_countdowns_user_exam` ON `exam_countdowns` (`user_id`, `exam_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_exam_countdowns_user_subject` ON `exam_countdowns` (`user_id`, `subject_id`);
--> statement-breakpoint

-- 6. Gamification
CREATE INDEX IF NOT EXISTS `idx_user_xp_ledger_user_id` ON `user_xp_ledger` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_user_badges_user_id` ON `user_badges` (`user_id`);
