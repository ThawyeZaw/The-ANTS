-- ============================================================================
-- The ANTS — Migration 3: Classrooms
-- Classroom management: rooms, members, curriculums, assignments, quizzes,
-- discussions, and resources.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.classrooms (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    description       TEXT,
    invite_code       TEXT UNIQUE,
    curriculum_ids    TEXT[],
    enabled_features  JSONB,
    created_by        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.classroom_members (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id  UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role          TEXT NOT NULL DEFAULT 'student',
    joined_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.classroom_curriculums (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id    UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    curriculum_id   UUID NOT NULL REFERENCES public.curriculums(id) ON DELETE CASCADE
);

-- Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id    UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    due_date        TIMESTAMPTZ NOT NULL,
    priority        TEXT NOT NULL DEFAULT 'medium',
    status          TEXT DEFAULT 'draft',
    total_points    INT4,
    attachment_urls TEXT[],
    created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at_assignments ON public.assignments;
CREATE TRIGGER set_updated_at_assignments
    BEFORE UPDATE ON public.assignments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content         TEXT,
    attachment_urls TEXT[],
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    grade           NUMERIC,
    feedback        TEXT,
    graded_at       TIMESTAMPTZ
);

-- Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id        UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    description         TEXT,
    time_limit_minutes  INT4,
    due_date            TIMESTAMPTZ,
    status              TEXT NOT NULL DEFAULT 'draft',
    questions           JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id       UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    answers       JSONB NOT NULL DEFAULT '[]'::jsonb,
    score         NUMERIC,
    total_points  INT4 NOT NULL DEFAULT 0,
    started_at    TIMESTAMPTZ DEFAULT NOW(),
    submitted_at  TIMESTAMPTZ
);

-- Discussions
CREATE TABLE IF NOT EXISTS public.discussion_topics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id    UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    assignment_id   UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
    is_pinned       BOOLEAN DEFAULT false,
    is_locked       BOOLEAN DEFAULT false,
    created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at_discussion_topics ON public.discussion_topics;
CREATE TRIGGER set_updated_at_discussion_topics
    BEFORE UPDATE ON public.discussion_topics
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.discussion_replies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id    UUID NOT NULL REFERENCES public.discussion_topics(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at_discussion_replies ON public.discussion_replies;
CREATE TRIGGER set_updated_at_discussion_replies
    BEFORE UPDATE ON public.discussion_replies
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Classroom Resources
CREATE TABLE IF NOT EXISTS public.classroom_resources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id    UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    type            TEXT NOT NULL,
    url             TEXT NOT NULL,
    curriculum_id   UUID REFERENCES public.curriculums(id) ON DELETE SET NULL,
    subject_id      UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    uploaded_by     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
