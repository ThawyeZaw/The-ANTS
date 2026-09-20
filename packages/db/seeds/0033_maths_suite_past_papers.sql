-- 0033_maths_suite_past_papers.sql
-- Mathematics Suite past papers: fixes paper_number format + fills missing series.
--
-- Part A: UPDATE existing rows to use "WXXXXX/01" format for paper_number.
--   Rationale: The Past Paper Tracker front-end filters by checking whether
--   `paper_number` starts with the active unitCode (e.g. "WMA11"). Existing
--   rows stored just "01" or "1", causing the filter to never match.
--   We update by syllabus_code so all current and future rows stay consistent.
--
-- Part B: INSERT OR IGNORE missing exam series (Jan / May-June / Oct-Nov)
--   for 2022–2025. October only includes units Pearson actually assesses
--   that session (P1–P4, M1, M2, S1, S2). Further Maths units are Jan/June.
--
-- Series label convention (matches the rest of 0024):
--   j = January   |  s = May/June   |  w = Oct/Nov
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════
-- PART A: Fix paper_number format on all existing maths-suite papers
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE past_papers SET paper_number = 'WMA11/01' WHERE syllabus_code = 'WMA11';
UPDATE past_papers SET paper_number = 'WMA12/01' WHERE syllabus_code = 'WMA12';
UPDATE past_papers SET paper_number = 'WMA13/01' WHERE syllabus_code = 'WMA13';
UPDATE past_papers SET paper_number = 'WMA14/01' WHERE syllabus_code = 'WMA14';
UPDATE past_papers SET paper_number = 'WFM01/01' WHERE syllabus_code = 'WFM01';
UPDATE past_papers SET paper_number = 'WFM02/01' WHERE syllabus_code = 'WFM02';
UPDATE past_papers SET paper_number = 'WFM03/01' WHERE syllabus_code = 'WFM03';
UPDATE past_papers SET paper_number = 'WME01/01' WHERE syllabus_code = 'WME01';
UPDATE past_papers SET paper_number = 'WME02/01' WHERE syllabus_code = 'WME02';
UPDATE past_papers SET paper_number = 'WME03/01' WHERE syllabus_code = 'WME03';
UPDATE past_papers SET paper_number = 'WST01/01' WHERE syllabus_code = 'WST01';
UPDATE past_papers SET paper_number = 'WST02/01' WHERE syllabus_code = 'WST02';
UPDATE past_papers SET paper_number = 'WST03/01' WHERE syllabus_code = 'WST03';
UPDATE past_papers SET paper_number = 'WDM11/01' WHERE syllabus_code = 'WDM11';

-- ═══════════════════════════════════════════════════════════════════════════
-- PART B: Insert missing series — 2022 Jan / May-June / Oct-Nov
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── January 2022 ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma11-j22-01-qp-01', 'Edexcel', 'IAL', 'Pure Mathematics 1',      'WMA11', 'subj-edx-ial-pure1',  'curr-edexcel-ial', 2022, 'Jan', 'WMA11/01', NULL, 'Unit 1: Pure Mathematics 1',      75, 90, strftime('%s','now')*1000),
('pp-wma12-j22-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 2',      'WMA12', 'subj-edx-ial-pure2',  'curr-edexcel-ial', 2022, 'Jan', 'WMA12/01', NULL, 'Unit 2: Pure Mathematics 2',      75, 90, strftime('%s','now')*1000),
('pp-wma13-j22-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 3',      'WMA13', 'subj-edx-ial-pure3',  'curr-edexcel-ial', 2022, 'Jan', 'WMA13/01', NULL, 'Unit 3: Pure Mathematics 3',      75, 90, strftime('%s','now')*1000),
('pp-wma14-j22-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 4',      'WMA14', 'subj-edx-ial-pure4',  'curr-edexcel-ial', 2022, 'Jan', 'WMA14/01', NULL, 'Unit 4: Pure Mathematics 4',      75, 90, strftime('%s','now')*1000),
('pp-wfm01-j22-qp-01',    'Edexcel', 'IAL', 'Further Pure F1',         'WFM01', 'subj-edx-ial-fmath1', 'curr-edexcel-ial', 2022, 'Jan', 'WFM01/01', NULL, 'Unit 1: Further Pure Mathematics 1', 75, 90, strftime('%s','now')*1000),
('pp-wfm02-j22-qp-01',    'Edexcel', 'IAL', 'Further Pure F2',         'WFM02', 'subj-edx-ial-fmath2', 'curr-edexcel-ial', 2022, 'Jan', 'WFM02/01', NULL, 'Unit 2: Further Pure Mathematics 2', 75, 90, strftime('%s','now')*1000),
('pp-wfm03-j22-qp-01',    'Edexcel', 'IAL', 'Further Pure F3',         'WFM03', 'subj-edx-ial-fmath3', 'curr-edexcel-ial', 2022, 'Jan', 'WFM03/01', NULL, 'Unit 3: Further Pure Mathematics 3', 75, 90, strftime('%s','now')*1000),
('pp-wme01-j22-qp-01',    'Edexcel', 'IAL', 'Mechanics M1',            'WME01', 'subj-edx-ial-mech1',  'curr-edexcel-ial', 2022, 'Jan', 'WME01/01', NULL, 'Unit 1: Mechanics 1',             75, 90, strftime('%s','now')*1000),
('pp-wme02-j22-qp-01',    'Edexcel', 'IAL', 'Mechanics M2',            'WME02', 'subj-edx-ial-mech2',  'curr-edexcel-ial', 2022, 'Jan', 'WME02/01', NULL, 'Unit 2: Mechanics 2',             75, 90, strftime('%s','now')*1000),
('pp-wme03-j22-qp-01',    'Edexcel', 'IAL', 'Mechanics M3',            'WME03', 'subj-edx-ial-mech3',  'curr-edexcel-ial', 2022, 'Jan', 'WME03/01', NULL, 'Unit 3: Mechanics 3',             75, 90, strftime('%s','now')*1000),
('pp-wdm11-j22-qp-01',    'Edexcel', 'IAL', 'Decision Mathematics D1', 'WDM11', 'subj-edx-ial-dec1',   'curr-edexcel-ial', 2022, 'Jan', 'WDM11/01', NULL, 'Unit 1: Decision Mathematics 1',  75, 90, strftime('%s','now')*1000),
('pp-wst03-j22-qp-01',    'Edexcel', 'IAL', 'Statistics S3',           'WST03', 'subj-edx-ial-stat3',  'curr-edexcel-ial', 2022, 'Jan', 'WST03/01', NULL, 'Unit 3: Statistics 3',            75, 90, strftime('%s','now')*1000);

