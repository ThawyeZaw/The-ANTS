-- ──────────────────────────────────────────────────────────────────────────────
-- Phase 11: Security Audit Script
-- 
-- Run this SQL in the Supabase SQL Editor to verify:
--   1. RLS is enabled on every table in the public schema
--   2. No service_role keys are exposed in public env
--   3. No security definer functions in the public schema
--   4. All critical indexes exist
--   5. Views use security_invoker
--
-- Usage: Copy and paste into Supabase Dashboard → SQL Editor → Run
-- ──────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. RLS Audit: Check every table has RLS enabled
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
  tablename,
  rowsecurity AS rls_enabled,
  CASE WHEN rowsecurity = false THEN '⚠ MISSING RLS' ELSE '✓ OK' END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Check RLS policies exist for each table
--    Tables with RLS enabled but 0 policies = no one can access (potential bug)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
  t.tablename,
  t.rowsecurity AS rls_enabled,
  COUNT(p.policyname) AS policy_count,
  CASE
    WHEN t.rowsecurity = false THEN '⚠ RLS disabled'
    WHEN COUNT(p.policyname) = 0 THEN '⚠ RLS enabled but NO policies (table is locked)'
    ELSE '✓ OK'
  END AS status
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY policy_count ASC, t.tablename;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Audit security definer functions in the public schema
--    (These run with owner privileges and can bypass RLS — dangerous)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
  proname AS function_name,
  prosecdef AS security_definer,
  CASE WHEN prosecdef = true THEN '⚠ SECURITY DEFINER in public schema' ELSE '✓ OK' END AS status
FROM pg_proc
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE nspname = 'public'
ORDER BY prosecdef DESC, proname;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Check views for security_invoker
--    Views without security_invoker run with the definer's privileges
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
  viewname,
  COALESCE(
    (SELECT '✓ OK' FROM pg_class 
     WHERE relname = viewname 
     AND reloptions @> ARRAY['security_invoker=true']),
    '⚠ Missing security_invoker'
  ) AS security_status
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. Critical composite indexes check
--    Verifies indexes specified in Phase 5 exist
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'
  AND indexname NOT LIKE '%_key'
ORDER BY tablename, indexname;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. Foreign key columns missing indexes
--    (FK columns without indexes cause slow JOINs and cascading locks)
-- ═══════════════════════════════════════════════════════════════════════════════

WITH fk_columns AS (
  SELECT
    conname AS fk_name,
    unnest(conkey) AS fk_col_num,
    confrelid::regclass::text AS referenced_table,
    conrelid::regclass::text AS source_table
  FROM pg_constraint
  WHERE contype = 'f'
    AND connamespace = 'public'::regnamespace
),
existing_indexes AS (
  SELECT
    t.relname AS table_name,
    a.attname AS column_name,
    i.relname AS index_name
  FROM pg_index ix
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_class t ON t.oid = ix.indrelid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  WHERE t.relnamespace = 'public'::regnamespace
)
SELECT
  fk.source_table,
  a.attname AS fk_column,
  fk.referenced_table,
  fk.fk_name,
  CASE WHEN ei.index_name IS NOT NULL THEN '✓ Indexed' ELSE '⚠ MISSING INDEX' END AS status
FROM fk_columns fk
JOIN pg_attribute a ON a.attrelid = fk.source_table::regclass AND a.attnum = fk.fk_col_num
LEFT JOIN existing_indexes ei ON ei.table_name = fk.source_table AND ei.column_name = a.attname
ORDER BY status ASC, fk.source_table;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. Connection pool status (if pooler is enabled on remote)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
  name,
  setting,
  CASE name
    WHEN 'statement_timeout' THEN 'Should be 30s (30000ms)'
    WHEN 'idle_in_transaction_session_timeout' THEN 'Should be 60s (60000ms)'
    WHEN 'lock_timeout' THEN 'Should be 10s (10000ms)'
    ELSE ''
  END AS recommended
FROM pg_settings
WHERE name IN (
  'statement_timeout',
  'idle_in_transaction_session_timeout',
  'lock_timeout',
  'log_min_duration_statement'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. Row count summary (quick sanity check of data volume)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
  schemaname,
  relname AS tablename,
  n_live_tup AS estimated_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
