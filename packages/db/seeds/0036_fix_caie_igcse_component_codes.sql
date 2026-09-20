-- 0036_fix_caie_igcse_component_codes.sql
-- Cambridge component codes like 02/03 are unvarianted Paper 2 / Paper 3,
-- not "Paper 0 Variant 2". Component 50 is not a sitting paper.

DELETE FROM user_past_paper_records
WHERE past_paper_id IN (
  SELECT id FROM past_papers
  WHERE exam_board = 'CAIE'
    AND qualification = 'IGCSE'
    AND paper_number = '5'
    AND variant = '0'
);

DELETE FROM paper_grade_boundaries
WHERE past_paper_id IN (
  SELECT id FROM past_papers
  WHERE exam_board = 'CAIE'
    AND qualification = 'IGCSE'
    AND paper_number = '5'
    AND variant = '0'
);

DELETE FROM past_papers
WHERE exam_board = 'CAIE'
  AND qualification = 'IGCSE'
  AND paper_number = '5'
  AND variant = '0';

UPDATE past_papers
SET
  paper_number = '0' || variant,
  title = CASE syllabus_code
    WHEN '0417' THEN CASE variant
      WHEN '2' THEN 'Paper 2 Document Production, Databases and Presentations'
      WHEN '3' THEN 'Paper 3 Spreadsheets and Website Authoring'
      ELSE 'Paper ' || variant
    END
    WHEN '0500' THEN CASE variant
      WHEN '3' THEN 'Component 3 Coursework'
      ELSE 'Paper ' || variant
    END
    ELSE 'Paper ' || variant
  END,
  duration_minutes = CASE
    WHEN syllabus_code = '0417' AND variant = '2' THEN 90
    WHEN syllabus_code = '0417' AND variant = '3' THEN 150
    ELSE duration_minutes
  END,
  variant = NULL
WHERE exam_board = 'CAIE'
  AND qualification = 'IGCSE'
  AND paper_number = '0'
  AND variant IS NOT NULL;
