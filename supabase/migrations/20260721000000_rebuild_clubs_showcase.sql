-- ============================================================================
-- The ANTS — Migration: Rebuild Clubs as Showcase Libraries
-- Full redesign: clubs become showcase pages for student projects, progress,
-- and announcements. Multiple leaders per club. Customizable public pages
-- with reorderable sections (About, Projects, Members, Announcements).
-- ============================================================================

-- 1. Rename old club tables to _legacy (safety net)
ALTER TABLE IF EXISTS public.club_member_contributions RENAME TO club_member_contributions_legacy;
ALTER TABLE IF EXISTS public.club_milestones RENAME TO club_milestones_legacy;
ALTER TABLE IF EXISTS public.club_events RENAME TO club_events_legacy;
ALTER TABLE IF EXISTS public.club_messages RENAME TO club_messages_legacy;
ALTER TABLE IF EXISTS public.club_links RENAME TO club_links_legacy;
ALTER TABLE IF EXISTS public.club_join_requests RENAME TO club_join_requests_legacy;
ALTER TABLE IF EXISTS public.club_announcements RENAME TO club_announcements_legacy;
ALTER TABLE IF EXISTS public.club_projects RENAME TO club_projects_legacy;
ALTER TABLE IF EXISTS public.club_subjects RENAME TO club_subjects_legacy;
ALTER TABLE IF EXISTS public.club_curriculums RENAME TO club_curriculums_legacy;
ALTER TABLE IF EXISTS public.club_members RENAME TO club_members_legacy;
ALTER TABLE IF EXISTS public.clubs RENAME TO clubs_legacy;

-- 2. Revoke old RLS to avoid conflicts
ALTER TABLE IF EXISTS public.club_member_contributions_legacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_milestones_legacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_events_legacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_messages_legacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_links_legacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_join_requests_legacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_announcements_legacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_projects_legacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_subjects_legacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_curriculums_legacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_members_legacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clubs_legacy DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- 3. Clubs — the core showcase entity
CREATE TABLE IF NOT EXISTS public.clubs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT,
    tagline         TEXT,
    cover_image_url TEXT,
    accent_color    TEXT DEFAULT '#6366f1',
    custom_slug     TEXT UNIQUE,
    field           TEXT NOT NULL DEFAULT 'other',
    created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Club sections — configurable public page sections
CREATE TABLE IF NOT EXISTS public.club_sections (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id        UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    section_key    TEXT NOT NULL CHECK (section_key IN ('about', 'projects', 'members', 'announcements')),
    visible        BOOLEAN DEFAULT true,
    order_no       INT4 NOT NULL DEFAULT 0,
    title_override TEXT,
    UNIQUE (club_id, section_key)
);

-- 5. Club leaders — multiple leaders per club
CREATE TABLE IF NOT EXISTS public.club_leaders (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id  UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    UNIQUE (club_id, user_id)
);

-- 6. Club members — simple membership tracking
CREATE TABLE IF NOT EXISTS public.club_members (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id   UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (club_id, user_id)
);

-- 7. Club projects — individual + collaborative student projects
CREATE TABLE IF NOT EXISTS public.club_projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id         UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    cover_image_url TEXT,
    tags            TEXT[] DEFAULT '{}',
    links           JSONB DEFAULT '[]'::jsonb,
    contributors    UUID[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Club announcements
CREATE TABLE IF NOT EXISTS public.club_announcements (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id    UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clubs_custom_slug ON public.clubs(custom_slug);
CREATE INDEX IF NOT EXISTS idx_clubs_field ON public.clubs(field);
CREATE INDEX IF NOT EXISTS idx_club_sections_club_id ON public.club_sections(club_id);
CREATE INDEX IF NOT EXISTS idx_club_leaders_club_id ON public.club_leaders(club_id);
CREATE INDEX IF NOT EXISTS idx_club_leaders_user_id ON public.club_leaders(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_projects_club_id ON public.club_projects(club_id);
CREATE INDEX IF NOT EXISTS idx_club_announcements_club_id ON public.club_announcements(club_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS set_updated_at_clubs ON public.clubs;
CREATE TRIGGER set_updated_at_clubs
    BEFORE UPDATE ON public.clubs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_club_projects ON public.club_projects;
CREATE TRIGGER set_updated_at_club_projects
    BEFORE UPDATE ON public.club_projects
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- DEFAULT SECTIONS (inserted when a club is created)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_default_club_sections()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.club_sections (club_id, section_key, visible, order_no) VALUES
        (NEW.id, 'about', true, 0),
        (NEW.id, 'projects', true, 1),
        (NEW.id, 'members', true, 2),
        (NEW.id, 'announcements', true, 3);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_club_created_create_sections ON public.clubs;
CREATE TRIGGER on_club_created_create_sections
    AFTER INSERT ON public.clubs
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_club_sections();

-- ============================================================================
-- AUTO-LEADER on club creation
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_creator_as_leader()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.club_leaders (club_id, user_id) VALUES (NEW.id, NEW.created_by);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_club_created_add_leader ON public.clubs;
CREATE TRIGGER on_club_created_add_leader
    AFTER INSERT ON public.clubs
    FOR EACH ROW
    EXECUTE FUNCTION public.add_creator_as_leader();

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_announcements ENABLE ROW LEVEL SECURITY;

-- Clubs: anyone can read; only creators/leaders can update; authenticated can create
DROP POLICY IF EXISTS "clubs_select_public" ON public.clubs;
CREATE POLICY "clubs_select_public" ON public.clubs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "clubs_insert_auth" ON public.clubs;
CREATE POLICY "clubs_insert_auth" ON public.clubs
    FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "clubs_update_leaders" ON public.clubs;
CREATE POLICY "clubs_update_leaders" ON public.clubs
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM public.club_leaders WHERE club_id = id
        )
    );

DROP POLICY IF EXISTS "clubs_delete_leaders" ON public.clubs;
CREATE POLICY "clubs_delete_leaders" ON public.clubs
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM public.club_leaders WHERE club_id = id
        )
    );

