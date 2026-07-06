-- ============================================================================
-- The ANTS — Seed Data
-- Phase 9: Main contributor + UK curriculum system.
-- ============================================================================
-- Prerequisite: Create the auth.user for thawyezaw@gmail.com via Dashboard.
--                The handle_new_user trigger will auto-create the profile row
--                with role='student'. This seed then upgrades it to main_contributor
--                and fills in all profile details.
-- ============================================================================

-- ============================================================================
-- 1. MAIN CONTRIBUTOR PROFILE — Thaw Ye Zaw
-- ============================================================================
INSERT INTO public.profiles (id, email, name, username, avatar_url, role, is_public, bio, title, social_links,
    projects, activities, achievements, section_visibility, show_club_memberships, show_club_projects, show_club_activity)
SELECT
    id, 'thawyezaw@gmail.com', 'Thaw Ye Zaw', 'thawyezaw', NULL,
    'main_contributor', true,
    'Founder & lead contributor of The ANTS. Passionate about building tools that make exam preparation smarter and more accessible for students across all exam boards.',
    'Founder & Lead Contributor',
    '[{"platform":"github","label":"GitHub","url":"https://github.com/thawyezaw","visible":true}]'::jsonb,
    '[{"id":"p1","title":"The ANTS Platform","description":"Full-stack educational platform for exam preparation","role":"Founder & Lead Developer","technologies":["Next.js","Supabase","TypeScript","Tailwind CSS"]}]'::jsonb,
    '[{"id":"a1","name":"EdTech Community Building","organization":"The ANTS","role":"Founder","start_date":"2024-01"}]'::jsonb,
    '[{"id":"ach1","title":"Platform Launch","description":"Successfully launched The ANTS v1.0","date":"2025-06"}]'::jsonb,
    '{"projects":true,"activities":true,"achievements":true}'::jsonb,
    true, true, true
FROM auth.users WHERE email = 'thawyezaw@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    is_public = EXCLUDED.is_public,
    bio = EXCLUDED.bio,
    title = EXCLUDED.title,
    social_links = EXCLUDED.social_links,
    projects = EXCLUDED.projects,
    activities = EXCLUDED.activities,
    achievements = EXCLUDED.achievements,
    section_visibility = EXCLUDED.section_visibility,
    show_club_memberships = EXCLUDED.show_club_memberships,
    show_club_projects = EXCLUDED.show_club_projects,
    show_club_activity = EXCLUDED.show_club_activity;

-- ============================================================================
-- 2. CURRICULUMS (UK Curriculum System)
-- ============================================================================

-- 2.1 CAIE IGCSE Chemistry (0620) — Linear
INSERT INTO public.curriculums (title, description, qualification, exam_board, syllabus_code,
    structure_type, grading_system, hierarchy_model, created_by, status, is_public, library_status)
SELECT
    'CAIE IGCSE Chemistry (0620)',
    'Cambridge IGCSE Chemistry syllabus. Linear structure — all exams at the end of a two-year course. Divided into Core (max grade C) and Extended (max grade A*). Three papers per exam series.',
    'IGCSE', 'CAIE', '0620',
    'linear', 'raw_marks_AG',
    '{"level1":"Subject","level2":"Paper","level3":"Topic"}'::jsonb,
    p.id, 'published', true, 'approved'
FROM public.profiles p WHERE p.email = 'thawyezaw@gmail.com';

-- 2.2 CAIE IGCSE Physics (0625) — Linear
INSERT INTO public.curriculums (title, description, qualification, exam_board, syllabus_code,
    structure_type, grading_system, hierarchy_model, created_by, status, is_public, library_status)
SELECT
    'CAIE IGCSE Physics (0625)',
    'Cambridge IGCSE Physics syllabus. Linear structure. Papers: Multiple Choice (P1/P2), Theory (P3/P4), and Practical (P5/P6).',
    'IGCSE', 'CAIE', '0625',
    'linear', 'raw_marks_AG',
    '{"level1":"Subject","level2":"Paper","level3":"Topic"}'::jsonb,
    p.id, 'published', true, 'approved'
