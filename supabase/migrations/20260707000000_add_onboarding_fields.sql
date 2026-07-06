-- ============================================================================
-- The ANTS — Migration: Add Onboarding Fields
-- Adds onboarding_completed flag to profiles.
-- Extends student_profiles and teacher_profiles with onboarding data.
-- ============================================================================

-- 1. Add onboarding_completed to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 2. Extend student_profiles with onboarding fields
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS preferred_name      TEXT,
  ADD COLUMN IF NOT EXISTS timezone            TEXT,
  ADD COLUMN IF NOT EXISTS institution_name    TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_data     JSONB DEFAULT '[]'::jsonb;
-- onboarding_data shape (array of curriculum selections):
-- [
--   {
--     "curriculumType": "igcse_cambridge",
--     "subjectIds": ["uuid1", "uuid2"],
--     "subjectNames": ["Chemistry 0620", "Mathematics 0580"],
--     "examSeries": "may_june",
--     "examYear": 2026
--   }
-- ]

-- 3. Extend teacher_profiles with onboarding fields
ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS preferred_name      TEXT,
  ADD COLUMN IF NOT EXISTS timezone            TEXT,
  ADD COLUMN IF NOT EXISTS institution_name    TEXT;

-- 4. Ensure the handle_new_user trigger creates a student_profiles row too
-- (in case it only creates the profiles row — insert with ON CONFLICT DO NOTHING)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create base profile
  INSERT INTO public.profiles (id, email, name, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default student_profiles row
  INSERT INTO public.student_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
