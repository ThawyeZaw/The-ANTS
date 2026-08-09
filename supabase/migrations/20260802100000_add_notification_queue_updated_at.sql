-- ============================================================================
-- The ANTs — Migration: notification_queue.updated_at
--
-- Adds a mutable updated_at column so queue processors can recover rows stuck
-- in 'processing' (e.g. after a crash or server restart) by resetting them
-- back to 'pending' once they have been processing for longer than 10 minutes.
--
-- The application sets updated_at on every status transition (claim, sent,
-- failed, recovery); no trigger is required. The DEFAULT now() keeps existing
-- rows safe — old rows that were already stuck in 'processing' before this
-- migration will have an old updated_at and be recovered on the first run
-- after deploy, which is the desired behaviour.
-- ============================================================================

-- 1. Add the mutable updated_at column
ALTER TABLE public.notification_queue
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Index: fast lookup of stale 'processing' rows for crash recovery
CREATE INDEX IF NOT EXISTS idx_notification_queue_processing_updated
    ON public.notification_queue (status, updated_at)
    WHERE status = 'processing';
