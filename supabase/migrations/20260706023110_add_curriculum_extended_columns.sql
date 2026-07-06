-- ============================================================================
-- The ANTS — Migration: Add extended columns to curriculums
-- Adds syllabus_code, structure_type, grading_system, hierarchy_model,
-- library_status, share_token, subject_count for the Course Manager feature.
-- ============================================================================

ALTER TABLE public.curriculums
  ADD COLUMN IF NOT EXISTS syllabus_code    TEXT,
  ADD COLUMN IF NOT EXISTS structure_type   TEXT,
  ADD COLUMN IF NOT EXISTS grading_system   TEXT,
  ADD COLUMN IF NOT EXISTS hierarchy_model  JSONB,
  ADD COLUMN IF NOT EXISTS library_status   TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS share_token      TEXT,
  ADD COLUMN IF NOT EXISTS subject_count    INT4;
