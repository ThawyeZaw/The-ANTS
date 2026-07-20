-- Seed curricula + IGCSE subjects in one go using gen_random_uuid()

-- First, delete dependent data
DELETE FROM exams;
DELETE FROM subjects;
DELETE FROM user_enrollments;
DELETE FROM curriculums;

-- Insert curricula and capture IDs via CTE
WITH new_curriculums AS (
  INSERT INTO curriculums (id, title, description, qualification, exam_board, structure_type) VALUES
    (gen_random_uuid(), 'IGCSE (Edexcel)', 'International GCSE — Pearson Edexcel', 'IGCSE', 'Pearson Edexcel', 'igcse'),
    (gen_random_uuid(), 'IGCSE (CIE)', 'International GCSE — Cambridge International', 'IGCSE', 'Cambridge (CAIE)', 'igcse'),
    (gen_random_uuid(), 'IAL (Edexcel)', 'International A Level — Pearson Edexcel', 'A Level', 'Pearson Edexcel', 'alevel'),
    (gen_random_uuid(), 'IAL (CIE)', 'International A Level — Cambridge International', 'A Level', 'Cambridge (CAIE)', 'alevel'),
    (gen_random_uuid(), 'IELTS', 'International English Language Testing System', 'IELTS', 'British Council / IDP', 'ielts'),
    (gen_random_uuid(), 'GED', 'General Educational Development', 'GED', 'GED Testing Service', 'ged')
  RETURNING id, title
),
cie AS (SELECT id FROM new_curriculums WHERE title = 'IGCSE (CIE)'),
edex AS (SELECT id FROM new_curriculums WHERE title = 'IGCSE (Edexcel)')
INSERT INTO subjects (id, curriculum_id, title, description, order_no)
SELECT gen_random_uuid(), cie.id, 'Additional Maths', 'Cambridge IGCSE Additional Mathematics 0606', 1 FROM cie
UNION ALL
SELECT gen_random_uuid(), cie.id, 'E Maths', 'Cambridge IGCSE Mathematics 0580', 2 FROM cie
UNION ALL
SELECT gen_random_uuid(), edex.id, 'Further Pure Maths', 'Pearson Edexcel IGCSE Further Pure Mathematics 4PM1', 1 FROM edex
UNION ALL
SELECT gen_random_uuid(), edex.id, 'Maths B', 'Pearson Edexcel IGCSE Mathematics B 4MB1', 2 FROM edex;