-- ─── May/June 2022 ────────────────────────────────────────────────────────
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma12-s22-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 2',      'WMA12', 'subj-edx-ial-pure2',  'curr-edexcel-ial', 2022, 'May/June', 'WMA12/01', NULL, 'Unit 2: Pure Mathematics 2',      75, 90, strftime('%s','now')*1000),
('pp-wma13-s22-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 3',      'WMA13', 'subj-edx-ial-pure3',  'curr-edexcel-ial', 2022, 'May/June', 'WMA13/01', NULL, 'Unit 3: Pure Mathematics 3',      75, 90, strftime('%s','now')*1000),
('pp-wma14-s22-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 4',      'WMA14', 'subj-edx-ial-pure4',  'curr-edexcel-ial', 2022, 'May/June', 'WMA14/01', NULL, 'Unit 4: Pure Mathematics 4',      75, 90, strftime('%s','now')*1000),
('pp-wfm01-s22-qp-01',    'Edexcel', 'IAL', 'Further Pure F1',         'WFM01', 'subj-edx-ial-fmath1', 'curr-edexcel-ial', 2022, 'May/June', 'WFM01/01', NULL, 'Unit 1: Further Pure Mathematics 1', 75, 90, strftime('%s','now')*1000),
('pp-wfm02-s22-qp-01',    'Edexcel', 'IAL', 'Further Pure F2',         'WFM02', 'subj-edx-ial-fmath2', 'curr-edexcel-ial', 2022, 'May/June', 'WFM02/01', NULL, 'Unit 2: Further Pure Mathematics 2', 75, 90, strftime('%s','now')*1000),
('pp-wfm03-s22-qp-01',    'Edexcel', 'IAL', 'Further Pure F3',         'WFM03', 'subj-edx-ial-fmath3', 'curr-edexcel-ial', 2022, 'May/June', 'WFM03/01', NULL, 'Unit 3: Further Pure Mathematics 3', 75, 90, strftime('%s','now')*1000),
('pp-wme01-s22-qp-01',    'Edexcel', 'IAL', 'Mechanics M1',            'WME01', 'subj-edx-ial-mech1',  'curr-edexcel-ial', 2022, 'May/June', 'WME01/01', NULL, 'Unit 1: Mechanics 1',             75, 90, strftime('%s','now')*1000),
('pp-wme02-s22-qp-01',    'Edexcel', 'IAL', 'Mechanics M2',            'WME02', 'subj-edx-ial-mech2',  'curr-edexcel-ial', 2022, 'May/June', 'WME02/01', NULL, 'Unit 2: Mechanics 2',             75, 90, strftime('%s','now')*1000),
('pp-wme03-s22-qp-01',    'Edexcel', 'IAL', 'Mechanics M3',            'WME03', 'subj-edx-ial-mech3',  'curr-edexcel-ial', 2022, 'May/June', 'WME03/01', NULL, 'Unit 3: Mechanics 3',             75, 90, strftime('%s','now')*1000),
('pp-wst01-s22-qp-01',    'Edexcel', 'IAL', 'Statistics S1',           'WST01', 'subj-edx-ial-stat1',  'curr-edexcel-ial', 2022, 'May/June', 'WST01/01', NULL, 'Unit 1: Statistics 1',            75, 90, strftime('%s','now')*1000),
('pp-wst02-s22-qp-01',    'Edexcel', 'IAL', 'Statistics S2',           'WST02', 'subj-edx-ial-stat2',  'curr-edexcel-ial', 2022, 'May/June', 'WST02/01', NULL, 'Unit 2: Statistics 2',            75, 90, strftime('%s','now')*1000),
('pp-wst03-s22-qp-01',    'Edexcel', 'IAL', 'Statistics S3',           'WST03', 'subj-edx-ial-stat3',  'curr-edexcel-ial', 2022, 'May/June', 'WST03/01', NULL, 'Unit 3: Statistics 3',            75, 90, strftime('%s','now')*1000),
('pp-wdm11-s22-qp-01',    'Edexcel', 'IAL', 'Decision Mathematics D1', 'WDM11', 'subj-edx-ial-dec1',   'curr-edexcel-ial', 2022, 'May/June', 'WDM11/01', NULL, 'Unit 1: Decision Mathematics 1',  75, 90, strftime('%s','now')*1000);

