-- Migration 0003: Drop legacy resource system (notes, flashcards, quizzes,
-- curriculum resources) and retired classroom tables from Neon.
-- Content is being replaced by an external Notion pipeline — not migrated.

-- ── Standalone / live quizzes (migration 0001) ──────────────────────────────
DROP TABLE IF EXISTS "quiz_live_participants" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "quiz_live_sessions" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "standalone_quizzes" CASCADE;
--> statement-breakpoint

-- ── Flashcards / SRS ────────────────────────────────────────────────────────
DROP TABLE IF EXISTS "card_reviews" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "cards" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "decks" CASCADE;
--> statement-breakpoint

-- ── Notes ───────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS "user_saved_notes" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "user_notes" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "notes" CASCADE;
--> statement-breakpoint

-- ── Curriculum topic resources ──────────────────────────────────────────────
DROP TABLE IF EXISTS "resources" CASCADE;
--> statement-breakpoint
ALTER TABLE "topics" DROP COLUMN IF EXISTS "resources_count";
--> statement-breakpoint

-- ── Soft-linked contribution rows for notes/decks ───────────────────────────
DELETE FROM "review_queue"
WHERE "submission_type" IN ('note', 'deck', 'flashcard_deck', 'question');
--> statement-breakpoint
DELETE FROM "editor_submissions"
WHERE "entity_type" IN ('note', 'deck', 'flashcard_deck');
--> statement-breakpoint
DELETE FROM "version_history"
WHERE "entity_type" IN ('note', 'deck', 'flashcard_deck', 'user_note');
--> statement-breakpoint
DELETE FROM "activity_feed"
WHERE "entity_type" IN ('note', 'deck', 'flashcard_deck', 'user_note', 'quiz', 'card');
--> statement-breakpoint

-- ── Legacy classroom era (migration 0000; not in current Drizzle TS schema) ─
-- Assignments / discussions are classroom-scoped and must drop with classrooms.
DROP TABLE IF EXISTS "assignment_submissions" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "assignments" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "discussion_replies" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "discussion_topics" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "quiz_attempts" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "quizzes" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "classroom_resources" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "classroom_curriculums" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "classroom_members" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "classrooms" CASCADE;
