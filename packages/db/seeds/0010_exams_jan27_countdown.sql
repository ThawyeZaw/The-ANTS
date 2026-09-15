-- 0010_exams_jan27_countdown.sql
-- Edexcel IAL January 2027 Timetable

INSERT OR IGNORE INTO exams (id, subject_id, curriculum_id, title, exam_board, qualification_type, syllabus_code, season, series, paper_number, exam_date, duration_minutes, total_marks, created_at) VALUES
-- Friday 08 January 2027
('exam-wma11-j27-p01', 'subj-edx-ial-pure1', 'curr-edexcel-ial', 'Pure Mathematics 1', 'Edexcel', 'IAL', 'WMA11', 'January', 'j27', '01', 1799398800000, 90, 75, strftime('%s', 'now') * 1000),
('exam-wbi11-j27-p01', 'subj-edx-ial-bio1', 'curr-edexcel-ial', 'Biology Unit 1: Molecules, Diet, Transport & Health', 'Edexcel', 'IAL', 'WBI11', 'January', 'j27', '01', 1799413200000, 90, 80, strftime('%s', 'now') * 1000),
('exam-wps01-j27-p01', 'subj-edx-ial-psych1', 'curr-edexcel-ial', 'Psychology Unit 1: Social and cognitive psychology', 'Edexcel', 'IAL', 'WPS01', 'January', 'j27', '01', 1799413200000, 90, NULL, strftime('%s', 'now') * 1000),

-- Monday 11 January 2027
('exam-wbs11-j27-p01', 'subj-edx-ial-biz1', 'curr-edexcel-ial', 'Business Unit 1: Marketing And People', 'Edexcel', 'IAL', 'WBS11', 'January', 'j27', '01', 1799658000000, 120, 80, strftime('%s', 'now') * 1000),
('exam-wch11-j27-p01', 'subj-edx-ial-chem1', 'curr-edexcel-ial', 'Chemistry Unit 1: Structure, Bonding and Intro Organic', 'Edexcel', 'IAL', 'WCH11', 'January', 'j27', '01', 1799658000000, 90, 80, strftime('%s', 'now') * 1000),
('exam-wec11-j27-p01', 'subj-edx-ial-econ1', 'curr-edexcel-ial', 'Economics Unit 1: Markets In Action', 'Edexcel', 'IAL', 'WEC11', 'January', 'j27', '01', 1799672400000, 105, 80, strftime('%s', 'now') * 1000),
('exam-wph11-j27-p01', 'subj-edx-ial-phys1', 'curr-edexcel-ial', 'Physics Unit 1: Mechanics and Materials', 'Edexcel', 'IAL', 'WPH11', 'January', 'j27', '01', 1799672400000, 90, 80, strftime('%s', 'now') * 1000),

-- Tuesday 12 January 2027
('exam-wac11-j27-p01', 'subj-edx-ial-acc1', 'curr-edexcel-ial', 'Accounting Unit 1: Accounting System and Costing', 'Edexcel', 'IAL', 'WAC11', 'January', 'j27', '01', 1799744400000, 180, 100, strftime('%s', 'now') * 1000),
('exam-wbi12-j27-p01', 'subj-edx-ial-bio2', 'curr-edexcel-ial', 'Biology Unit 2: Cells, Development, Biodiversity', 'Edexcel', 'IAL', 'WBI12', 'January', 'j27', '01', 1799744400000, 90, 80, strftime('%s', 'now') * 1000),
('exam-wps02-j27-p01', 'subj-edx-ial-psych2', 'curr-edexcel-ial', 'Psychology Unit 2: Biological psychology, learning theories', 'Edexcel', 'IAL', 'WPS02', 'January', 'j27', '01', 1799744400000, 120, NULL, strftime('%s', 'now') * 1000),
('exam-wch12-j27-p01', 'subj-edx-ial-chem2', 'curr-edexcel-ial', 'Chemistry Unit 2: Energetics, Group Chem & Halogenoalkanes', 'Edexcel', 'IAL', 'WCH12', 'January', 'j27', '01', 1799758800000, 90, 80, strftime('%s', 'now') * 1000),
('exam-wst01-j27-p01', 'subj-edx-ial-stat1', 'curr-edexcel-ial', 'Statistics S1', 'Edexcel', 'IAL', 'WST01', 'January', 'j27', '01', 1799758800000, 90, 75, strftime('%s', 'now') * 1000),

-- Wednesday 13 January 2027
('exam-wec12-j27-p01', 'subj-edx-ial-econ2', 'curr-edexcel-ial', 'Economics Unit 2: Macroeconomic Performance and Policy', 'Edexcel', 'IAL', 'WEC12', 'January', 'j27', '01', 1799830800000, 105, 80, strftime('%s', 'now') * 1000),
('exam-wma12-j27-p01', 'subj-edx-ial-pure2', 'curr-edexcel-ial', 'Pure Mathematics 2', 'Edexcel', 'IAL', 'WMA12', 'January', 'j27', '01', 1799845200000, 90, 75, strftime('%s', 'now') * 1000),
('exam-wph12-j27-p01', 'subj-edx-ial-phys2', 'curr-edexcel-ial', 'Physics Unit 2: Waves and Electricity', 'Edexcel', 'IAL', 'WPH12', 'January', 'j27', '01', 1799845200000, 90, 80, strftime('%s', 'now') * 1000),

