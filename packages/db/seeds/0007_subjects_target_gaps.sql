-- 0007_subjects_target_gaps.sql
-- Fills catalog gaps for official target subjects per docs/seeds/target-catalog.md

-- Edexcel IGCSE (5 missing subjects)
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-edx-igcse-maths-b', 'curr-edexcel-igcse', 'Mathematics B', '4MB1', 'Pearson Edexcel International GCSE Mathematics B', '#3b82f6', strftime('%s', 'now') * 1000),
('subj-edx-igcse-human-bio', 'curr-edexcel-igcse', 'Human Biology', '4HB1', 'Pearson Edexcel International GCSE Human Biology', '#10b981', strftime('%s', 'now') * 1000),
('subj-edx-igcse-cs', 'curr-edexcel-igcse', 'Computer Science', '4CP0', 'Pearson Edexcel International GCSE Computer Science', '#f59e0b', strftime('%s', 'now') * 1000),
('subj-edx-igcse-eng-b', 'curr-edexcel-igcse', 'English Language B', '4EB1', 'Pearson Edexcel International GCSE English Language B', '#f97316', strftime('%s', 'now') * 1000),
('subj-edx-igcse-esl', 'curr-edexcel-igcse', 'English as a Second Language', '4ES1', 'Pearson Edexcel International GCSE English as a Second Language', '#f97316', strftime('%s', 'now') * 1000);

-- CAIE A Level (6 missing subjects)
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-caie-al-fmaths', 'curr-caie-alevel', 'Further Mathematics', '9231', 'Cambridge International AS & A Level Further Mathematics', '#2563eb', strftime('%s', 'now') * 1000),
('subj-caie-al-it', 'curr-caie-alevel', 'Information Technology', '9626', 'Cambridge International AS & A Level Information Technology', '#f59e0b', strftime('%s', 'now') * 1000),
('subj-caie-al-biz', 'curr-caie-alevel', 'Business', '9609', 'Cambridge International AS & A Level Business', '#6366f1', strftime('%s', 'now') * 1000),
('subj-caie-al-acc', 'curr-caie-alevel', 'Accounting', '9706', 'Cambridge International AS & A Level Accounting', '#eab308', strftime('%s', 'now') * 1000),
('subj-caie-al-eng-lang', 'curr-caie-alevel', 'English Language', '9093', 'Cambridge International AS & A Level English Language', '#f97316', strftime('%s', 'now') * 1000),
('subj-caie-al-lit', 'curr-caie-alevel', 'Literature in English', '9695', 'Cambridge International AS & A Level Literature in English', '#ef4444', strftime('%s', 'now') * 1000);

