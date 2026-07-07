-- ============================================================================
-- The ANTS — Migration: Role Upgrade RLS Policies
-- Adds RLS policies on role_upgrade_requests so users can manage their own
-- requests. The main-contributor approve/reject path uses service_role which
-- bypasses RLS, so no extra policies are needed for that path.
-- ============================================================================

-- ── role_upgrade_requests ────────────────────────────────────────────────────

-- Users can insert their own upgrade requests
DROP POLICY IF EXISTS role_upgrade_requests_user_insert ON public.role_upgrade_requests;
CREATE POLICY role_upgrade_requests_user_insert
  ON public.role_upgrade_requests
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can read their own requests (to check pending/approved status)
DROP POLICY IF EXISTS role_upgrade_requests_user_select ON public.role_upgrade_requests;
CREATE POLICY role_upgrade_requests_user_select
  ON public.role_upgrade_requests
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Note: The main contributor dashboard fetches ALL profiles and ALL upgrade
-- requests via createAdminClient() (service_role key), which bypasses RLS.
-- No additional policies are needed for those reads.

