-- Migration 0004: Persist per-user Pomodoro timer preferences.
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS "pomodoro_user_settings" (
  "user_id" uuid PRIMARY KEY NOT NULL,
  "settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "pomodoro_user_settings" ADD CONSTRAINT "pomodoro_user_settings_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