FROM public.profiles p WHERE p.email = 'thawyezaw@gmail.com';

-- 2.3 CAIE IGCSE Mathematics (0580) — Linear
INSERT INTO public.curriculums (title, description, qualification, exam_board, syllabus_code,
    structure_type, grading_system, hierarchy_model, created_by, status, is_public, library_status)
SELECT
    'CAIE IGCSE Mathematics (0580)',
    'Cambridge IGCSE Mathematics syllabus. Linear structure. Core and Extended tiers available.',
    'IGCSE', 'CAIE', '0580',
    'linear', 'raw_marks_91',
    '{"level1":"Subject","level2":"Paper","level3":"Topic"}'::jsonb,
    p.id, 'published', true, 'approved'
FROM public.profiles p WHERE p.email = 'thawyezaw@gmail.com';

-- 2.4 Edexcel IGCSE Mathematics A (4MA1) — Linear
INSERT INTO public.curriculums (title, description, qualification, exam_board, syllabus_code,
    structure_type, grading_system, hierarchy_model, created_by, status, is_public, library_status)
SELECT
    'Edexcel IGCSE Mathematics A (4MA1)',
    'Pearson Edexcel International GCSE Mathematics A. Linear structure. Graded 9-1. Two papers per exam series.',
    'IGCSE', 'Edexcel', '4MA1',
    'linear', 'raw_marks_91',
    '{"level1":"Subject","level2":"Paper","level3":"Topic"}'::jsonb,
    p.id, 'published', true, 'approved'
FROM public.profiles p WHERE p.email = 'thawyezaw@gmail.com';

-- 2.5 Edexcel IGCSE Physics (4PH1) — Linear
INSERT INTO public.curriculums (title, description, qualification, exam_board, syllabus_code,
    structure_type, grading_system, hierarchy_model, created_by, status, is_public, library_status)
SELECT
    'Edexcel IGCSE Physics (4PH1)',
    'Pearson Edexcel International GCSE Physics. Linear structure. Graded 9-1.',
    'IGCSE', 'Edexcel', '4PH1',
    'linear', 'raw_marks_91',
    '{"level1":"Subject","level2":"Paper","level3":"Topic"}'::jsonb,
    p.id, 'published', true, 'approved'
FROM public.profiles p WHERE p.email = 'thawyezaw@gmail.com';

-- 2.6 Edexcel IAL Mathematics — Modular (Units)
INSERT INTO public.curriculums (title, description, qualification, exam_board, syllabus_code,
    structure_type, grading_system, hierarchy_model, created_by, status, is_public, library_status)
SELECT
    'Edexcel IAL Mathematics (Full A-Level)',
    'Pearson Edexcel International Advanced Level Mathematics. Highly modular — students take individual unit exams (e.g. WMA11 Pure 1, WMA12 Pure 2) across different series. Uses UMS (Uniform Mark Scale). Requires cash-in for final certification.',
    'IAL', 'Edexcel', 'XMA01',
    'modular', 'ums',
    '{"level1":"Subject","level2":"Unit","level3":"Topic"}'::jsonb,
    p.id, 'published', true, 'approved'
FROM public.profiles p WHERE p.email = 'thawyezaw@gmail.com';

-- 2.7 CAIE AS & A Level Physics (9702) — Staged Linear
INSERT INTO public.curriculums (title, description, qualification, exam_board, syllabus_code,
    structure_type, grading_system, hierarchy_model, created_by, status, is_public, library_status)
SELECT
    'CAIE AS & A Level Physics (9702)',
    'Cambridge International AS & A Level Physics. Staged linear — students can take AS (Year 1) and carry marks forward to A2 (Year 2) within 13 months, or take all papers at the end.',
    'AS/A Level', 'CAIE', '9702',
    'staged_linear', 'raw_marks_AG',
    '{"level1":"Subject","level2":"Paper","level3":"Topic"}'::jsonb,
    p.id, 'published', true, 'approved'
FROM public.profiles p WHERE p.email = 'thawyezaw@gmail.com';