-- ─── Oct/Nov 2022 ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma11-w22-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 1',      'WMA11', 'subj-edx-ial-pure1',  'curr-edexcel-ial', 2022, 'Oct/Nov', 'WMA11/01', NULL, 'Unit 1: Pure Mathematics 1',      75, 90, strftime('%s','now')*1000),
('pp-wma12-w22-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 2',      'WMA12', 'subj-edx-ial-pure2',  'curr-edexcel-ial', 2022, 'Oct/Nov', 'WMA12/01', NULL, 'Unit 2: Pure Mathematics 2',      75, 90, strftime('%s','now')*1000),
('pp-wma13-w22-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 3',      'WMA13', 'subj-edx-ial-pure3',  'curr-edexcel-ial', 2022, 'Oct/Nov', 'WMA13/01', NULL, 'Unit 3: Pure Mathematics 3',      75, 90, strftime('%s','now')*1000),
('pp-wma14-w22-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 4',      'WMA14', 'subj-edx-ial-pure4',  'curr-edexcel-ial', 2022, 'Oct/Nov', 'WMA14/01', NULL, 'Unit 4: Pure Mathematics 4',      75, 90, strftime('%s','now')*1000),
('pp-wme01-w22-qp-01',    'Edexcel', 'IAL', 'Mechanics M1',            'WME01', 'subj-edx-ial-mech1',  'curr-edexcel-ial', 2022, 'Oct/Nov', 'WME01/01', NULL, 'Unit 1: Mechanics 1',             75, 90, strftime('%s','now')*1000),
('pp-wme02-w22-qp-01',    'Edexcel', 'IAL', 'Mechanics M2',            'WME02', 'subj-edx-ial-mech2',  'curr-edexcel-ial', 2022, 'Oct/Nov', 'WME02/01', NULL, 'Unit 2: Mechanics 2',             75, 90, strftime('%s','now')*1000);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2023 series
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── January 2023 ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma11-j23-01-qp-01', 'Edexcel', 'IAL', 'Pure Mathematics 1',      'WMA11', 'subj-edx-ial-pure1',  'curr-edexcel-ial', 2023, 'Jan', 'WMA11/01', NULL, 'Unit 1: Pure Mathematics 1',      75, 90, strftime('%s','now')*1000),
('pp-wma12-j23-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 2',      'WMA12', 'subj-edx-ial-pure2',  'curr-edexcel-ial', 2023, 'Jan', 'WMA12/01', NULL, 'Unit 2: Pure Mathematics 2',      75, 90, strftime('%s','now')*1000),
('pp-wma13-j23-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 3',      'WMA13', 'subj-edx-ial-pure3',  'curr-edexcel-ial', 2023, 'Jan', 'WMA13/01', NULL, 'Unit 3: Pure Mathematics 3',      75, 90, strftime('%s','now')*1000),
('pp-wma14-j23-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 4',      'WMA14', 'subj-edx-ial-pure4',  'curr-edexcel-ial', 2023, 'Jan', 'WMA14/01', NULL, 'Unit 4: Pure Mathematics 4',      75, 90, strftime('%s','now')*1000),
('pp-wfm01-j23-qp-01',    'Edexcel', 'IAL', 'Further Pure F1',         'WFM01', 'subj-edx-ial-fmath1', 'curr-edexcel-ial', 2023, 'Jan', 'WFM01/01', NULL, 'Unit 1: Further Pure Mathematics 1', 75, 90, strftime('%s','now')*1000),
('pp-wfm02-j23-qp-01',    'Edexcel', 'IAL', 'Further Pure F2',         'WFM02', 'subj-edx-ial-fmath2', 'curr-edexcel-ial', 2023, 'Jan', 'WFM02/01', NULL, 'Unit 2: Further Pure Mathematics 2', 75, 90, strftime('%s','now')*1000),
('pp-wfm03-j23-qp-01',    'Edexcel', 'IAL', 'Further Pure F3',         'WFM03', 'subj-edx-ial-fmath3', 'curr-edexcel-ial', 2023, 'Jan', 'WFM03/01', NULL, 'Unit 3: Further Pure Mathematics 3', 75, 90, strftime('%s','now')*1000),
('pp-wme01-j23-qp-01',    'Edexcel', 'IAL', 'Mechanics M1',            'WME01', 'subj-edx-ial-mech1',  'curr-edexcel-ial', 2023, 'Jan', 'WME01/01', NULL, 'Unit 1: Mechanics 1',             75, 90, strftime('%s','now')*1000),
('pp-wme02-j23-qp-01',    'Edexcel', 'IAL', 'Mechanics M2',            'WME02', 'subj-edx-ial-mech2',  'curr-edexcel-ial', 2023, 'Jan', 'WME02/01', NULL, 'Unit 2: Mechanics 2',             75, 90, strftime('%s','now')*1000),
('pp-wme03-j23-qp-01',    'Edexcel', 'IAL', 'Mechanics M3',            'WME03', 'subj-edx-ial-mech3',  'curr-edexcel-ial', 2023, 'Jan', 'WME03/01', NULL, 'Unit 3: Mechanics 3',             75, 90, strftime('%s','now')*1000),
('pp-wst03-j23-qp-01',    'Edexcel', 'IAL', 'Statistics S3',           'WST03', 'subj-edx-ial-stat3',  'curr-edexcel-ial', 2023, 'Jan', 'WST03/01', NULL, 'Unit 3: Statistics 3',            75, 90, strftime('%s','now')*1000),
('pp-wdm11-j23-qp-01',    'Edexcel', 'IAL', 'Decision Mathematics D1', 'WDM11', 'subj-edx-ial-dec1',   'curr-edexcel-ial', 2023, 'Jan', 'WDM11/01', NULL, 'Unit 1: Decision Mathematics 1',  75, 90, strftime('%s','now')*1000);