-- Edexcel IAL units (19 missing units)
INSERT OR IGNORE INTO subjects (id, curriculum_id, name, code, description, color_code, created_at) VALUES
('subj-edx-ial-fmath1', 'curr-edexcel-ial', 'Further Pure F1', 'WFM01', 'Pearson Edexcel IAL Further Pure Mathematics F1 (XFM01/YFM01)', '#1e3a8a', strftime('%s', 'now') * 1000),
('subj-edx-ial-fmath2', 'curr-edexcel-ial', 'Further Pure F2', 'WFM02', 'Pearson Edexcel IAL Further Pure Mathematics F2 (YFM01)', '#1e3a8a', strftime('%s', 'now') * 1000),
('subj-edx-ial-fmath3', 'curr-edexcel-ial', 'Further Pure F3', 'WFM03', 'Pearson Edexcel IAL Further Pure Mathematics F3 (YFM01)', '#1e3a8a', strftime('%s', 'now') * 1000),
('subj-edx-ial-dec1', 'curr-edexcel-ial', 'Decision Mathematics D1', 'WDM11', 'Pearson Edexcel IAL Decision Mathematics D1 (YFM01)', '#0ea5e9', strftime('%s', 'now') * 1000),
('subj-edx-ial-it1', 'curr-edexcel-ial', 'IT Unit 1', 'WIT11', 'Pearson Edexcel IAL Information Technology Unit 1 (XIT11/YIT11)', '#f59e0b', strftime('%s', 'now') * 1000),
('subj-edx-ial-it2', 'curr-edexcel-ial', 'IT Unit 2', 'WIT12', 'Pearson Edexcel IAL Information Technology Unit 2 (XIT11/YIT11)', '#d97706', strftime('%s', 'now') * 1000),
('subj-edx-ial-it3', 'curr-edexcel-ial', 'IT Unit 3', 'WIT13', 'Pearson Edexcel IAL Information Technology Unit 3 (YIT11)', '#b45309', strftime('%s', 'now') * 1000),
('subj-edx-ial-it4', 'curr-edexcel-ial', 'IT Unit 4', 'WIT14', 'Pearson Edexcel IAL Information Technology Unit 4 (YIT11)', '#92400e', strftime('%s', 'now') * 1000),
('subj-edx-ial-cs1', 'curr-edexcel-ial', 'Computer Science Unit 1', 'WCP01', 'Pearson Edexcel IAL Computer Science Unit 1 (XCP01/YCP01)', '#f59e0b', strftime('%s', 'now') * 1000),
('subj-edx-ial-cs2', 'curr-edexcel-ial', 'Computer Science Unit 2', 'WCP02', 'Pearson Edexcel IAL Computer Science Unit 2 (XCP01/YCP01)', '#d97706', strftime('%s', 'now') * 1000),
('subj-edx-ial-cs3', 'curr-edexcel-ial', 'Computer Science Unit 3', 'WCP03', 'Pearson Edexcel IAL Computer Science Unit 3 (YCP01)', '#b45309', strftime('%s', 'now') * 1000),
('subj-edx-ial-cs4', 'curr-edexcel-ial', 'Computer Science Unit 4', 'WCP04', 'Pearson Edexcel IAL Computer Science Unit 4 (YCP01)', '#92400e', strftime('%s', 'now') * 1000),
('subj-edx-ial-eng1', 'curr-edexcel-ial', 'English Language Unit 1', 'WEN01', 'Pearson Edexcel IAL English Language Unit 1 (XEN01/YEN01)', '#f97316', strftime('%s', 'now') * 1000),
('subj-edx-ial-eng2', 'curr-edexcel-ial', 'English Language Unit 2', 'WEN02', 'Pearson Edexcel IAL English Language Unit 2 (XEN01/YEN01)', '#ea580c', strftime('%s', 'now') * 1000),
('subj-edx-ial-eng3', 'curr-edexcel-ial', 'English Language Unit 3', 'WEN03', 'Pearson Edexcel IAL English Language Unit 3 (YEN01)', '#c2410c', strftime('%s', 'now') * 1000),
('subj-edx-ial-eng4', 'curr-edexcel-ial', 'English Language Unit 4', 'WEN04', 'Pearson Edexcel IAL English Language Unit 4 (YEN01)', '#9a3412', strftime('%s', 'now') * 1000),
('subj-edx-ial-lit1', 'curr-edexcel-ial', 'English Literature Unit 1', 'WET01', 'Pearson Edexcel IAL English Literature Unit 1 (XET01/YET01)', '#ef4444', strftime('%s', 'now') * 1000),
('subj-edx-ial-lit2', 'curr-edexcel-ial', 'English Literature Unit 2', 'WET02', 'Pearson Edexcel IAL English Literature Unit 2 (XET01/YET01)', '#dc2626', strftime('%s', 'now') * 1000),
('subj-edx-ial-lit3', 'curr-edexcel-ial', 'English Literature Unit 3', 'WET03', 'Pearson Edexcel IAL English Literature Unit 3 (YET01)', '#b91c1c', strftime('%s', 'now') * 1000),
('subj-edx-ial-lit4', 'curr-edexcel-ial', 'English Literature Unit 4', 'WET04', 'Pearson Edexcel IAL English Literature Unit 4 (YET01)', '#991b1b', strftime('%s', 'now') * 1000),
('subj-edx-ial-mech3', 'curr-edexcel-ial', 'Mechanics M3', 'WME03', 'Pearson Edexcel IAL Mechanics M3 (YFM01)', '#0284c7', strftime('%s', 'now') * 1000),
('subj-edx-ial-stat3', 'curr-edexcel-ial', 'Statistics S3', 'WST03', 'Pearson Edexcel IAL Statistics S3 (YFM01)', '#0284c7', strftime('%s', 'now') * 1000),
('subj-edx-ial-psych1', 'curr-edexcel-ial', 'Psychology Unit 1', 'WPS01', 'Pearson Edexcel IAL Psychology Unit 1: Social and cognitive psychology (XPS01/YPS01)', '#a855f7', strftime('%s', 'now') * 1000),
('subj-edx-ial-psych2', 'curr-edexcel-ial', 'Psychology Unit 2', 'WPS02', 'Pearson Edexcel IAL Psychology Unit 2: Biological psychology, learning theories and development (XPS01/YPS01)', '#9333ea', strftime('%s', 'now') * 1000),
('subj-edx-ial-psych3', 'curr-edexcel-ial', 'Psychology Unit 3', 'WPS03', 'Pearson Edexcel IAL Psychology Unit 3: Applications of psychology (YPS01)', '#7e22ce', strftime('%s', 'now') * 1000),
('subj-edx-ial-psych4', 'curr-edexcel-ial', 'Psychology Unit 4', 'WPS04', 'Pearson Edexcel IAL Psychology Unit 4: Clinical psychology and psychological skills (YPS01)', '#6b21a8', strftime('%s', 'now') * 1000);

