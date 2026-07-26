-- ============================================================================
-- The ANTs — Migration: Notification Preferences & Reminder Offsets
-- Adds per-user notification toggles and per-event reminder offsets.
-- ============================================================================

-- 1. Add notification_preferences JSONB to profiles
--    Default: timetable enabled (15 min before), everything else off.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS notification_preferences JSONB
    DEFAULT '{
      "timetable": {"enabled": true, "reminders": [15]},
      "assignments": {"enabled": false, "reminders": [60, 1440, 4320, 10080]},
      "exams": {"enabled": false, "reminders": [1440, 10080, 43200]},
      "quizzes": {"enabled": false, "reminders": [60, 1440]}
    }'::jsonb;

-- 2. Add reminder_minutes to timetable_events
--    NULL = use the event's start_time directly (no offset).
--    Positive value = send notification N minutes BEFORE start_time.
ALTER TABLE public.timetable_events
    ADD COLUMN IF NOT EXISTS reminder_minutes INT4;
