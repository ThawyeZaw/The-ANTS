-- ============================================================================
-- The ANTS — Migration 8: Notes & Role Upgrade
-- Notes, saved notes, review queue, version history, and role upgrade requests.
-- ============================================================================

-- Review queue for content submission approvals
CREATE TABLE IF NOT EXISTS public.review_queue (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_type       TEXT NOT NULL,
    entity_id             UUID NOT NULL,
    submitted_data        JSONB NOT NULL,
    is_update             BOOLEAN DEFAULT false,
    published_entity_id   UUID,
    status                TEXT DEFAULT 'pending',
    reviewer_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    feedback              JSONB,
    submitted_at          TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at           TIMESTAMPTZ
);

-- Version history for audit trails
CREATE TABLE IF NOT EXISTS public.version_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    version_number  INT4 NOT NULL,
    changes         JSONB NOT NULL DEFAULT '[]'::jsonb,
    changed_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    review_item_id  UUID,
    changed_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Role upgrade requests
CREATE TABLE IF NOT EXISTS public.role_upgrade_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    "current_role"  user_role NOT NULL,
    requested_role  user_role NOT NULL,
    reason          TEXT,
    status          TEXT DEFAULT 'pending',
    reviewer_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ
);

-- Notes (rich text blocks)
CREATE TABLE IF NOT EXISTS public.notes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title             TEXT NOT NULL,
    summary           TEXT,
    curriculum_id     UUID REFERENCES public.curriculums(id) ON DELETE SET NULL,
    subject_id        UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_id          UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    syllabus_point    TEXT,
    is_syllabus_based BOOLEAN DEFAULT false,
    tags              TEXT[],
    blocks            JSONB NOT NULL DEFAULT '[]'::jsonb,
    contributor_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status            TEXT DEFAULT 'draft',
    visibility        TEXT DEFAULT 'private',
    reviewer_feedback TEXT,
    reviewer_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at_notes ON public.notes;
CREATE TRIGGER set_updated_at_notes
    BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- User saved notes (bookmarks)
CREATE TABLE IF NOT EXISTS public.user_saved_notes (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note_id   UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    saved_at  TIMESTAMPTZ DEFAULT NOW()
);
