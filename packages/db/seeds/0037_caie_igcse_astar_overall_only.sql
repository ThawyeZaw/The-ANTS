-- Cambridge IGCSE: A* is published on the weighted syllabus total only.
-- Component tables in the official GB PDFs are A–G raw marks. The previous
-- seed invented per-paper A* from the overall A*/A ratio — remove those rows
-- and let grade A run up to the paper total.

DELETE FROM paper_grade_boundaries
WHERE grade = 'A*'
  AND past_paper_id IN (
    SELECT id FROM past_papers
    WHERE exam_board = 'CAIE'
      AND qualification = 'IGCSE'
  );

UPDATE paper_grade_boundaries
SET max_mark = (
  SELECT p.total_marks
  FROM past_papers p
  WHERE p.id = paper_grade_boundaries.past_paper_id
)
WHERE grade = 'A'
  AND past_paper_id IN (
    SELECT id FROM past_papers
    WHERE exam_board = 'CAIE'
      AND qualification = 'IGCSE'
      AND total_marks IS NOT NULL
  );