-- ─── May/June 2023 ────────────────────────────────────────────────────────
-- Note: pp-wma11-j23-qp-01 (from 0001) covers this slot with a misnamed ID,
--       we insert a canonical s23 entry that OR IGNORE will skip if it conflicts.
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma11-s23-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 1',      'WMA11', 'subj-edx-ial-pure1',  'curr-edexcel-ial', 2023, 'May/June', 'WMA11/01', NULL, 'Unit 1: Pure Mathematics 1',      75, 90, strftime('%s','now')*1000),
('pp-wma12-s23-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 2',      'WMA12', 'subj-edx-ial-pure2',  'curr-edexcel-ial', 2023, 'May/June', 'WMA12/01', NULL, 'Unit 2: Pure Mathematics 2',      75, 90, strftime('%s','now')*1000),
('pp-wma13-s23-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 3',      'WMA13', 'subj-edx-ial-pure3',  'curr-edexcel-ial', 2023, 'May/June', 'WMA13/01', NULL, 'Unit 3: Pure Mathematics 3',      75, 90, strftime('%s','now')*1000),
('pp-wma14-s23-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 4',      'WMA14', 'subj-edx-ial-pure4',  'curr-edexcel-ial', 2023, 'May/June', 'WMA14/01', NULL, 'Unit 4: Pure Mathematics 4',      75, 90, strftime('%s','now')*1000),
('pp-wfm01-s23-qp-01',    'Edexcel', 'IAL', 'Further Pure F1',         'WFM01', 'subj-edx-ial-fmath1', 'curr-edexcel-ial', 2023, 'May/June', 'WFM01/01', NULL, 'Unit 1: Further Pure Mathematics 1', 75, 90, strftime('%s','now')*1000),
('pp-wfm02-s23-qp-01',    'Edexcel', 'IAL', 'Further Pure F2',         'WFM02', 'subj-edx-ial-fmath2', 'curr-edexcel-ial', 2023, 'May/June', 'WFM02/01', NULL, 'Unit 2: Further Pure Mathematics 2', 75, 90, strftime('%s','now')*1000),
('pp-wfm03-s23-qp-01',    'Edexcel', 'IAL', 'Further Pure F3',         'WFM03', 'subj-edx-ial-fmath3', 'curr-edexcel-ial', 2023, 'May/June', 'WFM03/01', NULL, 'Unit 3: Further Pure Mathematics 3', 75, 90, strftime('%s','now')*1000),
('pp-wme01-s23-qp-01',    'Edexcel', 'IAL', 'Mechanics M1',            'WME01', 'subj-edx-ial-mech1',  'curr-edexcel-ial', 2023, 'May/June', 'WME01/01', NULL, 'Unit 1: Mechanics 1',             75, 90, strftime('%s','now')*1000),
('pp-wme02-s23-qp-01',    'Edexcel', 'IAL', 'Mechanics M2',            'WME02', 'subj-edx-ial-mech2',  'curr-edexcel-ial', 2023, 'May/June', 'WME02/01', NULL, 'Unit 2: Mechanics 2',             75, 90, strftime('%s','now')*1000),
('pp-wme03-s23-qp-01',    'Edexcel', 'IAL', 'Mechanics M3',            'WME03', 'subj-edx-ial-mech3',  'curr-edexcel-ial', 2023, 'May/June', 'WME03/01', NULL, 'Unit 3: Mechanics 3',             75, 90, strftime('%s','now')*1000),
('pp-wdm11-s23-qp-01',    'Edexcel', 'IAL', 'Decision Mathematics D1', 'WDM11', 'subj-edx-ial-dec1',   'curr-edexcel-ial', 2023, 'May/June', 'WDM11/01', NULL, 'Unit 1: Decision Mathematics 1',  75, 90, strftime('%s','now')*1000);

