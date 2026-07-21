-- ──────────────────────────────────────────────────────────────────────────────
-- The ANTs — Personal Notes (user_notes)
-- Students (any role) can author private notes. Strictly owner-only via RLS.
-- Run this in the Supabase Dashboard → SQL Editor if not using the CLI.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id        UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  subject_id      UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  curriculum_id   UUID REFERENCES public.curriculums(id) ON DELETE SET NULL,
  title           TEXT NOT NULL DEFAULT 'Untitled Note',
  content         TEXT,                                 -- plain text / markdown
  blocks          JSONB NOT NULL DEFAULT '[]'::jsonb,   -- rich block editor (NoteBlock[])
  tags            TEXT[] DEFAULT '{}',
  color           TEXT,                                 -- optional highlight colour for card UI
  is_pinned       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at trigger (reuses shared set_updated_at() from profiles migration)
DROP TRIGGER IF EXISTS set_updated_at_user_notes ON public.user_notes;
CREATE TRIGGER set_updated_at_user_notes
  BEFORE UPDATE ON public.user_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: strict owner-only. Personal notes must NEVER be publicly readable.
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_notes_owner_all ON public.user_notes;
CREATE POLICY user_notes_owner_all ON public.user_notes
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Data API grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notes TO authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS user_notes_user_id_idx        ON public.user_notes(user_id);
CREATE INDEX IF NOT EXISTS user_notes_topic_id_idx       ON public.user_notes(topic_id);
CREATE INDEX IF NOT EXISTS user_notes_curriculum_id_idx  ON public.user_notes(curriculum_id);
