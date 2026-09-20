-- 0008_maths_suite_subject_columns.sql
-- Adds subject_type and qualification_data columns to the subjects table for D1.
-- These columns already exist in the Drizzle TypeScript schema (curriculums.ts)
-- but the corresponding migration was not yet applied to local D1.

ALTER TABLE subjects ADD COLUMN subject_type TEXT DEFAULT 'fixed_linear';
ALTER TABLE subjects ADD COLUMN qualification_data TEXT;