-- ─── Oct/Nov 2023 ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma11-w23-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 1',      'WMA11', 'subj-edx-ial-pure1',  'curr-edexcel-ial', 2023, 'Oct/Nov', 'WMA11/01', NULL, 'Unit 1: Pure Mathematics 1',      75, 90, strftime('%s','now')*1000),
('pp-wma12-w23-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 2',      'WMA12', 'subj-edx-ial-pure2',  'curr-edexcel-ial', 2023, 'Oct/Nov', 'WMA12/01', NULL, 'Unit 2: Pure Mathematics 2',      75, 90, strftime('%s','now')*1000),
('pp-wma13-w23-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 3',      'WMA13', 'subj-edx-ial-pure3',  'curr-edexcel-ial', 2023, 'Oct/Nov', 'WMA13/01', NULL, 'Unit 3: Pure Mathematics 3',      75, 90, strftime('%s','now')*1000),
('pp-wma14-w23-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 4',      'WMA14', 'subj-edx-ial-pure4',  'curr-edexcel-ial', 2023, 'Oct/Nov', 'WMA14/01', NULL, 'Unit 4: Pure Mathematics 4',      75, 90, strftime('%s','now')*1000),
('pp-wme01-w23-qp-01',    'Edexcel', 'IAL', 'Mechanics M1',            'WME01', 'subj-edx-ial-mech1',  'curr-edexcel-ial', 2023, 'Oct/Nov', 'WME01/01', NULL, 'Unit 1: Mechanics 1',             75, 90, strftime('%s','now')*1000),
('pp-wme02-w23-qp-01',    'Edexcel', 'IAL', 'Mechanics M2',            'WME02', 'subj-edx-ial-mech2',  'curr-edexcel-ial', 2023, 'Oct/Nov', 'WME02/01', NULL, 'Unit 2: Mechanics 2',             75, 90, strftime('%s','now')*1000),
('pp-wst01-w23-qp-01',    'Edexcel', 'IAL', 'Statistics S1',           'WST01', 'subj-edx-ial-stat1',  'curr-edexcel-ial', 2023, 'Oct/Nov', 'WST01/01', NULL, 'Unit 1: Statistics 1',            75, 90, strftime('%s','now')*1000),
('pp-wst02-w23-qp-01',    'Edexcel', 'IAL', 'Statistics S2',           'WST02', 'subj-edx-ial-stat2',  'curr-edexcel-ial', 2023, 'Oct/Nov', 'WST02/01', NULL, 'Unit 2: Statistics 2',            75, 90, strftime('%s','now')*1000);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2024 series
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── January 2024 ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma11-j24-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 1',      'WMA11', 'subj-edx-ial-pure1',  'curr-edexcel-ial', 2024, 'Jan', 'WMA11/01', NULL, 'Unit 1: Pure Mathematics 1',      75, 90, strftime('%s','now')*1000),
('pp-wma12-j24-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 2',      'WMA12', 'subj-edx-ial-pure2',  'curr-edexcel-ial', 2024, 'Jan', 'WMA12/01', NULL, 'Unit 2: Pure Mathematics 2',      75, 90, strftime('%s','now')*1000),
('pp-wma13-j24-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 3',      'WMA13', 'subj-edx-ial-pure3',  'curr-edexcel-ial', 2024, 'Jan', 'WMA13/01', NULL, 'Unit 3: Pure Mathematics 3',      75, 90, strftime('%s','now')*1000),
('pp-wma14-j24-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 4',      'WMA14', 'subj-edx-ial-pure4',  'curr-edexcel-ial', 2024, 'Jan', 'WMA14/01', NULL, 'Unit 4: Pure Mathematics 4',      75, 90, strftime('%s','now')*1000),
('pp-wfm01-j24-qp-01',    'Edexcel', 'IAL', 'Further Pure F1',         'WFM01', 'subj-edx-ial-fmath1', 'curr-edexcel-ial', 2024, 'Jan', 'WFM01/01', NULL, 'Unit 1: Further Pure Mathematics 1', 75, 90, strftime('%s','now')*1000),
('pp-wfm02-j24-qp-01',    'Edexcel', 'IAL', 'Further Pure F2',         'WFM02', 'subj-edx-ial-fmath2', 'curr-edexcel-ial', 2024, 'Jan', 'WFM02/01', NULL, 'Unit 2: Further Pure Mathematics 2', 75, 90, strftime('%s','now')*1000),
('pp-wfm03-j24-qp-01',    'Edexcel', 'IAL', 'Further Pure F3',         'WFM03', 'subj-edx-ial-fmath3', 'curr-edexcel-ial', 2024, 'Jan', 'WFM03/01', NULL, 'Unit 3: Further Pure Mathematics 3', 75, 90, strftime('%s','now')*1000),
('pp-wme01-j24-qp-01',    'Edexcel', 'IAL', 'Mechanics M1',            'WME01', 'subj-edx-ial-mech1',  'curr-edexcel-ial', 2024, 'Jan', 'WME01/01', NULL, 'Unit 1: Mechanics 1',             75, 90, strftime('%s','now')*1000),
('pp-wme02-j24-qp-01',    'Edexcel', 'IAL', 'Mechanics M2',            'WME02', 'subj-edx-ial-mech2',  'curr-edexcel-ial', 2024, 'Jan', 'WME02/01', NULL, 'Unit 2: Mechanics 2',             75, 90, strftime('%s','now')*1000),
('pp-wme03-j24-qp-01',    'Edexcel', 'IAL', 'Mechanics M3',            'WME03', 'subj-edx-ial-mech3',  'curr-edexcel-ial', 2024, 'Jan', 'WME03/01', NULL, 'Unit 3: Mechanics 3',             75, 90, strftime('%s','now')*1000),
('pp-wst01-j24-qp-01',    'Edexcel', 'IAL', 'Statistics S1',           'WST01', 'subj-edx-ial-stat1',  'curr-edexcel-ial', 2024, 'Jan', 'WST01/01', NULL, 'Unit 1: Statistics 1',            75, 90, strftime('%s','now')*1000),
('pp-wst02-j24-qp-01',    'Edexcel', 'IAL', 'Statistics S2',           'WST02', 'subj-edx-ial-stat2',  'curr-edexcel-ial', 2024, 'Jan', 'WST02/01', NULL, 'Unit 2: Statistics 2',            75, 90, strftime('%s','now')*1000),
('pp-wst03-j24-qp-01',    'Edexcel', 'IAL', 'Statistics S3',           'WST03', 'subj-edx-ial-stat3',  'curr-edexcel-ial', 2024, 'Jan', 'WST03/01', NULL, 'Unit 3: Statistics 3',            75, 90, strftime('%s','now')*1000),
('pp-wdm11-j24-qp-01',    'Edexcel', 'IAL', 'Decision Mathematics D1', 'WDM11', 'subj-edx-ial-dec1',   'curr-edexcel-ial', 2024, 'Jan', 'WDM11/01', NULL, 'Unit 1: Decision Mathematics 1',  75, 90, strftime('%s','now')*1000);