-- 2.8 CAIE AS & A Level Chemistry (9701) — Staged Linear
INSERT INTO public.curriculums (title, description, qualification, exam_board, syllabus_code,
    structure_type, grading_system, hierarchy_model, created_by, status, is_public, library_status)
SELECT
    'CAIE AS & A Level Chemistry (9701)',
    'Cambridge International AS & A Level Chemistry. Staged linear assessment model.',
    'AS/A Level', 'CAIE', '9701',
    'staged_linear', 'raw_marks_AG',
    '{"level1":"Subject","level2":"Paper","level3":"Topic"}'::jsonb,
    p.id, 'published', true, 'approved'
FROM public.profiles p WHERE p.email = 'thawyezaw@gmail.com';

-- 2.9 IELTS Academic — Proficiency
INSERT INTO public.curriculums (title, description, qualification, exam_board, syllabus_code,
    structure_type, grading_system, hierarchy_model, created_by, status, is_public, library_status)
SELECT
    'IELTS Academic',
    'International English Language Testing System (Academic). Single-sitting proficiency test covering Reading, Writing, Listening, and Speaking. Band scores 0-9.0. Continuous exam dates.',
    'IELTS', 'IELTS', 'IELTS-AC',
    'single_test', 'band',
    '{"level1":"Module","level2":"Skill","level3":"Sub-skill"}'::jsonb,
    p.id, 'published', true, 'approved'
FROM public.profiles p WHERE p.email = 'thawyezaw@gmail.com';

-- ============================================================================
-- 3. SUBJECTS (Papers / Units / Modules per curriculum)
-- ============================================================================

-- 3.1 CAIE IGCSE Chemistry papers
INSERT INTO public.subjects (id, curriculum_id, title, description, order_no) VALUES
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '0620' LIMIT 1), 'Paper 1: Multiple Choice (Core)', '40 multiple-choice questions, 45 minutes, 40 marks', 1),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '0620' LIMIT 1), 'Paper 2: Multiple Choice (Extended)', '40 multiple-choice questions, 45 minutes, 40 marks', 2),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '0620' LIMIT 1), 'Paper 3: Theory (Core)', 'Short-answer and structured questions, 1h15m, 80 marks', 3),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '0620' LIMIT 1), 'Paper 4: Theory (Extended)', 'Short-answer and structured questions, 1h15m, 80 marks', 4),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '0620' LIMIT 1), 'Paper 5: Practical Test', 'Practical assessment, 1h15m, 40 marks', 5),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '0620' LIMIT 1), 'Paper 6: Alternative to Practical', 'Written paper about practical work, 1h, 40 marks', 6);

-- 3.2 CAIE IGCSE Physics papers
INSERT INTO public.subjects (id, curriculum_id, title, description, order_no) VALUES
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '0625' LIMIT 1), 'Paper 1: Multiple Choice (Core)', '40 MCQs, 45 minutes', 1),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '0625' LIMIT 1), 'Paper 2: Multiple Choice (Extended)', '40 MCQs, 45 minutes', 2),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '0625' LIMIT 1), 'Paper 3: Theory (Core)', 'Structured questions, 1h15m', 3),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '0625' LIMIT 1), 'Paper 4: Theory (Extended)', 'Structured questions, 1h15m', 4);

-- 3.3 Edexcel IAL Mathematics units
INSERT INTO public.subjects (id, curriculum_id, title, description, order_no) VALUES
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = 'XMA01' LIMIT 1), 'WMA11: Pure Mathematics 1', 'Algebra, coordinate geometry, differentiation, integration. 1h30m, 75 marks.', 1),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = 'XMA01' LIMIT 1), 'WMA12: Pure Mathematics 2', 'Advanced algebra, trigonometry, sequences, calculus. 1h30m, 75 marks.', 2),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = 'XMA01' LIMIT 1), 'WMA13: Pure Mathematics 3', 'Further calculus, vectors, complex numbers. 1h30m, 75 marks.', 3),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = 'XMA01' LIMIT 1), 'WMA14: Pure Mathematics 4', 'Advanced pure topics. 1h30m, 75 marks.', 4),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = 'XMA01' LIMIT 1), 'WST01: Statistics 1', 'Probability, distributions, hypothesis testing. 1h30m, 75 marks.', 5),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = 'XMA01' LIMIT 1), 'WME01: Mechanics 1', 'Kinematics, forces, moments. 1h30m, 75 marks.', 6);

