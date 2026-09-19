-- Phase 1: component routes catalog + IAL cash-in + user route selections

CREATE TABLE IF NOT EXISTS `subject_component_routes` (
  `id` text PRIMARY KEY NOT NULL,
  `subject_id` text REFERENCES subjects(id) ON DELETE CASCADE,
  `cash_in_code` text,
  `award_level` text,
  `route_key` text NOT NULL,
  `label` text NOT NULL,
  `required_paper_ids` text,
  `required_unit_codes` text,
  `optional_groups` text,
  `is_myanmar_default` integer DEFAULT 0 NOT NULL,
  `created_at` integer
);

CREATE INDEX IF NOT EXISTS `idx_subject_component_routes_subject` ON `subject_component_routes` (`subject_id`);
CREATE INDEX IF NOT EXISTS `idx_subject_component_routes_cash_in` ON `subject_component_routes` (`cash_in_code`);

CREATE TABLE IF NOT EXISTS `user_cash_in_enrollments` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  `cash_in_code` text NOT NULL,
  `award_level` text NOT NULL,
  `selected_units` text NOT NULL,
  `applied_pair` text,
  `enrolled_at` integer
);

CREATE INDEX IF NOT EXISTS `idx_user_cash_in_enrollments_user` ON `user_cash_in_enrollments` (`user_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_user_cash_in_enrollments_user_cash_in` ON `user_cash_in_enrollments` (`user_id`, `cash_in_code`);

CREATE TABLE IF NOT EXISTS `user_component_selections` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  `subject_id` text NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  `award_level` text,
  `route_key` text NOT NULL,
  `paper_preferences` text,
  `updated_at` integer
);

CREATE INDEX IF NOT EXISTS `idx_user_component_selections_user` ON `user_component_selections` (`user_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_user_component_selections_user_subject` ON `user_component_selections` (`user_id`, `subject_id`);
