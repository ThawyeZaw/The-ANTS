-- ============================================================================
-- The ANTS — Migration: Telegram Notification System
-- Adds telegram_chat_id to profiles and notified flag to timetable_events.
-- ============================================================================

-- 1. Add telegram_chat_id to profiles (for linking Telegram accounts)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT UNIQUE;

-- 2. Add notified flag to timetable_events (for tracking sent notifications)
ALTER TABLE public.timetable_events
    ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;

-- 3. Index for the cron job query: find unnotified events within a time window
CREATE INDEX IF NOT EXISTS idx_timetable_events_notified_start
    ON public.timetable_events (notified, start_time)
    WHERE notified = false;