-- 3.4 CAIE A Level Physics papers
INSERT INTO public.subjects (id, curriculum_id, title, description, order_no) VALUES
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '9702' LIMIT 1), 'AS Paper 1: Multiple Choice', '40 MCQs, 1h15m, 40 marks', 1),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '9702' LIMIT 1), 'AS Paper 2: AS Structured Questions', 'Structured questions, 1h15m, 60 marks', 2),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '9702' LIMIT 1), 'AS Paper 3: Advanced Practical Skills', 'Practical assessment, 2h, 40 marks', 3),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '9702' LIMIT 1), 'A2 Paper 4: A Level Structured Questions', 'Structured questions, 2h, 100 marks', 4),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = '9702' LIMIT 1), 'A2 Paper 5: Planning, Analysis & Evaluation', 'Practical planning, 1h15m, 30 marks', 5);

-- 3.5 IELTS modules
INSERT INTO public.subjects (id, curriculum_id, title, description, order_no) VALUES
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = 'IELTS-AC' LIMIT 1), 'Listening', '4 sections, 40 questions, 30 minutes (+10 min transfer time)', 1),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = 'IELTS-AC' LIMIT 1), 'Reading', '3 passages, 40 questions, 60 minutes', 2),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = 'IELTS-AC' LIMIT 1), 'Writing', '2 tasks (150 + 250 words), 60 minutes', 3),
(gen_random_uuid(), (SELECT id FROM public.curriculums WHERE syllabus_code = 'IELTS-AC' LIMIT 1), 'Speaking', '3 parts, 11-14 minutes, face-to-face interview', 4);

-- ============================================================================
-- 4. TOPICS (per subject)
-- ============================================================================

-- 4.1 CAIE IGCSE Chemistry — Paper 4 Theory topics
DO $$
DECLARE
    v_paper4_id UUID;
BEGIN
    SELECT id INTO v_paper4_id FROM public.subjects WHERE title = 'Paper 4: Theory (Extended)' LIMIT 1;
    INSERT INTO public.topics (id, subject_id, title, description, order_no) VALUES
    (gen_random_uuid(), v_paper4_id, 'States of Matter', 'Solids, liquids, gases. Kinetic particle theory. Diffusion.', 1),
    (gen_random_uuid(), v_paper4_id, 'Atoms, Elements and Compounds', 'Atomic structure, periodic table, bonding (ionic, covalent, metallic).', 2),
    (gen_random_uuid(), v_paper4_id, 'Stoichiometry', 'Mole concept, empirical/molecular formulae, reacting masses, percentage yield.', 3),
    (gen_random_uuid(), v_paper4_id, 'Electrochemistry', 'Electrolysis, electrochemical cells, redox reactions.', 4),
    (gen_random_uuid(), v_paper4_id, 'Chemical Energetics', 'Exothermic/endothermic reactions, bond energies, enthalpy changes.', 5),
    (gen_random_uuid(), v_paper4_id, 'Chemical Reactions', 'Rate of reaction, reversible reactions, equilibrium, redox.', 6),
    (gen_random_uuid(), v_paper4_id, 'Acids, Bases and Salts', 'Properties, pH scale, titrations, salt preparation.', 7),
    (gen_random_uuid(), v_paper4_id, 'The Periodic Table', 'Group trends, transition elements, noble gases.', 8),
    (gen_random_uuid(), v_paper4_id, 'Metals', 'Properties, reactivity series, extraction, uses of metals.', 9),
    (gen_random_uuid(), v_paper4_id, 'Organic Chemistry', 'Alkanes, alkenes, alcohols, carboxylic acids, polymers.', 10);
END $$;

-- 4.2 Edexcel IAL — WMA11 Pure 1 topics
DO $$
DECLARE
    v_wma11_id UUID;