-- ─── May/June 2024 ────────────────────────────────────────────────────────
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma11-s24-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 1',      'WMA11', 'subj-edx-ial-pure1',  'curr-edexcel-ial', 2024, 'May/June', 'WMA11/01', NULL, 'Unit 1: Pure Mathematics 1',      75, 90, strftime('%s','now')*1000),
('pp-wma12-s24-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 2',      'WMA12', 'subj-edx-ial-pure2',  'curr-edexcel-ial', 2024, 'May/June', 'WMA12/01', NULL, 'Unit 2: Pure Mathematics 2',      75, 90, strftime('%s','now')*1000),
('pp-wma13-s24-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 3',      'WMA13', 'subj-edx-ial-pure3',  'curr-edexcel-ial', 2024, 'May/June', 'WMA13/01', NULL, 'Unit 3: Pure Mathematics 3',      75, 90, strftime('%s','now')*1000),
('pp-wma14-s24-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 4',      'WMA14', 'subj-edx-ial-pure4',  'curr-edexcel-ial', 2024, 'May/June', 'WMA14/01', NULL, 'Unit 4: Pure Mathematics 4',      75, 90, strftime('%s','now')*1000),
('pp-wfm01-s24-qp-01',    'Edexcel', 'IAL', 'Further Pure F1',         'WFM01', 'subj-edx-ial-fmath1', 'curr-edexcel-ial', 2024, 'May/June', 'WFM01/01', NULL, 'Unit 1: Further Pure Mathematics 1', 75, 90, strftime('%s','now')*1000),
('pp-wfm02-s24-qp-01',    'Edexcel', 'IAL', 'Further Pure F2',         'WFM02', 'subj-edx-ial-fmath2', 'curr-edexcel-ial', 2024, 'May/June', 'WFM02/01', NULL, 'Unit 2: Further Pure Mathematics 2', 75, 90, strftime('%s','now')*1000),
('pp-wfm03-s24-qp-01',    'Edexcel', 'IAL', 'Further Pure F3',         'WFM03', 'subj-edx-ial-fmath3', 'curr-edexcel-ial', 2024, 'May/June', 'WFM03/01', NULL, 'Unit 3: Further Pure Mathematics 3', 75, 90, strftime('%s','now')*1000),
('pp-wme01-s24-qp-01',    'Edexcel', 'IAL', 'Mechanics M1',            'WME01', 'subj-edx-ial-mech1',  'curr-edexcel-ial', 2024, 'May/June', 'WME01/01', NULL, 'Unit 1: Mechanics 1',             75, 90, strftime('%s','now')*1000),
('pp-wme02-s24-qp-01',    'Edexcel', 'IAL', 'Mechanics M2',            'WME02', 'subj-edx-ial-mech2',  'curr-edexcel-ial', 2024, 'May/June', 'WME02/01', NULL, 'Unit 2: Mechanics 2',             75, 90, strftime('%s','now')*1000),
('pp-wme03-s24-qp-01',    'Edexcel', 'IAL', 'Mechanics M3',            'WME03', 'subj-edx-ial-mech3',  'curr-edexcel-ial', 2024, 'May/June', 'WME03/01', NULL, 'Unit 3: Mechanics 3',             75, 90, strftime('%s','now')*1000),
('pp-wst01-s24-qp-01',    'Edexcel', 'IAL', 'Statistics S1',           'WST01', 'subj-edx-ial-stat1',  'curr-edexcel-ial', 2024, 'May/June', 'WST01/01', NULL, 'Unit 1: Statistics 1',            75, 90, strftime('%s','now')*1000),
('pp-wst02-s24-qp-01',    'Edexcel', 'IAL', 'Statistics S2',           'WST02', 'subj-edx-ial-stat2',  'curr-edexcel-ial', 2024, 'May/June', 'WST02/01', NULL, 'Unit 2: Statistics 2',            75, 90, strftime('%s','now')*1000),
('pp-wst03-s24-qp-01',    'Edexcel', 'IAL', 'Statistics S3',           'WST03', 'subj-edx-ial-stat3',  'curr-edexcel-ial', 2024, 'May/June', 'WST03/01', NULL, 'Unit 3: Statistics 3',            75, 90, strftime('%s','now')*1000),
('pp-wdm11-s24-qp-01',    'Edexcel', 'IAL', 'Decision Mathematics D1', 'WDM11', 'subj-edx-ial-dec1',   'curr-edexcel-ial', 2024, 'May/June', 'WDM11/01', NULL, 'Unit 1: Decision Mathematics 1',  75, 90, strftime('%s','now')*1000);

