-- ──────────────────────────────────────────────────────────────────────────────
-- The ANTS — Add club join modes & join requests table
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Add join_mode and invite_code columns to clubs
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS join_mode text NOT NULL DEFAULT 'anyone'
    CHECK (join_mode IN ('anyone', 'invite_link', 'approval_based')),
  ADD COLUMN IF NOT EXISTS invite_code text DEFAULT NULL;

-- 2. Create club_join_requests table for approval-based clubs
CREATE TABLE IF NOT EXISTS club_join_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Prevent duplicate pending requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_join_requests_unique_pending
  ON club_join_requests (club_id, user_id) WHERE status = 'pending';

-- 3. Enable RLS on club_join_requests
ALTER TABLE club_join_requests ENABLE ROW LEVEL SECURITY;

-- Club leaders can see all join requests for their club
CREATE POLICY "Leaders can view join requests"
  ON club_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_leaders
      WHERE club_leaders.club_id = club_join_requests.club_id
        AND club_leaders.user_id = auth.uid()
    )
  );

-- Club leaders can update join requests (approve/reject)
CREATE POLICY "Leaders can update join requests"
  ON club_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_leaders
      WHERE club_leaders.club_id = club_join_requests.club_id
        AND club_leaders.user_id = auth.uid()
    )
  );

-- Users can insert their own join requests
CREATE POLICY "Users can create their own join requests"
  ON club_join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own join requests
CREATE POLICY "Users can view their own requests"
  ON club_join_requests FOR SELECT
  USING (auth.uid() = user_id);
