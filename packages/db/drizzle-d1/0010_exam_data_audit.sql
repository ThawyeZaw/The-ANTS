-- Exam data admin audit log for past papers / grade boundaries
CREATE TABLE IF NOT EXISTS `exam_data_audit_log` (
  `id` text PRIMARY KEY NOT NULL,
  `actor_user_id` text NOT NULL,
  `actor_name` text NOT NULL,
  `action` text NOT NULL,
  `entity_type` text NOT NULL,
  `entity_id` text NOT NULL,
  `summary` text,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`actor_user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_exam_data_audit_created` ON `exam_data_audit_log` (`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_exam_data_audit_entity` ON `exam_data_audit_log` (`entity_type`, `entity_id`);
