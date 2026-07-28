-- ──────────────────────────────────────────────────────────────────────────────
-- The ANTS — Standalone Quiz Feature Tables
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. quizzes_standalone — Main quiz table (independent from classrooms)
CREATE TABLE IF NOT EXISTS quizzes_standalone (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  curriculum_id TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  time_limit_minutes INTEGER,
  share_code TEXT UNIQUE,
  review_status TEXT DEFAULT 'pending_review' CHECK (review_status IN ('pending_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. quiz_sessions — Live hosting sessions (Kahoot-style)
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes_standalone(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  join_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  current_question_index INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. quiz_session_participants — Participants in live sessions
CREATE TABLE IF NOT EXISTS quiz_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- 4. quiz_attempts_standalone — Async quiz attempts (for "take anytime" mode)
CREATE TABLE IF NOT EXISTS quiz_attempts_standalone (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes_standalone(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER,
  total_points INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  UNIQUE(quiz_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_standalone_created_by ON quizzes_standalone(created_by);
CREATE INDEX IF NOT EXISTS idx_quizzes_standalone_status ON quizzes_standalone(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_standalone_review_status ON quizzes_standalone(review_status);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_quiz_id ON quiz_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_join_code ON quiz_sessions(join_code);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_session_participants_session_id ON quiz_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_standalone_quiz_id ON quiz_attempts_standalone(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_standalone_user_id ON quiz_attempts_standalone(user_id);

-- Enable Row Level Security
ALTER TABLE quizzes_standalone ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts_standalone ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes_standalone
CREATE POLICY "Users can view public quizzes"
  ON quizzes_standalone FOR SELECT
  USING (is_public = true OR status = 'published');

CREATE POLICY "Users can view own quizzes"
  ON quizzes_standalone FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create quizzes"
  ON quizzes_standalone FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own quizzes"
  ON quizzes_standalone FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own quizzes"
  ON quizzes_standalone FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for quiz_sessions
CREATE POLICY "Anyone can view active sessions"
  ON quiz_sessions FOR SELECT
  USING (status IN ('waiting', 'active') OR host_id = auth.uid());

CREATE POLICY "Hosts can create sessions"
  ON quiz_sessions FOR INSERT
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update own sessions"
  ON quiz_sessions FOR UPDATE
  USING (host_id = auth.uid());

CREATE POLICY "Hosts can delete own sessions"
  ON quiz_sessions FOR DELETE
  USING (host_id = auth.uid());

-- RLS Policies for quiz_session_participants
CREATE POLICY "Participants can view their session"
  ON quiz_session_participants FOR SELECT
  USING (user_id = auth.uid() OR session_id IN (
    SELECT id FROM quiz_sessions WHERE host_id = auth.uid()
  ));

CREATE POLICY "Anyone can join a session"
  ON quiz_session_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Participants can update own answers"
  ON quiz_session_participants FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for quiz_attempts_standalone
CREATE POLICY "Users can view own attempts"
  ON quiz_attempts_standalone FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own attempts"
  ON quiz_attempts_standalone FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attempts"
  ON quiz_attempts_standalone FOR UPDATE
  USING (user_id = auth.uid());

-- Enable Realtime for live session tables
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_session_participants;
