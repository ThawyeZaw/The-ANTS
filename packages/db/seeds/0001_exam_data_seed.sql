-- ─────────────────────────────────────────────────────────────────────────────
-- The ANTS — Cloudflare D1 SQL Seed
-- Curriculums, Subjects, Past Papers, and Grade Boundaries
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Curriculums Seed
INSERT OR IGNORE INTO curriculums (id, name, code, description, created_at) VALUES
('curr-caie-igcse', 'Cambridge IGCSE', 'CAIE_IGCSE', 'Cambridge Assessment International Education IGCSE', strftime('%s', 'now') * 1000),
('curr-caie-alevel', 'Cambridge International A Level', 'CAIE_ALEVEL', 'Cambridge International AS & A Levels', strftime('%s', 'now') * 1000),
('curr-edexcel-igcse', 'Pearson Edexcel IGCSE', 'EDEXCEL_IGCSE', 'Pearson Edexcel International GCSE (9-1)', strftime('%s', 'now') * 1000),
('curr-edexcel-ial', 'Pearson Edexcel IAL', 'EDEXCEL_IAL', 'Pearson Edexcel International Advanced Levels (Modular)', strftime('%s', 'now') * 1000);

-- 2. Core Subjects Seed
-- CAIE IGCSE
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-caie-igcse-maths', 'curr-caie-igcse', 'Mathematics', '0580', 'Cambridge IGCSE Mathematics without coursework', '#3b82f6', strftime('%s', 'now') * 1000),
('subj-caie-igcse-phys', 'curr-caie-igcse', 'Physics', '0625', 'Cambridge IGCSE Physics', '#8b5cf6', strftime('%s', 'now') * 1000),
('subj-caie-igcse-chem', 'curr-caie-igcse', 'Chemistry', '0620', 'Cambridge IGCSE Chemistry', '#ec4899', strftime('%s', 'now') * 1000),
('subj-caie-igcse-bio', 'curr-caie-igcse', 'Biology', '0610', 'Cambridge IGCSE Biology', '#10b981', strftime('%s', 'now') * 1000),
('subj-caie-igcse-cs', 'curr-caie-igcse', 'Computer Science', '0478', 'Cambridge IGCSE Computer Science', '#f59e0b', strftime('%s', 'now') * 1000);

-- CAIE A Levels
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-caie-al-maths', 'curr-caie-alevel', 'Mathematics', '9709', 'Cambridge International AS & A Level Mathematics', '#3b82f6', strftime('%s', 'now') * 1000),
('subj-caie-al-phys', 'curr-caie-alevel', 'Physics', '9702', 'Cambridge International AS & A Level Physics', '#8b5cf6', strftime('%s', 'now') * 1000),
('subj-caie-al-chem', 'curr-caie-alevel', 'Chemistry', '9701', 'Cambridge International AS & A Level Chemistry', '#ec4899', strftime('%s', 'now') * 1000);

-- Edexcel IGCSE
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-edx-igcse-maths-a', 'curr-edexcel-igcse', 'Mathematics A', '4MA1', 'Pearson Edexcel International GCSE (9-1) Mathematics A', '#3b82f6', strftime('%s', 'now') * 1000),
('subj-edx-igcse-phys', 'curr-edexcel-igcse', 'Physics', '4PH1', 'Pearson Edexcel International GCSE (9-1) Physics', '#8b5cf6', strftime('%s', 'now') * 1000);

-- Edexcel IAL
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-edx-ial-pure1', 'curr-edexcel-ial', 'Pure Mathematics 1', 'WMA11', 'Pearson Edexcel IAL Pure Mathematics Unit 1', '#3b82f6', strftime('%s', 'now') * 1000),
('subj-edx-ial-pure2', 'curr-edexcel-ial', 'Pure Mathematics 2', 'WMA12', 'Pearson Edexcel IAL Pure Mathematics Unit 2', '#2563eb', strftime('%s', 'now') * 1000),
('subj-edx-ial-pure3', 'curr-edexcel-ial', 'Pure Mathematics 3', 'WMA13', 'Pearson Edexcel IAL Pure Mathematics Unit 3', '#1d4ed8', strftime('%s', 'now') * 1000),
('subj-edx-ial-phys1', 'curr-edexcel-ial', 'Physics Unit 1', 'WPH11', 'Pearson Edexcel IAL Mechanics & Materials', '#8b5cf6', strftime('%s', 'now') * 1000);

