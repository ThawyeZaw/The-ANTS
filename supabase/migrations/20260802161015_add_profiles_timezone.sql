-- ============================================================================
-- The ANTs — Migration: profiles.timezone
--
-- Adds the IANA timezone column to `profiles`.
--
-- Why: the app treats `profiles.timezone` as the canonical per-user timezone —
-- the settings page, onboarding wizard, AuthContext, profile cards, and the
-- Telegram notification enqueue/processor all read/write it. However, the
-- column was never created in the database (the old onboarding migration only
-- added `timezone` to student_profiles/teacher_profiles). As a result the
-- notification enqueue's profile SELECT failed (unknown column), silently
-- skipping every reminder, and saving a timezone in Settings silently did
-- nothing.
--
-- Adding it is safe and non-destructive. NULL means "use the app default
-- (Asia/Yangon)" — the app already falls back with `?? 'Asia/Yangon'`, so no
-- backfill is required.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT;
