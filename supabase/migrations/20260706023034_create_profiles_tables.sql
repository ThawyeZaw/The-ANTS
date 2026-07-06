-- ============================================================================
-- The ANTS — Migration 1: Auth & Profiles
-- Creates enums, utility functions, profiles tables, and certifications.
-- ============================================================================

-- GUARD: Ensure user_role enum exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'teacher', 'contributor', 'main_contributor');
    END IF;
END $$;

-- GUARD: Ensure evaluation_status enum exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evaluation_status') THEN
        CREATE TYPE evaluation_status AS ENUM ('draft', 'pending_review', 'approved', 'revision_requested');
    END IF;
END $$;

-- 1. UTILITY: updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. CORE TABLES: User Profiles & Extensions

-- 2.1 profiles (base user profile)
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT UNIQUE,
    name            TEXT,
    username        TEXT UNIQUE,
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    role            user_role DEFAULT 'student'::user_role,
    is_public       BOOLEAN DEFAULT true,
    bio             TEXT,
    title           TEXT,
    social_links    JSONB,
    projects        JSONB,
    activities      JSONB,
    achievements    JSONB,
    pinned_item_id          TEXT,
    section_visibility      JSONB,
    custom_url_slug         TEXT UNIQUE,
    show_club_memberships   BOOLEAN DEFAULT true,
    show_club_projects      BOOLEAN DEFAULT true,
    show_club_activity      BOOLEAN DEFAULT true,
    certification_ids       UUID[]
);
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.2 student_profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id                    UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_exam_year      INT4,
    study_goals_metadata  JSONB
);

-- 2.3 teacher_profiles
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
    id                  UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    institution_name    TEXT,
    is_verified_teacher BOOLEAN DEFAULT false
);

-- 2.4 contributor_profiles
CREATE TABLE IF NOT EXISTS public.contributor_profiles (
    id                            UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    title                         TEXT,
    bio                           TEXT,
    website                       TEXT,
    facebook_url                  TEXT,
    linkedin                      TEXT,
    github                        TEXT,
    verification_documents_url    TEXT,
    specialisations               TEXT[],
    qualifications                TEXT[],
    published_notes_count         INT4 DEFAULT 0,
    published_curriculums_count   INT4 DEFAULT 0,
    availability                  TEXT
);

-- 3. CERTIFICATIONS
CREATE TABLE IF NOT EXISTS public.certifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,
    subject         TEXT,
    exam_board      TEXT,
    grade           TEXT,
    year            INT4,
    certificate_url TEXT,
    is_verified     BOOLEAN DEFAULT false,
    verified_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_hidden       BOOLEAN DEFAULT false,
    order_no        INT4,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