BEGIN
    SELECT id INTO v_wma11_id FROM public.subjects WHERE title = 'WMA11: Pure Mathematics 1' LIMIT 1;
    INSERT INTO public.topics (id, subject_id, title, description, order_no) VALUES
    (gen_random_uuid(), v_wma11_id, 'Algebra and Functions', 'Laws of indices, surds, quadratic functions, simultaneous equations, inequalities.', 1),
    (gen_random_uuid(), v_wma11_id, 'Coordinate Geometry', 'Equation of a straight line, gradient, parallel/perpendicular lines.', 2),
    (gen_random_uuid(), v_wma11_id, 'Differentiation', 'First principles, power rule, tangents and normals, stationary points.', 3),
    (gen_random_uuid(), v_wma11_id, 'Integration', 'Indefinite/definite integrals, area under a curve.', 4),
    (gen_random_uuid(), v_wma11_id, 'Trigonometry', 'Sine/cosine rule, graphs, trigonometric equations.', 5),
    (gen_random_uuid(), v_wma11_id, 'Vectors', 'Vector notation, magnitude, direction, scalar product.', 6);
END $$;

-- 4.3 Edexcel IAL — WMA12 Pure 2 topics
DO $$
DECLARE
    v_wma12_id UUID;
BEGIN
    SELECT id INTO v_wma12_id FROM public.subjects WHERE title = 'WMA12: Pure Mathematics 2' LIMIT 1;
    INSERT INTO public.topics (id, subject_id, title, description, order_no) VALUES
    (gen_random_uuid(), v_wma12_id, 'Proof', 'Proof by deduction, exhaustion, contradiction.', 1),
    (gen_random_uuid(), v_wma12_id, 'Algebra and Partial Fractions', 'Algebraic division, factor theorem, partial fractions.', 2),
    (gen_random_uuid(), v_wma12_id, 'Sequences and Series', 'Arithmetic/geometric progressions, binomial expansion, sigma notation.', 3),
    (gen_random_uuid(), v_wma12_id, 'Functions and Modelling', 'Domain, range, inverse functions, modulus, transformations.', 4),
    (gen_random_uuid(), v_wma12_id, 'Exponentials and Logarithms', 'Natural log, exponential models, logarithmic equations.', 5),
    (gen_random_uuid(), v_wma12_id, 'Trigonometric Functions', 'Radian measure, identities, harmonic form.', 6),
    (gen_random_uuid(), v_wma12_id, 'Further Calculus', 'Chain/product/quotient rules, parametric/numerical methods.', 7);
END $$;

-- 4.4 IELTS Writing topic skills
DO $$
DECLARE
    v_writing_id UUID;
BEGIN
    SELECT id INTO v_writing_id FROM public.subjects WHERE title = 'Writing' LIMIT 1;
    INSERT INTO public.topics (id, subject_id, title, description, order_no) VALUES
    (gen_random_uuid(), v_writing_id, 'Task 1: Data Description', 'Describing graphs, charts, tables, maps, and processes (150 words minimum). Structure: overview, key features, comparisons.', 1),
    (gen_random_uuid(), v_writing_id, 'Task 2: Essay Writing', 'Opinion, discussion, problem-solution, and advantages/disadvantages essays (250 words minimum). Structure: introduction, body paragraphs, conclusion.', 2),
    (gen_random_uuid(), v_writing_id, 'Coherence and Cohesion', 'Paragraph organization, logical connectors, referencing, topic sentences.', 3),
    (gen_random_uuid(), v_writing_id, 'Lexical Resource', 'Academic vocabulary range, collocations, paraphrasing, avoiding repetition.', 4),
    (gen_random_uuid(), v_writing_id, 'Grammatical Range and Accuracy', 'Complex sentence structures, tense control, punctuation, error-free sentences.', 5);
END $$;

-- 4.5 IELTS Speaking topic skills
DO $$
DECLARE
    v_speaking_id UUID;