-- Thursday 14 January 2027
('exam-wbi13-j27-p01', 'subj-edx-ial-bio3', 'curr-edexcel-ial', 'Biology Unit 3: Practical Skills in Biology I', 'Edexcel', 'IAL', 'WBI13', 'January', 'j27', '01', 1799917200000, 80, 50, strftime('%s', 'now') * 1000),
('exam-wme01-j27-p01', 'subj-edx-ial-mech1', 'curr-edexcel-ial', 'Mechanics M1', 'Edexcel', 'IAL', 'WME01', 'January', 'j27', '01', 1799917200000, 90, 75, strftime('%s', 'now') * 1000),
('exam-wch13-j27-p01', 'subj-edx-ial-chem3', 'curr-edexcel-ial', 'Chemistry Unit 3: Practical Skills in Chemistry I', 'Edexcel', 'IAL', 'WCH13', 'January', 'j27', '01', 1799931600000, 80, 50, strftime('%s', 'now') * 1000),
('exam-wfm01-j27-p01', 'subj-edx-ial-fmath1', 'curr-edexcel-ial', 'Further Pure Mathematics 1', 'Edexcel', 'IAL', 'WFM01', 'January', 'j27', '01', 1799931600000, 90, 75, strftime('%s', 'now') * 1000),

-- Friday 15 January 2027
('exam-wbs12-j27-p01', 'subj-edx-ial-biz2', 'curr-edexcel-ial', 'Business Unit 2: Managing Business Activities', 'Edexcel', 'IAL', 'WBS12', 'January', 'j27', '01', 1800003600000, 120, 80, strftime('%s', 'now') * 1000),
('exam-wec13-j27-p01', 'subj-edx-ial-econ3', 'curr-edexcel-ial', 'Economics Unit 3: Business Behaviour', 'Edexcel', 'IAL', 'WEC13', 'January', 'j27', '01', 1800003600000, 120, 80, strftime('%s', 'now') * 1000),
('exam-wma13-j27-p01', 'subj-edx-ial-pure3', 'curr-edexcel-ial', 'Pure Mathematics 3', 'Edexcel', 'IAL', 'WMA13', 'January', 'j27', '01', 1800018000000, 90, 75, strftime('%s', 'now') * 1000),
('exam-wph13-j27-p01', 'subj-edx-ial-phys3', 'curr-edexcel-ial', 'Physics Unit 3: Practical Skills in Physics I', 'Edexcel', 'IAL', 'WPH13', 'January', 'j27', '01', 1800018000000, 80, 50, strftime('%s', 'now') * 1000),

-- Monday 18 January 2027
('exam-wbi14-j27-p01', 'subj-edx-ial-bio4', 'curr-edexcel-ial', 'Biology Unit 4: Energy, Environment, Microbiology', 'Edexcel', 'IAL', 'WBI14', 'January', 'j27', '01', 1800262800000, 105, 90, strftime('%s', 'now') * 1000),
('exam-wbs13-j27-p01', 'subj-edx-ial-biz3', 'curr-edexcel-ial', 'Business Unit 3: Business Decisions And Strategy', 'Edexcel', 'IAL', 'WBS13', 'January', 'j27', '01', 1800262800000, 120, 80, strftime('%s', 'now') * 1000),
('exam-wch14-j27-p01', 'subj-edx-ial-chem4', 'curr-edexcel-ial', 'Chemistry Unit 4: Rates, Equilibria & Further Organic', 'Edexcel', 'IAL', 'WCH14', 'January', 'j27', '01', 1800277200000, 105, 90, strftime('%s', 'now') * 1000),
('exam-wst02-j27-p01', 'subj-edx-ial-stat2', 'curr-edexcel-ial', 'Statistics S2', 'Edexcel', 'IAL', 'WST02', 'January', 'j27', '01', 1800277200000, 90, 75, strftime('%s', 'now') * 1000),

-- Tuesday 19 January 2027
('exam-wma14-j27-p01', 'subj-edx-ial-pure4', 'curr-edexcel-ial', 'Pure Mathematics 4', 'Edexcel', 'IAL', 'WMA14', 'January', 'j27', '01', 1800349200000, 90, 75, strftime('%s', 'now') * 1000),
('exam-wdm11-j27-p01', 'subj-edx-ial-dec1', 'curr-edexcel-ial', 'Decision Mathematics 1', 'Edexcel', 'IAL', 'WDM11', 'January', 'j27', '01', 1800363600000, 90, 75, strftime('%s', 'now') * 1000),
('exam-wph14-j27-p01', 'subj-edx-ial-phys4', 'curr-edexcel-ial', 'Physics Unit 4: Further Mechanics, Fields & Particles', 'Edexcel', 'IAL', 'WPH14', 'January', 'j27', '01', 1800363600000, 105, 90, strftime('%s', 'now') * 1000),
('exam-wps03-j27-p01', 'subj-edx-ial-psych3', 'curr-edexcel-ial', 'Psychology Unit 3: Applications of psychology', 'Edexcel', 'IAL', 'WPS03', 'January', 'j27', '01', 1800363600000, 90, NULL, strftime('%s', 'now') * 1000),

