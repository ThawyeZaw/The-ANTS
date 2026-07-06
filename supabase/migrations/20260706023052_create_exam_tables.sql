-- ============================================================================
-- The ANTS — Migration 7: Exams & Grades
-- Exam schedules, countdowns, grade boundaries, entries, enrollments, and history.
-- ============================================================================

-- Exam schedules (timetable-like structured entries with priority)
CREATE TABLE IF NOT EXISTS public.exam_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id         UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    subject         TEXT,
    exam_board      TEXT,
    paper_code      TEXT,
    date            DATE NOT NULL,
    start_time      TIME,
    duration_minutes INT4,
    session         TEXT,
    series          TEXT,
    year            INT4,
    priority        TEXT DEFAULT 'medium',
    color_code      TEXT,
    is_custom       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at_exam_schedules ON public.exam_schedules;
CREATE TRIGGER set_updated_at_exam_schedules
    BEFORE UPDATE ON public.exam_schedules
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Core exams table
CREATE TABLE IF NOT EXISTS public.exams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_id   UUID REFERENCES public.curriculums(id) ON DELETE SET NULL,
    subject_id      UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject         TEXT NOT NULL,
    exam_board      TEXT,
    paper_code      TEXT,
    date            DATE NOT NULL,
    start_time      TIME,
    duration        INT4,
    session         TEXT,
    series          TEXT,
    year            INT4,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- User exam countdowns
CREATE TABLE IF NOT EXISTS public.exam_countdowns (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id               UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    custom_title          TEXT,
    target_date           TIMESTAMPTZ,
    priority_indicator    TEXT,
    qualification_group   TEXT,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Grade boundaries per exam
CREATE TABLE IF NOT EXISTS public.grade_boundaries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id       UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    raw_mark_max  NUMERIC,
    ums_max       NUMERIC,
    grade_a       NUMERIC,
    grade_b       NUMERIC,
    grade_c       NUMERIC,
    grade_d       NUMERIC,
    grade_e       NUMERIC,
    grade_f       NUMERIC,
    grade_g       NUMERIC,
    grade_u       NUMERIC
);

-- User grade entries
CREATE TABLE IF NOT EXISTS public.grade_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id         UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    component_name  TEXT,
    raw_score       NUMERIC,
    max_score       NUMERIC,
    weight          NUMERIC,
    predicted_grade TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- User enrollments in curriculums/subjects/exams
CREATE TABLE IF NOT EXISTS public.user_enrollments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    curriculum_id   UUID NOT NULL REFERENCES public.curriculums(id) ON DELETE CASCADE,
    subject_id      UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    exam_id         UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    enrolled_at     TIMESTAMPTZ DEFAULT NOW()
);

-- User-specific exam overrides
CREATE TABLE IF NOT EXISTS public.user_exam_overrides (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id               UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    custom_title          TEXT,
    custom_exam_series    TEXT,
    custom_exam_date      TIMESTAMPTZ
);

-- User exam history
CREATE TABLE IF NOT EXISTS public.user_exam_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    curriculum_id   UUID NOT NULL REFERENCES public.curriculums(id) ON DELETE CASCADE,
    subject_id      UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    exam_id         UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    exam_date       TIMESTAMPTZ NOT NULL,
    result          TEXT,
    is_mock         BOOLEAN DEFAULT false,
    notes           TEXT,
    recorded_at     TIMESTAMPTZ DEFAULT NOW()
);
