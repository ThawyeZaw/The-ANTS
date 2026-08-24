-- Migration 0001: Community persistence (standalone quizzes, live sessions,
-- org mission/team/timeline) + profile onboarding columns.
-- All statements are additive and safe to re-run.

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "onboarding_completed" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "preferred_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "institution_name" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "standalone_quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"is_public" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"share_code" text UNIQUE,
	"curriculum_id" uuid,
	"difficulty" text,
	"time_limit_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_live_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"host_id" uuid,
	"join_code" text UNIQUE NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"current_question_index" integer DEFAULT -1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_live_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid,
	"display_name" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_mission" (
	"id" text PRIMARY KEY DEFAULT 'org-mission',
	"content" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"bio" text,
	"photo_url" text,
	"linked_profile_username" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_alumni" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_timeline_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date_label" text NOT NULL,
	"category" text,
	"image_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"location" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"show_on_timeline" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "standalone_quizzes" ADD CONSTRAINT "standalone_quizzes_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "quiz_live_sessions" ADD CONSTRAINT "quiz_live_sessions_quiz_id_standalone_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."standalone_quizzes"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "quiz_live_sessions" ADD CONSTRAINT "quiz_live_sessions_host_id_profiles_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "quiz_live_participants" ADD CONSTRAINT "quiz_live_participants_session_id_quiz_live_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_live_sessions"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "quiz_live_participants" ADD CONSTRAINT "quiz_live_participants_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; WHEN duplicate_table THEN null; END $$;
