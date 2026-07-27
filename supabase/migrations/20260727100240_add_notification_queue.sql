-- ============================================================================
-- The ANTs — Migration: Notification Queue Table
-- Replaces the real-time cron engine with a durable database queue.
-- Notifications are pre-enqueued at event creation time and processed
-- by the process-telegram-queue Edge Function.
-- ============================================================================

-- 1. Create notification_queue table
CREATE TABLE public.notification_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_chat_id TEXT NOT NULL,
    message_text    TEXT NOT NULL,
    scheduled_for   TIMESTAMPTZ NOT NULL DEFAULT now(),
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    retry_count     INT NOT NULL DEFAULT 0,
    error_log       TEXT,
    source_type     TEXT,
    source_id       UUID,
    user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS (defense in depth — only service_role touches this table)
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- 3. Revoke public access — only service_role can access
REVOKE ALL ON public.notification_queue FROM anon, authenticated;

-- 4. Index: fast lookup of pending items ready to send
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending_scheduled
    ON public.notification_queue (status, scheduled_for)
    WHERE status = 'pending';

-- 5. Index: dedup lookups by source
CREATE INDEX IF NOT EXISTS idx_notification_queue_source
    ON public.notification_queue (source_type, source_id, user_id)
    WHERE status IN ('pending', 'processing');

-- 6. Index: telegram_chat_id for analytics / debugging
CREATE INDEX IF NOT EXISTS idx_notification_queue_chat_id
    ON public.notification_queue (telegram_chat_id);
