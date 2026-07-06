-- ============================================================================
-- The ANTS — Migration 4: Clubs
-- Study clubs: members, curriculums, messaging, announcements, links,
-- join requests, projects, events, milestones, and contributions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clubs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    description         TEXT,
    created_by          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    join_mode           TEXT DEFAULT 'open',
    invite_code         TEXT,
    enabled_features    JSONB,
    cover_image_url     TEXT,
    tagline             TEXT,
    custom_domain_slug  TEXT UNIQUE,
    is_showcase         BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_members (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id           UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role              TEXT DEFAULT 'member',
    membership_status TEXT DEFAULT 'active',
    joined_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_curriculums (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id         UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    curriculum_id   UUID NOT NULL REFERENCES public.curriculums(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.club_subjects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id     UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    subject_id  UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.club_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id     UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_announcements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id     UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title       TEXT,
    content     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_links (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id     UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title       TEXT,
    url         TEXT,
    shared_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_join_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id       UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status        TEXT NOT NULL DEFAULT 'pending',
    requested_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id         UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    status          TEXT DEFAULT 'active',
    cover_image_url TEXT,
    links           JSONB,
    contributors    UUID[],
    tags            TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ
);
DROP TRIGGER IF EXISTS set_updated_at_club_projects ON public.club_projects;
CREATE TRIGGER set_updated_at_club_projects
    BEFORE UPDATE ON public.club_projects
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.club_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id     UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    event_date  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_milestones (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id       UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    description   TEXT,
    status        TEXT DEFAULT 'planned',
    target_date   TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ,
    created_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    order_no      INT4
);

CREATE TABLE IF NOT EXISTS public.club_member_contributions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id             UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contribution_type   TEXT NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
