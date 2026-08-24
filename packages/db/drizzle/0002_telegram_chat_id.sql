-- Migration 0002: Telegram chat linkage + notification preferences on profiles.
-- The webhook previously stored chat IDs only inside
-- notification_preferences.channels, which the enqueue pipeline never reads.
-- Idempotent — safe to re-run.

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "telegram_chat_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "notification_preferences" jsonb;
