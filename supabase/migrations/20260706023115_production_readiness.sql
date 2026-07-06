-- ──────────────────────────────────────────────────────────────────────────────
-- Phase 10: Connection Pooling & Production Readiness
-- ──────────────────────────────────────────────────────────────────────────────
-- These settings configure the database for production use with connection
-- pooling enabled. They apply to both local and remote (linked) databases.

-- 1. Statement timeout — prevent runaway queries from blocking connections
--    30 seconds is a good default for a web app. Adjust based on your workload.
ALTER DATABASE postgres SET statement_timeout = '30s';

-- 2. Idle in transaction timeout — prevent idle transactions from holding
--    connections in the pool. Critical for transaction-mode pooling.
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '60s';

-- 3. Lock timeout — prevent queries from waiting indefinitely for locks.
ALTER DATABASE postgres SET lock_timeout = '10s';

-- 4. Ensure pg_stat_statements is enabled for query performance monitoring
--    (already enabled by default on Supabase, but document the check)
--    Verify with: SELECT * FROM pg_available_extensions WHERE name = 'pg_stat_statements';
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 5. Log slow queries for monitoring
--    ALTER DATABASE on log_min_duration_statement requires superuser, which is not available
--    on remote Supabase. Instead, set it per-role (supported via supautils extension):
--    Run on remote: ALTER ROLE postgres SET log_min_duration_statement = '5000';

-- ── Notes for remote (linked) database ────────────────────────────────────────
-- The ALTER DATABASE statements above apply to the local dev database.
-- For the remote Supabase project (gbyydvlquahfmgerlpfx):
--   - statement_timeout: Dashboard → Database → Settings → Statement Timeout
--   - Connection pooler: Dashboard → Database → Pooling → Enable
--     - Mode: Transaction
--     - Pool size: 15
--   - Monitoring: Dashboard → Reports → Database
--     - Set up alerts for pool utilization > 80%
-- ──────────────────────────────────────────────────────────────────────────────