BEGIN
    SELECT id INTO v_speaking_id FROM public.subjects WHERE title = 'Speaking' LIMIT 1;
    INSERT INTO public.topics (id, subject_id, title, description, order_no) VALUES
    (gen_random_uuid(), v_speaking_id, 'Part 1: Introduction & Interview', 'Personal questions about home, family, work, studies, interests (4-5 min).', 1),
    (gen_random_uuid(), v_speaking_id, 'Part 2: Long Turn', 'Cue card topic — speak for 1-2 minutes with 1 minute preparation.', 2),
    (gen_random_uuid(), v_speaking_id, 'Part 3: Discussion', 'Abstract discussion related to Part 2 topic (4-5 min). Expressing and justifying opinions.', 3),
    (gen_random_uuid(), v_speaking_id, 'Fluency & Coherence', 'Speaking without hesitation, logical organization, appropriate discourse markers.', 4),
    (gen_random_uuid(), v_speaking_id, 'Pronunciation', 'Word stress, sentence stress, intonation, connected speech.', 5);
END $$;

-- ============================================================================
-- 5. EXAMS (with schedules)
-- ============================================================================

INSERT INTO public.exams (id, curriculum_id, subject_id, subject, exam_board, paper_code, date, start_time, duration, session, series, year)
SELECT gen_random_uuid(), c.id, s.id, 'Chemistry', 'CAIE', '0620/41',
    '2026-05-12', '09:00', 75, 'AM', 'May/June', 2026
FROM public.curriculums c
JOIN public.subjects s ON s.curriculum_id = c.id
WHERE c.syllabus_code = '0620' AND s.title = 'Paper 4: Theory (Extended)'
LIMIT 1;

INSERT INTO public.exams (id, curriculum_id, subject_id, subject, exam_board, paper_code, date, start_time, duration, session, series, year)
SELECT gen_random_uuid(), c.id, s.id, 'Physics', 'CAIE', '0625/41',
    '2026-05-15', '09:00', 75, 'AM', 'May/June', 2026
FROM public.curriculums c
JOIN public.subjects s ON s.curriculum_id = c.id
WHERE c.syllabus_code = '0625' AND s.title = 'Paper 4: Theory (Extended)'
LIMIT 1;

INSERT INTO public.exams (id, curriculum_id, subject_id, subject, exam_board, paper_code, date, start_time, duration, session, series, year)
SELECT gen_random_uuid(), c.id, s.id, 'Pure Mathematics 1', 'Edexcel', 'WMA11',
    '2026-01-15', '09:00', 90, 'AM', 'January', 2026
FROM public.curriculums c
JOIN public.subjects s ON s.curriculum_id = c.id
WHERE c.syllabus_code = 'XMA01' AND s.title = 'WMA11: Pure Mathematics 1'
LIMIT 1;

INSERT INTO public.exams (id, curriculum_id, subject_id, subject, exam_board, paper_code, date, start_time, duration, session, series, year)
SELECT gen_random_uuid(), c.id, s.id, 'Pure Mathematics 2', 'Edexcel', 'WMA12',
    '2026-01-22', '09:00', 90, 'AM', 'January', 2026
FROM public.curriculums c
JOIN public.subjects s ON s.curriculum_id = c.id
WHERE c.syllabus_code = 'XMA01' AND s.title = 'WMA12: Pure Mathematics 2'
LIMIT 1;

INSERT INTO public.exams (id, curriculum_id, subject_id, subject, exam_board, paper_code, date, start_time, duration, session, series, year)
SELECT gen_random_uuid(), c.id, s.id, 'Statistics 1', 'Edexcel', 'WST01',
    '2026-06-05', '13:00', 90, 'PM', 'May/June', 2026
FROM public.curriculums c
JOIN public.subjects s ON s.curriculum_id = c.id
WHERE c.syllabus_code = 'XMA01' AND s.title = 'WST01: Statistics 1'
LIMIT 1;

-- ============================================================================
-- 6. GRADE BOUNDARIES
-- ============================================================================

DO $$
DECLARE
    v_exam_id UUID;
