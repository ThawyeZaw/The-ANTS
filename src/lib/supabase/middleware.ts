// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Supabase Auth Middleware (session refresh + route protection)
// ──────────────────────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  // If env vars are missing, don't crash the middleware; treat as unauthenticated.
  if (!url || !key) return supabaseResponse

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    })

    // IMPORTANT: Always call getUser() — it validates the token server-side.
    // Never trust getSession() for authorization.
    const { data } = await supabase.auth.getUser()
    const user = data.user

    // Public routes — accessible without authentication
    const publicPaths = ['/login', '/signup', '/about', '/explore', '/profile', '/auth', '/onboarding']
    const isPublicPath = publicPaths.some(
      (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
    )
    // Root path is also public
    const isRootPath = request.nextUrl.pathname === '/'

    // Auth gating is handled client-side in (app)/layout.tsx with loading states.
    // We skip server-side redirect here to avoid ERR_ABORTED on RSC streams.

    return supabaseResponse
  } catch (e) {
    console.error('updateSession error:', e)
    // On failure, allow the request through — better than a 500
    return supabaseResponse
  }
}