-- 3. Past Papers Seed
-- CAIE IGCSE Mathematics (0580)
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-0580-s23-qp-22', 'CAIE', 'IGCSE', 'Mathematics', '0580', 'subj-caie-igcse-maths', 'curr-caie-igcse', 2023, 'May/June', '2', '2', 'Paper 2 (Extended) Variant 2', 70, 90, strftime('%s', 'now') * 1000),
('pp-0580-s23-qp-42', 'CAIE', 'IGCSE', 'Mathematics', '0580', 'subj-caie-igcse-maths', 'curr-caie-igcse', 2023, 'May/June', '4', '2', 'Paper 4 (Extended) Variant 2', 130, 150, strftime('%s', 'now') * 1000),
('pp-0580-w23-qp-22', 'CAIE', 'IGCSE', 'Mathematics', '0580', 'subj-caie-igcse-maths', 'curr-caie-igcse', 2023, 'Oct/Nov', '2', '2', 'Paper 2 (Extended) Variant 2', 70, 90, strftime('%s', 'now') * 1000),
('pp-0580-s22-qp-22', 'CAIE', 'IGCSE', 'Mathematics', '0580', 'subj-caie-igcse-maths', 'curr-caie-igcse', 2022, 'May/June', '2', '2', 'Paper 2 (Extended) Variant 2', 70, 90, strftime('%s', 'now') * 1000);

-- CAIE A Level Mathematics (9709)
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-9709-s23-qp-12', 'CAIE', 'A Level', 'Mathematics', '9709', 'subj-caie-al-maths', 'curr-caie-alevel', 2023, 'May/June', '1', '2', 'Paper 1 Pure Mathematics 1 (Variant 2)', 75, 110, strftime('%s', 'now') * 1000),
('pp-9709-s23-qp-32', 'CAIE', 'A Level', 'Mathematics', '9709', 'subj-caie-al-maths', 'curr-caie-alevel', 2023, 'May/June', '3', '2', 'Paper 3 Pure Mathematics 3 (Variant 2)', 75, 110, strftime('%s', 'now') * 1000);

-- Edexcel IAL Pure Mathematics 1 (WMA11)
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma11-j23-qp-01', 'Edexcel', 'IAL', 'Pure Mathematics 1', 'WMA11', 'subj-edx-ial-pure1', 'curr-edexcel-ial', 2023, 'May/June', '1', NULL, 'Unit 1: Pure Mathematics 1', 75, 90, strftime('%s', 'now') * 1000),
('pp-wma11-j22-qp-01', 'Edexcel', 'IAL', 'Pure Mathematics 1', 'WMA11', 'subj-edx-ial-pure1', 'curr-edexcel-ial', 2022, 'May/June', '1', NULL, 'Unit 1: Pure Mathematics 1', 75, 90, strftime('%s', 'now') * 1000);

-- 4. Grade Boundaries Seed
-- Grade boundaries for CAIE IGCSE Maths 0580 May/June 2023 Paper 22 (Max 70)
INSERT OR IGNORE INTO paper_grade_boundaries (id, past_paper_id, grade, min_mark, max_mark, ums_min, ums_max, created_at) VALUES
('gb-0580-s23-22-Astar', 'pp-0580-s23-qp-22', 'A*', 56, 70, NULL, NULL, strftime('%s', 'now') * 1000),
('gb-0580-s23-22-A',     'pp-0580-s23-qp-22', 'A',  47, 55, NULL, NULL, strftime('%s', 'now') * 1000),
('gb-0580-s23-22-B',     'pp-0580-s23-qp-22', 'B',  38, 46, NULL, NULL, strftime('%s', 'now') * 1000),
('gb-0580-s23-22-C',     'pp-0580-s23-qp-22', 'C',  29, 37, NULL, NULL, strftime('%s', 'now') * 1000),
('gb-0580-s23-22-D',     'pp-0580-s23-qp-22', 'D',  21, 28, NULL, NULL, strftime('%s', 'now') * 1000),
('gb-0580-s23-22-E',     'pp-0580-s23-qp-22', 'E',  14, 20, NULL, NULL, strftime('%s', 'now') * 1000),
('gb-0580-s23-22-U',     'pp-0580-s23-qp-22', 'U',   0, 13, NULL, NULL, strftime('%s', 'now') * 1000);

-- Grade boundaries for Edexcel IAL Pure 1 (WMA11) June 2023 (Max 75 raw, Max 100 UMS)
INSERT OR IGNORE INTO paper_grade_boundaries (id, past_paper_id, grade, min_mark, max_mark, ums_min, ums_max, created_at) VALUES
('gb-wma11-j23-01-A', 'pp-wma11-j23-qp-01', 'A', 50, 75, 80, 100, strftime('%s', 'now') * 1000),
('gb-wma11-j23-01-B', 'pp-wma11-j23-qp-01', 'B', 43, 49, 70,  79, strftime('%s', 'now') * 1000),
('gb-wma11-j23-01-C', 'pp-wma11-j23-qp-01', 'C', 36, 42, 60,  69, strftime('%s', 'now') * 1000),
('gb-wma11-j23-01-D', 'pp-wma11-j23-qp-01', 'D', 29, 35, 50,  59, strftime('%s', 'now') * 1000),
('gb-wma11-j23-01-E', 'pp-wma11-j23-qp-01', 'E', 22, 28, 40,  49, strftime('%s', 'now') * 1000),
('gb-wma11-j23-01-U', 'pp-wma11-j23-qp-01', 'U',  0, 21,  0,  39, strftime('%s', 'now') * 1000);
