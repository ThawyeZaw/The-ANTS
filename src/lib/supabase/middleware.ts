// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Supabase Auth Middleware (session refresh + route protection)
// ──────────────────────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
    }
  )

  // IMPORTANT: Always call getUser() — it validates the token server-side.
  // Never trust getSession() for authorization.
  const { data: { user } } = await supabase.auth.getUser()

  // Public routes — accessible without authentication
  const publicPaths = ['/login', '/signup', '/about', '/explore', '/profile', '/auth', '/onboarding']
  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  )
  // Root path is also public
  const isRootPath = request.nextUrl.pathname === '/'

  if (!user && !isPublicPath && !isRootPath) {
    const url = request.nextUrl.clone()
    const originalPath = request.nextUrl.pathname + request.nextUrl.search
    url.pathname = '/login'
    url.searchParams.set('next', originalPath)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
