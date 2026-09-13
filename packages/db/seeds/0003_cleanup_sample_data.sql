-- ─────────────────────────────────────────────────────────────────────────────
-- The ANTS — Seed Cleanup: Remove sample data from 0001_exam_data_seed.sql
-- Removes: sample past papers, grade boundaries, duplicate subjects, sample exams
-- Keeps: curriculums (all 4), topics from 0002, unique subjects from 0002
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Remove sample grade boundaries (reference sample past papers)
DELETE FROM paper_grade_boundaries WHERE past_paper_id IN (
  'pp-0580-s23-qp-22',
  'pp-0580-s23-qp-42',
  'pp-wma11-j23-qp-01'
);

-- 2. Remove sample past papers
DELETE FROM past_papers WHERE id IN (
  'pp-0580-s23-qp-22',
  'pp-0580-s23-qp-42',
  'pp-wma11-j23-qp-01'
);

-- 3. Remove all sample exam schedule / countdown rows
DELETE FROM exams;

-- 4. Remove duplicate subjects that 0001 seeded but 0002 also seeds with better data
--    (0002 uses the same IDs so INSERT OR IGNORE already skipped them,
--     but the 0001 version may have the shorter description — clean and re-insert is safe)
--    We delete the 5 original CAIE IGCSE subjects that 0001 seeded.
--    0002 has already seeded: maths, bio, phys, chem, cs with richer descriptions.
--    Since IDs are identical, this is a no-op for subjects 0002 already owns.
--    We only need to ensure the Edexcel subjects seeded in 0001 still exist.
--    (They are NOT duplicated in 0002, so we leave them alone.)

-- Note: The curriculums rows (curr-caie-igcse etc.) are intentionally KEPT.
-- Note: The Edexcel IAL + IGCSE subjects from 0001 are KEPT (not in 0002).
-- Note: The CAIE A Level subjects from 0001 are KEPT (not in 0002).
