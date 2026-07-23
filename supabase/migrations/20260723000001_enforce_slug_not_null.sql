-- ============================================================================
-- The ANTS — Enforce slug NOT NULL
-- All clubs must have a unique custom_slug. Run after backfill migration.
-- ============================================================================

ALTER TABLE public.clubs ALTER COLUMN custom_slug SET NOT NULL;
