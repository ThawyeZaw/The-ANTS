-- ============================================================================
-- The ANTS — Migration: Copy Legacy Club Data into New Showcase Tables
-- ============================================================================

-- 1. Migrate clubs from legacy table
-- Field defaults to 'other' and accent_color to '#6366f1' since those
-- columns didn't exist in the old schema.
INSERT INTO public.clubs (id, name, description, tagline, cover_image_url, accent_color, custom_slug, field, created_by, created_at)
SELECT
    id,
    name,
    description,
    tagline,
    cover_image_url,
    '#6366f1'::text            AS accent_color,
    custom_domain_slug          AS custom_slug,
    'other'::text               AS field,
    created_by,
    created_at
FROM public.clubs_legacy
ON CONFLICT (id) DO NOTHING;

-- NOTE: The triggers on clubs (on_club_created_create_sections and
-- on_club_created_add_leader) fire automatically for each inserted row,
-- creating 4 default club_sections and adding the creator as a leader.

-- 2. Migrate leaders (admins & moderators from the legacy members table)
-- The trigger already added the creator as a leader. Here we add any
-- additional admins and all moderators.
INSERT INTO public.club_leaders (club_id, user_id)
SELECT DISTINCT club_id, user_id
FROM public.club_members_legacy
WHERE role IN ('admin', 'moderator')
ON CONFLICT (club_id, user_id) DO NOTHING;

-- 3. Migrate regular members
INSERT INTO public.club_members (club_id, user_id, joined_at)
SELECT club_id, user_id, joined_at
FROM public.club_members_legacy
WHERE role = 'member'
ON CONFLICT (club_id, user_id) DO NOTHING;

-- 4. Migrate projects
INSERT INTO public.club_projects (id, club_id, created_by, title, description, cover_image_url, tags, links, contributors, created_at, updated_at)
SELECT
    id,
    club_id,
    created_by,
    title,
    description,
    COALESCE(cover_image_url, image_urls[1]) AS cover_image_url,
    COALESCE(tags, '{}'::text[])             AS tags,
    COALESCE(links, '[]'::jsonb)             AS links,
    COALESCE(contributors, '{}'::uuid[])     AS contributors,
    created_at,
    COALESCE(updated_at, created_at)         AS updated_at
FROM public.club_projects_legacy
ON CONFLICT (id) DO NOTHING;

-- 5. Migrate announcements
-- Priority: content column, then markdown_content, then title as fallback.
INSERT INTO public.club_announcements (id, club_id, created_by, title, content, created_at)
SELECT
    id,
    club_id,
    created_by,
    title,
    COALESCE(NULLIF(content, ''), markdown_content, '') AS content,
    created_at
FROM public.club_announcements_legacy
ON CONFLICT (id) DO NOTHING;
