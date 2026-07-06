// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Server-side Supabase Clients (RSC, Server Actions, Route Handlers)
//
// Two clients are provided:
//   1. createClient()       — uses anon key + cookie auth. For user-scoped queries.
//   2. createAdminClient()  — uses service_role key (bypasses RLS). For admin ops
//                              like role upgrades, review queue approvals, etc.
//
// Connection pooling (Phase 10):
//   - The Supabase REST API already pools connections internally via PgBouncer.
//   - DATABASE_URL (port 6543) is available for direct pg connections if needed.
//   - DIRECT_URL (port 5432) is used by Supabase CLI for migrations.
// ──────────────────────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

/**
 * Admin client — uses service_role key to bypass RLS.
 *
 * Use ONLY for privileged server-side operations:
 *   - Approving/rejecting role upgrade applications
 *   - Managing review queue (approve/reject editor submissions)
 *   - Inviting contributors
 *   - Any operation that needs to read/write across user boundaries
 *
 * ⚠ NEVER use this in client components, Server Component render, or expose to the browser.
 *    The service_role key must remain server-only.
 */
export async function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey || serviceRoleKey.startsWith('sb_secret_xxx')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Set it in .env.local with your actual service_role secret from the Supabase Dashboard (Project Settings → API).'
    )
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op — admin client does not manage user cookies
        },
      },
    }
  )
}