-- ─── Oct/Nov 2024 ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma11-w24-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 1',      'WMA11', 'subj-edx-ial-pure1',  'curr-edexcel-ial', 2024, 'Oct/Nov', 'WMA11/01', NULL, 'Unit 1: Pure Mathematics 1',      75, 90, strftime('%s','now')*1000),
('pp-wma12-w24-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 2',      'WMA12', 'subj-edx-ial-pure2',  'curr-edexcel-ial', 2024, 'Oct/Nov', 'WMA12/01', NULL, 'Unit 2: Pure Mathematics 2',      75, 90, strftime('%s','now')*1000),
('pp-wma13-w24-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 3',      'WMA13', 'subj-edx-ial-pure3',  'curr-edexcel-ial', 2024, 'Oct/Nov', 'WMA13/01', NULL, 'Unit 3: Pure Mathematics 3',      75, 90, strftime('%s','now')*1000),
('pp-wma14-w24-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 4',      'WMA14', 'subj-edx-ial-pure4',  'curr-edexcel-ial', 2024, 'Oct/Nov', 'WMA14/01', NULL, 'Unit 4: Pure Mathematics 4',      75, 90, strftime('%s','now')*1000),
('pp-wme01-w24-qp-01',    'Edexcel', 'IAL', 'Mechanics M1',            'WME01', 'subj-edx-ial-mech1',  'curr-edexcel-ial', 2024, 'Oct/Nov', 'WME01/01', NULL, 'Unit 1: Mechanics 1',             75, 90, strftime('%s','now')*1000),
('pp-wme02-w24-qp-01',    'Edexcel', 'IAL', 'Mechanics M2',            'WME02', 'subj-edx-ial-mech2',  'curr-edexcel-ial', 2024, 'Oct/Nov', 'WME02/01', NULL, 'Unit 2: Mechanics 2',             75, 90, strftime('%s','now')*1000),
('pp-wst01-w24-qp-01',    'Edexcel', 'IAL', 'Statistics S1',           'WST01', 'subj-edx-ial-stat1',  'curr-edexcel-ial', 2024, 'Oct/Nov', 'WST01/01', NULL, 'Unit 1: Statistics 1',            75, 90, strftime('%s','now')*1000),
('pp-wst02-w24-qp-01',    'Edexcel', 'IAL', 'Statistics S2',           'WST02', 'subj-edx-ial-stat2',  'curr-edexcel-ial', 2024, 'Oct/Nov', 'WST02/01', NULL, 'Unit 2: Statistics 2',            75, 90, strftime('%s','now')*1000);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2025 series (W25 for pure/applied already in 0024, add Jan + June)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── January 2025 ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma11-j25-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 1',      'WMA11', 'subj-edx-ial-pure1',  'curr-edexcel-ial', 2025, 'Jan', 'WMA11/01', NULL, 'Unit 1: Pure Mathematics 1',      75, 90, strftime('%s','now')*1000),
('pp-wma12-j25-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 2',      'WMA12', 'subj-edx-ial-pure2',  'curr-edexcel-ial', 2025, 'Jan', 'WMA12/01', NULL, 'Unit 2: Pure Mathematics 2',      75, 90, strftime('%s','now')*1000),
('pp-wma13-j25-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 3',      'WMA13', 'subj-edx-ial-pure3',  'curr-edexcel-ial', 2025, 'Jan', 'WMA13/01', NULL, 'Unit 3: Pure Mathematics 3',      75, 90, strftime('%s','now')*1000),
('pp-wma14-j25-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 4',      'WMA14', 'subj-edx-ial-pure4',  'curr-edexcel-ial', 2025, 'Jan', 'WMA14/01', NULL, 'Unit 4: Pure Mathematics 4',      75, 90, strftime('%s','now')*1000),
('pp-wfm01-j25-qp-01',    'Edexcel', 'IAL', 'Further Pure F1',         'WFM01', 'subj-edx-ial-fmath1', 'curr-edexcel-ial', 2025, 'Jan', 'WFM01/01', NULL, 'Unit 1: Further Pure Mathematics 1', 75, 90, strftime('%s','now')*1000),
('pp-wfm02-j25-qp-01',    'Edexcel', 'IAL', 'Further Pure F2',         'WFM02', 'subj-edx-ial-fmath2', 'curr-edexcel-ial', 2025, 'Jan', 'WFM02/01', NULL, 'Unit 2: Further Pure Mathematics 2', 75, 90, strftime('%s','now')*1000),
('pp-wfm03-j25-qp-01',    'Edexcel', 'IAL', 'Further Pure F3',         'WFM03', 'subj-edx-ial-fmath3', 'curr-edexcel-ial', 2025, 'Jan', 'WFM03/01', NULL, 'Unit 3: Further Pure Mathematics 3', 75, 90, strftime('%s','now')*1000),
('pp-wme01-j25-qp-01',    'Edexcel', 'IAL', 'Mechanics M1',            'WME01', 'subj-edx-ial-mech1',  'curr-edexcel-ial', 2025, 'Jan', 'WME01/01', NULL, 'Unit 1: Mechanics 1',             75, 90, strftime('%s','now')*1000),
('pp-wme02-j25-qp-01',    'Edexcel', 'IAL', 'Mechanics M2',            'WME02', 'subj-edx-ial-mech2',  'curr-edexcel-ial', 2025, 'Jan', 'WME02/01', NULL, 'Unit 2: Mechanics 2',             75, 90, strftime('%s','now')*1000),
('pp-wme03-j25-qp-01',    'Edexcel', 'IAL', 'Mechanics M3',            'WME03', 'subj-edx-ial-mech3',  'curr-edexcel-ial', 2025, 'Jan', 'WME03/01', NULL, 'Unit 3: Mechanics 3',             75, 90, strftime('%s','now')*1000),
('pp-wst01-j25-qp-01',    'Edexcel', 'IAL', 'Statistics S1',           'WST01', 'subj-edx-ial-stat1',  'curr-edexcel-ial', 2025, 'Jan', 'WST01/01', NULL, 'Unit 1: Statistics 1',            75, 90, strftime('%s','now')*1000),
('pp-wst02-j25-qp-01',    'Edexcel', 'IAL', 'Statistics S2',           'WST02', 'subj-edx-ial-stat2',  'curr-edexcel-ial', 2025, 'Jan', 'WST02/01', NULL, 'Unit 2: Statistics 2',            75, 90, strftime('%s','now')*1000),
('pp-wst03-j25-qp-01',    'Edexcel', 'IAL', 'Statistics S3',           'WST03', 'subj-edx-ial-stat3',  'curr-edexcel-ial', 2025, 'Jan', 'WST03/01', NULL, 'Unit 3: Statistics 3',            75, 90, strftime('%s','now')*1000),
('pp-wdm11-j25-qp-01',    'Edexcel', 'IAL', 'Decision Mathematics D1', 'WDM11', 'subj-edx-ial-dec1',   'curr-edexcel-ial', 2025, 'Jan', 'WDM11/01', NULL, 'Unit 1: Decision Mathematics 1',  75, 90, strftime('%s','now')*1000);

