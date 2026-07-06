// ──────────────────────────────────────────────────────────────────────────────
// Phase 11: Supabase Health Check Utility
//
// Verifies connectivity to Supabase services and checks critical configuration.
// Usage:
//   - Server-side: import { runHealthCheck } from '@/lib/supabase/health'
//   - CLI: npx tsx src/lib/supabase/health.ts
//   - API route: GET /api/health (if you create a route handler)
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from './server'

type HealthStatus = 'ok' | 'error' | 'warning'

interface HealthCheck {
  name: string
  status: HealthStatus
  message: string
  durationMs?: number
}

/**
 * Run all health checks and return results.
 * Call this from a server action, API route, or build script.
 */
export async function runHealthCheck(): Promise<HealthCheck[]> {
  const results: HealthCheck[] = []

  // ── 1. Supabase API connectivity ────────────────────────────────────────────
  const apiStart = Date.now()
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(0)

    if (error) {
      results.push({
        name: 'Supabase API',
        status: 'error',
        message: `API connection failed: ${error.message}`,
        durationMs: Date.now() - apiStart,
      })
    } else {
      results.push({
        name: 'Supabase API',
        status: 'ok',
        message: `Connected. profiles count query succeeded.`,
        durationMs: Date.now() - apiStart,
      })
    }
  } catch (err) {
    results.push({
      name: 'Supabase API',
      status: 'error',
      message: `Connection error: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - apiStart,
    })
  }

  // ── 2. Auth service check ──────────────────────────────────────────────────
  const authStart = Date.now()
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()

    results.push({
      name: 'Auth Service',
      status: 'ok',
      message: `Auth service reachable. Session: ${data.session ? 'active' : 'none (expected if no user logged in)'}`,
      durationMs: Date.now() - authStart,
    })
  } catch (err) {
    results.push({
      name: 'Auth Service',
      status: 'error',
      message: `Auth check failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - authStart,
    })
  }

  // ── 3. Environment variables check ─────────────────────────────────────────
  const envChecks: HealthCheck[] = []

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    envChecks.push({ name: 'Env: NEXT_PUBLIC_SUPABASE_URL', status: 'error', message: 'Missing' })
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    envChecks.push({ name: 'Env: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', status: 'error', message: 'Missing' })
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_xxx')) {
    envChecks.push({
      name: 'Env: SUPABASE_SERVICE_ROLE_KEY',
      status: 'warning',
      message: 'Not configured or using placeholder. Admin operations will fail.',
    })
  } else {
    envChecks.push({ name: 'Env: SUPABASE_SERVICE_ROLE_KEY', status: 'ok', message: 'Configured' })
  }

  if (envChecks.length > 0) {
    results.push(...envChecks)
  } else {
    results.push({ name: 'Environment', status: 'ok', message: 'All required env vars present' })
  }

  // ── 4. Service role key security check ─────────────────────────────────────
  const publicEnvKeys = Object.keys(process.env).filter((k) => k.startsWith('NEXT_PUBLIC_'))
  const leakedKeys = publicEnvKeys.filter((k) =>
    process.env[k]?.includes('sb_secret_') || process.env[k]?.includes('service_role')
  )

  results.push({
    name: 'Service Role Leak Check',
    status: leakedKeys.length === 0 ? 'ok' : 'error',
    message:
      leakedKeys.length === 0
        ? 'No service_role key found in NEXT_PUBLIC_ env vars.'
        : `CRITICAL: Service role key leaked in: ${leakedKeys.join(', ')}`,
  })

  return results
}

/**
 * CLI entry point — run with `npx tsx src/lib/supabase/health.ts`
 */
async function main() {
  console.log('🔍 The ANTS — Supabase Health Check\n')

  const results = await runHealthCheck()

  let okCount = 0
  let warnCount = 0
  let errCount = 0

  for (const check of results) {
    const icon = check.status === 'ok' ? '✓' : check.status === 'warning' ? '⚠' : '✗'
    const timeStr = check.durationMs != null ? ` (${check.durationMs}ms)` : ''
    console.log(`  ${icon} ${check.name}${timeStr}`)
    console.log(`    ${check.message}`)

    if (check.status === 'ok') okCount++
    else if (check.status === 'warning') warnCount++
    else errCount++
  }

  console.log(`\n──────────────────────────────────────────`)
  console.log(`  Results: ${okCount} ok, ${warnCount} warnings, ${errCount} errors`)
  console.log(`──────────────────────────────────────────\n`)

  if (errCount > 0) process.exit(1)
}

// Run when executed directly
if (require.main === module || process.argv[1]?.endsWith('health.ts')) {
  main()
}
