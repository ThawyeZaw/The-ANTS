-- ============================================================================
-- The ANTS — Migration 2: Curriculum & Review
-- Curriculum hierarchy, user tracking, resources, and editor submissions.
-- ============================================================================

-- 1. CURRICULUM HIERARCHY

CREATE TABLE IF NOT EXISTS public.curriculums (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT NOT NULL,
    description   TEXT,
    qualification TEXT,
    exam_board    TEXT,
    created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status        TEXT DEFAULT 'draft',
    is_public     BOOLEAN DEFAULT false,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at_curriculums ON public.curriculums;
CREATE TRIGGER set_updated_at_curriculums
    BEFORE UPDATE ON public.curriculums
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.subjects (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_id UUID NOT NULL REFERENCES public.curriculums(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    description   TEXT,
    order_no      INT4
);

CREATE TABLE IF NOT EXISTS public.topics (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id  UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    order_no    INT4
);

-- 2. USER CURRICULUM TRACKING

CREATE TABLE IF NOT EXISTS public.user_curriculums (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    curriculum_id   UUID NOT NULL REFERENCES public.curriculums(id) ON DELETE CASCADE,
    subject_id      UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.topic_progress (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id          UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    confidence_level  INT4,
    status            TEXT DEFAULT 'not_started',
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RESOURCES & CONTRIBUTOR SUBMISSIONS

CREATE TABLE IF NOT EXISTS public.resources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_id   UUID REFERENCES public.curriculums(id) ON DELETE SET NULL,
    contributor_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title           TEXT NOT NULL,
    content         TEXT,
    resource_type   TEXT,
    status          TEXT DEFAULT 'draft',
    is_public       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at_resources ON public.resources;
CREATE TRIGGER set_updated_at_resources
    BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.editor_submissions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_type   TEXT,
    entity_id         UUID,
    status            TEXT DEFAULT 'pending',
    reviewer_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    feedback          TEXT,
    submitted_at      TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at       TIMESTAMPTZ
);