-- ─── May/June 2025 ────────────────────────────────────────────────────────
INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES
('pp-wma11-s25-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 1',      'WMA11', 'subj-edx-ial-pure1',  'curr-edexcel-ial', 2025, 'May/June', 'WMA11/01', NULL, 'Unit 1: Pure Mathematics 1',      75, 90, strftime('%s','now')*1000),
('pp-wma12-s25-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 2',      'WMA12', 'subj-edx-ial-pure2',  'curr-edexcel-ial', 2025, 'May/June', 'WMA12/01', NULL, 'Unit 2: Pure Mathematics 2',      75, 90, strftime('%s','now')*1000),
('pp-wma13-s25-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 3',      'WMA13', 'subj-edx-ial-pure3',  'curr-edexcel-ial', 2025, 'May/June', 'WMA13/01', NULL, 'Unit 3: Pure Mathematics 3',      75, 90, strftime('%s','now')*1000),
('pp-wma14-s25-qp-01',    'Edexcel', 'IAL', 'Pure Mathematics 4',      'WMA14', 'subj-edx-ial-pure4',  'curr-edexcel-ial', 2025, 'May/June', 'WMA14/01', NULL, 'Unit 4: Pure Mathematics 4',      75, 90, strftime('%s','now')*1000),
('pp-wfm01-s25-qp-01',    'Edexcel', 'IAL', 'Further Pure F1',         'WFM01', 'subj-edx-ial-fmath1', 'curr-edexcel-ial', 2025, 'May/June', 'WFM01/01', NULL, 'Unit 1: Further Pure Mathematics 1', 75, 90, strftime('%s','now')*1000),
('pp-wfm02-s25-qp-01',    'Edexcel', 'IAL', 'Further Pure F2',         'WFM02', 'subj-edx-ial-fmath2', 'curr-edexcel-ial', 2025, 'May/June', 'WFM02/01', NULL, 'Unit 2: Further Pure Mathematics 2', 75, 90, strftime('%s','now')*1000),
('pp-wfm03-s25-qp-01',    'Edexcel', 'IAL', 'Further Pure F3',         'WFM03', 'subj-edx-ial-fmath3', 'curr-edexcel-ial', 2025, 'May/June', 'WFM03/01', NULL, 'Unit 3: Further Pure Mathematics 3', 75, 90, strftime('%s','now')*1000),
('pp-wme01-s25-qp-01',    'Edexcel', 'IAL', 'Mechanics M1',            'WME01', 'subj-edx-ial-mech1',  'curr-edexcel-ial', 2025, 'May/June', 'WME01/01', NULL, 'Unit 1: Mechanics 1',             75, 90, strftime('%s','now')*1000),
('pp-wme02-s25-qp-01',    'Edexcel', 'IAL', 'Mechanics M2',            'WME02', 'subj-edx-ial-mech2',  'curr-edexcel-ial', 2025, 'May/June', 'WME02/01', NULL, 'Unit 2: Mechanics 2',             75, 90, strftime('%s','now')*1000),
('pp-wme03-s25-qp-01',    'Edexcel', 'IAL', 'Mechanics M3',            'WME03', 'subj-edx-ial-mech3',  'curr-edexcel-ial', 2025, 'May/June', 'WME03/01', NULL, 'Unit 3: Mechanics 3',             75, 90, strftime('%s','now')*1000),
('pp-wst01-s25-qp-01',    'Edexcel', 'IAL', 'Statistics S1',           'WST01', 'subj-edx-ial-stat1',  'curr-edexcel-ial', 2025, 'May/June', 'WST01/01', NULL, 'Unit 1: Statistics 1',            75, 90, strftime('%s','now')*1000),
('pp-wst02-s25-qp-01',    'Edexcel', 'IAL', 'Statistics S2',           'WST02', 'subj-edx-ial-stat2',  'curr-edexcel-ial', 2025, 'May/June', 'WST02/01', NULL, 'Unit 2: Statistics 2',            75, 90, strftime('%s','now')*1000),
('pp-wst03-s25-qp-01',    'Edexcel', 'IAL', 'Statistics S3',           'WST03', 'subj-edx-ial-stat3',  'curr-edexcel-ial', 2025, 'May/June', 'WST03/01', NULL, 'Unit 3: Statistics 3',            75, 90, strftime('%s','now')*1000),
('pp-wdm11-s25-qp-01',    'Edexcel', 'IAL', 'Decision Mathematics D1', 'WDM11', 'subj-edx-ial-dec1',   'curr-edexcel-ial', 2025, 'May/June', 'WDM11/01', NULL, 'Unit 1: Decision Mathematics 1',  75, 90, strftime('%s','now')*1000);

-- October 2025 Further Maths / D1 / M3 / S3 are not assessed — do not insert.