BEGIN
    SELECT id INTO v_exam_id FROM public.exams WHERE paper_code = '0620/41' LIMIT 1;
    INSERT INTO public.grade_boundaries (id, exam_id, raw_mark_max, grade_a, grade_b, grade_c, grade_d, grade_e, grade_f, grade_g, grade_u)
    VALUES (gen_random_uuid(), v_exam_id, 80, 65, 54, 43, 32, 21, 14, 8, 0);
END $$;

DO $$
DECLARE
    v_exam_id UUID;
BEGIN
    SELECT id INTO v_exam_id FROM public.exams WHERE paper_code = 'WMA11' LIMIT 1;
    INSERT INTO public.grade_boundaries (id, exam_id, raw_mark_max, ums_max, grade_a, grade_b, grade_c, grade_d, grade_e, grade_u)
    VALUES (gen_random_uuid(), v_exam_id, 75, 100, 63, 55, 47, 39, 31, 0);
END $$;

DO $$
DECLARE
    v_exam_id UUID;
BEGIN
    SELECT id INTO v_exam_id FROM public.exams WHERE paper_code = 'WMA12' LIMIT 1;
    INSERT INTO public.grade_boundaries (id, exam_id, raw_mark_max, ums_max, grade_a, grade_b, grade_c, grade_d, grade_e, grade_u)
    VALUES (gen_random_uuid(), v_exam_id, 75, 100, 59, 51, 43, 35, 27, 0);
END $$;

-- ============================================================================
-- 7. CLUB — The ANTS Science Hub
-- ============================================================================

DO $$
DECLARE
    v_main_mc UUID;
    v_club_id UUID;
BEGIN
    SELECT p.id INTO v_main_mc FROM public.profiles p WHERE p.email = 'thawyezaw@gmail.com';

    INSERT INTO public.clubs (name, description, created_by, join_mode, tagline, is_showcase)
    VALUES ('The ANTS Science Hub', 'A community for science enthusiasts. Discuss Physics, Chemistry, Biology across all exam boards. Share resources, study tips, and lab techniques.', v_main_mc, 'open', 'Exploring science, one experiment at a time', true)
    RETURNING id INTO v_club_id;

    INSERT INTO public.club_members (club_id, user_id, role, membership_status, joined_at)
    VALUES (v_club_id, v_main_mc, 'admin', 'active', NOW());

    INSERT INTO public.club_announcements (club_id, created_by, title, content) VALUES
    (v_club_id, v_main_mc, 'Welcome to the Science Hub!', 'Welcome everyone! This club is for sharing science resources and discussing exam techniques across CAIE, Edexcel, and more. Feel free to introduce yourself in the chat!');

    INSERT INTO public.club_links (club_id, title, url, shared_by) VALUES
    (v_club_id, 'CAIE IGCSE Chemistry Syllabus (0620)', 'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-chemistry-0620/', v_main_mc),
    (v_club_id, 'Edexcel IAL Mathematics Specification', 'https://qualifications.pearson.com/en/qualifications/edexcel-international-advanced-levels/mathematics.html', v_main_mc);

    INSERT INTO public.club_milestones (club_id, title, description, status, target_date, created_by) VALUES
    (v_club_id, 'Reach 50 members', 'Grow the Science Hub to 50 active members', 'in_progress', '2026-06-01', v_main_mc),
    (v_club_id, 'Publish 10 flashcard decks', 'Create and share 10 high-quality flashcard decks covering science topics', 'planned', '2026-04-01', v_main_mc);
END $$;

-- ============================================================================
-- DONE
-- ============================================================================
-- Verify:
--   SELECT count(*) FROM public.profiles WHERE email = 'thawyezaw@gmail.com' AND role = 'main_contributor';  -- 1
--   SELECT count(*) FROM public.curriculums;  -- 9
--   SELECT count(*) FROM public.subjects;     -- 25
--   SELECT count(*) FROM public.topics;        -- 33
--   SELECT count(*) FROM public.exams;         -- 5
--   SELECT count(*) FROM public.grade_boundaries; -- 3
--   SELECT count(*) FROM public.clubs;          -- 1
-- ============================================================================