-- Wednesday 20 January 2027
('exam-wac12-j27-p01', 'subj-edx-ial-acc2', 'curr-edexcel-ial', 'Accounting Unit 2: Corporate & Management Accounting', 'Edexcel', 'IAL', 'WAC12', 'January', 'j27', '01', 1800435600000, 180, 100, strftime('%s', 'now') * 1000),
('exam-wbi15-j27-p01', 'subj-edx-ial-bio5', 'curr-edexcel-ial', 'Biology Unit 5: Respiration, Coordination & Gene Tech', 'Edexcel', 'IAL', 'WBI15', 'January', 'j27', '01', 1800435600000, 105, 90, strftime('%s', 'now') * 1000),
('exam-wfm02-j27-p01', 'subj-edx-ial-fmath2', 'curr-edexcel-ial', 'Further Pure Mathematics 2', 'Edexcel', 'IAL', 'WFM02', 'January', 'j27', '01', 1800435600000, 90, 75, strftime('%s', 'now') * 1000),
('exam-wec14-j27-p01', 'subj-edx-ial-econ4', 'curr-edexcel-ial', 'Economics Unit 4: Developments In The Global Economy', 'Edexcel', 'IAL', 'WEC14', 'January', 'j27', '01', 1800450000000, 120, 80, strftime('%s', 'now') * 1000),
('exam-wme02-j27-p01', 'subj-edx-ial-mech2', 'curr-edexcel-ial', 'Mechanics M2', 'Edexcel', 'IAL', 'WME02', 'January', 'j27', '01', 1800450000000, 90, 75, strftime('%s', 'now') * 1000),

-- Thursday 21 January 2027
('exam-wbs14-j27-p01', 'subj-edx-ial-biz4', 'curr-edexcel-ial', 'Business Unit 4: Global Business', 'Edexcel', 'IAL', 'WBS14', 'January', 'j27', '01', 1800522000000, 120, 80, strftime('%s', 'now') * 1000),
('exam-wch15-j27-p01', 'subj-edx-ial-chem5', 'curr-edexcel-ial', 'Chemistry Unit 5: Transition Metals & Organic Nitrogen', 'Edexcel', 'IAL', 'WCH15', 'January', 'j27', '01', 1800522000000, 105, 90, strftime('%s', 'now') * 1000),
('exam-wfm03-j27-p01', 'subj-edx-ial-fmath3', 'curr-edexcel-ial', 'Further Pure Mathematics 3', 'Edexcel', 'IAL', 'WFM03', 'January', 'j27', '01', 1800536400000, 90, 75, strftime('%s', 'now') * 1000),
('exam-wph15-j27-p01', 'subj-edx-ial-phys5', 'curr-edexcel-ial', 'Physics Unit 5: Thermodynamics, Radiation, Oscillations', 'Edexcel', 'IAL', 'WPH15', 'January', 'j27', '01', 1800536400000, 105, 90, strftime('%s', 'now') * 1000),

-- Friday 22 January 2027
('exam-wbi16-j27-p01', 'subj-edx-ial-bio6', 'curr-edexcel-ial', 'Biology Unit 6: Practical Skills in Biology II', 'Edexcel', 'IAL', 'WBI16', 'January', 'j27', '01', 1800608400000, 80, 50, strftime('%s', 'now') * 1000),
('exam-wch16-j27-p01', 'subj-edx-ial-chem6', 'curr-edexcel-ial', 'Chemistry Unit 6: Practical Skills in Chemistry II', 'Edexcel', 'IAL', 'WCH16', 'January', 'j27', '01', 1800622800000, 80, 50, strftime('%s', 'now') * 1000),
('exam-wst03-j27-p01', 'subj-edx-ial-stat3', 'curr-edexcel-ial', 'Statistics S3', 'Edexcel', 'IAL', 'WST03', 'January', 'j27', '01', 1800622800000, 90, 75, strftime('%s', 'now') * 1000),

-- Monday 25 January 2027
('exam-wph16-j27-p01', 'subj-edx-ial-phys6', 'curr-edexcel-ial', 'Physics Unit 6: Practical Skills in Physics II', 'Edexcel', 'IAL', 'WPH16', 'January', 'j27', '01', 1800867600000, 80, 50, strftime('%s', 'now') * 1000),
('exam-wme03-j27-p01', 'subj-edx-ial-mech3', 'curr-edexcel-ial', 'Mechanics M3', 'Edexcel', 'IAL', 'WME03', 'January', 'j27', '01', 1800882000000, 90, 75, strftime('%s', 'now') * 1000),
('exam-wps04-j27-p01', 'subj-edx-ial-psych4', 'curr-edexcel-ial', 'Psychology Unit 4: Clinical psychology and skills', 'Edexcel', 'IAL', 'WPS04', 'January', 'j27', '01', 1800882000000, 120, NULL, strftime('%s', 'now') * 1000);
