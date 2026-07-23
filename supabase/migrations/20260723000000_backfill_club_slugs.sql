-- ============================================================================
-- The ANTS — Backfill club slugs for existing clubs without one
-- Generates a random short slug (e.g., "ab-3x7k") for clubs where custom_slug IS NULL.
-- ============================================================================

DO $$
DECLARE
  club_record RECORD;
  new_slug TEXT;
  slug_exists BOOLEAN;
BEGIN
  FOR club_record IN SELECT id FROM public.clubs WHERE custom_slug IS NULL LOOP
    -- Try up to 20 times to generate a unique slug
    FOR i IN 1..20 LOOP
      new_slug := lower(
        substring(md5(random()::text || clock_timestamp()::text) from 1 for 2)
        || '-'
        || substring(md5(random()::text || clock_timestamp()::text) from 1 for 4)
      );

      SELECT EXISTS(SELECT 1 FROM public.clubs WHERE custom_slug = new_slug) INTO slug_exists;

      IF NOT slug_exists THEN
        UPDATE public.clubs SET custom_slug = new_slug WHERE id = club_record.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;
