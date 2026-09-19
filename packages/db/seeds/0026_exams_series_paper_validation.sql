-- Myanmar Zone 4 Nov 2026 papers for CAIE IT 9626 (series-dependent practicals).
-- Source: 757649-november-2026-zone-4-timetable.pdf
INSERT OR IGNORE INTO exams (id, subject_id, curriculum_id, title, exam_board, qualification_type, syllabus_code, season, series, paper_number, exam_date, duration_minutes, total_marks, created_at) VALUES
('exam-9626-w26-p02', 'subj-caie-al-it', 'curr-caie-alevel', 'Information Technology Practical 02', 'CAIE', 'A Level', '9626', 'Oct/Nov', 'w26', '02', 1790640000000, 150, NULL, strftime('%s', 'now') * 1000),
('exam-9626-w26-p04', 'subj-caie-al-it', 'curr-caie-alevel', 'Information Technology Advanced Practical 04', 'CAIE', 'A Level', '9626', 'Oct/Nov', 'w26', '04', 1790812800000, 150, NULL, strftime('%s', 'now') * 1000),
('exam-9626-w26-p12', 'subj-caie-al-it', 'curr-caie-alevel', 'Information Technology Theory P12', 'CAIE', 'A Level', '9626', 'Oct/Nov', 'w26', '12', 1791158400000, 105, NULL, strftime('%s', 'now') * 1000),
('exam-9626-w26-p32', 'subj-caie-al-it', 'curr-caie-alevel', 'Information Technology Advanced Theory P32', 'CAIE', 'A Level', '9626', 'Oct/Nov', 'w26', '32', 1792972800000, 105, NULL, strftime('%s', 'now') * 1000);
