-- 0034_remove_october_unavailable_ial_units.sql
-- Pearson IAL October sessions only assess P1–P4, M1, M2, S1 and S2.
-- Further Pure (WFM01–03), M3, S3 and D1 are January/June only.
-- Remove placeholder Oct/Nov rows that were invented without official PDFs.

DELETE FROM paper_grade_boundaries
WHERE past_paper_id IN (
  SELECT id FROM past_papers
  WHERE exam_board = 'Edexcel'
    AND qualification = 'IAL'
    AND series = 'Oct/Nov'
    AND syllabus_code IN ('WFM01', 'WFM02', 'WFM03', 'WME03', 'WST03', 'WDM11')
);

DELETE FROM past_papers
WHERE exam_board = 'Edexcel'
  AND qualification = 'IAL'
  AND series = 'Oct/Nov'
  AND syllabus_code IN ('WFM01', 'WFM02', 'WFM03', 'WME03', 'WST03', 'WDM11');
