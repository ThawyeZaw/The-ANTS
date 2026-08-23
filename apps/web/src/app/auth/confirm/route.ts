// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Email Confirmation Handler (Neon Drizzle DB)
// ──────────────────────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from 'next/server';
import { getDb, verification, user } from '@/lib/db';
import { eq, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') || searchParams.get('token_hash');
  const next = searchParams.get('next') ?? '/login?verified=true';

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_confirmation_link', request.url));
  }

  try {
    const db = getDb();
    const record = await db.query.verification.findFirst({
      where: and(
        eq(verification.value, token),
        gte(verification.expiresAt, new Date())
      ),
    });

    if (record) {
      await db.update(user).set({ emailVerified: true }).where(eq(user.id, record.identifier));
      await db.delete(verification).where(eq(verification.id, record.id));
    }
  } catch (err) {
    console.error('[auth/confirm]', err);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
