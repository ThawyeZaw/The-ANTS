-- ============================================================================
-- The ANTS — Migration 5: Study Tools
-- Timetable events and pomodoro sessions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.timetable_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    event_type      TEXT,
    subject         TEXT,
    location        TEXT,
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    all_day         BOOLEAN DEFAULT false,
    is_recurring    BOOLEAN DEFAULT false,
    recurrence_rule JSONB,
    color_code      TEXT,
    is_todo         BOOLEAN DEFAULT false,
    is_completed    BOOLEAN DEFAULT false,
    completed_at    TIMESTAMPTZ,
    event_source    TEXT DEFAULT 'user',
    source_id       TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    duration_minutes  INT4,
    task_name         TEXT,
    category          TEXT,
    completed_at      TIMESTAMPTZ DEFAULT NOW()
);
