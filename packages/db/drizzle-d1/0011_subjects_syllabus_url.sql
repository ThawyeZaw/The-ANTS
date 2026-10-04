-- 0011_subjects_syllabus_url.sql
-- Add syllabus_url column to subjects table for Cloudflare R2 syllabus/specification viewing and download.
ALTER TABLE subjects ADD COLUMN syllabus_url text;