-- Club sections: anyone can read; only leaders can update
DROP POLICY IF EXISTS "club_sections_select_public" ON public.club_sections;
CREATE POLICY "club_sections_select_public" ON public.club_sections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "club_sections_update_leaders" ON public.club_sections;
CREATE POLICY "club_sections_update_leaders" ON public.club_sections
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM public.club_leaders WHERE club_id = club_id)
    );

DROP POLICY IF EXISTS "club_sections_insert_leaders" ON public.club_sections;
CREATE POLICY "club_sections_insert_leaders" ON public.club_sections
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM public.club_leaders WHERE club_id = club_id)
    );

-- Club leaders: anyone can read; only existing leaders can modify
DROP POLICY IF EXISTS "club_leaders_select_public" ON public.club_leaders;
CREATE POLICY "club_leaders_select_public" ON public.club_leaders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "club_leaders_insert_leaders" ON public.club_leaders;
CREATE POLICY "club_leaders_insert_leaders" ON public.club_leaders
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM public.club_leaders WHERE club_id = club_id)
    );

DROP POLICY IF EXISTS "club_leaders_delete_leaders" ON public.club_leaders;
CREATE POLICY "club_leaders_delete_leaders" ON public.club_leaders
    FOR DELETE USING (
        auth.uid() IN (SELECT user_id FROM public.club_leaders WHERE club_id = club_id)
    );

-- Club members: anyone can read; authenticated can insert/delete own
DROP POLICY IF EXISTS "club_members_select_public" ON public.club_members;
CREATE POLICY "club_members_select_public" ON public.club_members
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "club_members_insert_self" ON public.club_members;
CREATE POLICY "club_members_insert_self" ON public.club_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "club_members_delete_self" ON public.club_members;
CREATE POLICY "club_members_delete_self" ON public.club_members
    FOR DELETE USING (auth.uid() = user_id);

-- Club projects: anyone can read basic info; authenticated members can create/update
DROP POLICY IF EXISTS "club_projects_select_public" ON public.club_projects;
CREATE POLICY "club_projects_select_public" ON public.club_projects
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "club_projects_insert_members" ON public.club_projects;
CREATE POLICY "club_projects_insert_members" ON public.club_projects
    FOR INSERT WITH CHECK (
        auth.uid() = created_by
        AND auth.uid() IN (SELECT user_id FROM public.club_members WHERE club_id = club_id)
    );

DROP POLICY IF EXISTS "club_projects_update_owner" ON public.club_projects;
CREATE POLICY "club_projects_update_owner" ON public.club_projects
    FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "club_projects_delete_owner" ON public.club_projects;
CREATE POLICY "club_projects_delete_owner" ON public.club_projects
    FOR DELETE USING (auth.uid() = created_by);

-- Club announcements: anyone can read; leaders can create/update/delete
DROP POLICY IF EXISTS "club_announcements_select_public" ON public.club_announcements;
CREATE POLICY "club_announcements_select_public" ON public.club_announcements
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "club_announcements_insert_leaders" ON public.club_announcements;
CREATE POLICY "club_announcements_insert_leaders" ON public.club_announcements
    FOR INSERT WITH CHECK (
        auth.uid() = created_by
        AND auth.uid() IN (SELECT user_id FROM public.club_leaders WHERE club_id = club_id)
    );

DROP POLICY IF EXISTS "club_announcements_update_leaders" ON public.club_announcements;
CREATE POLICY "club_announcements_update_leaders" ON public.club_announcements
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM public.club_leaders WHERE club_id = club_id)
    );

DROP POLICY IF EXISTS "club_announcements_delete_leaders" ON public.club_announcements;
CREATE POLICY "club_announcements_delete_leaders" ON public.club_announcements
    FOR DELETE USING (
        auth.uid() IN (SELECT user_id FROM public.club_leaders WHERE club_id = club_id)
    );
