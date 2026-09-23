import { headers } from 'next/headers';
import { getDb, session } from '@/lib/db';
import { and, eq, gt } from 'drizzle-orm';

const SESSION_COOKIES = ['better-auth.session_token', '__Secure-better-auth.session_token'];

function parseCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${name}=`)) continue;
    return decodeURIComponent(trimmed.slice(name.length + 1));
  }
  return null;
}

/** Better Auth may sign the cookie as `token.signature`. The session row stores `token`. */
function sessionToken(cookieValue: string): string {
  const dot = cookieValue.lastIndexOf('.');
  return dot > 0 ? cookieValue.slice(0, dot) : cookieValue;
}

export interface SessionUser {
  userId: string;
}

/** Resolve the signed-in user from the Better Auth session cookie (single D1 read). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieHeader = (await headers()).get('cookie') ?? '';
  const raw = SESSION_COOKIES.map((name) => parseCookie(cookieHeader, name)).find(Boolean);
  if (!raw) return null;
  const token = sessionToken(raw);

  const db = getDb();
  const row = await db.query.session.findFirst({
    where: and(eq(session.token, token), gt(session.expiresAt, new Date())),
    columns: { userId: true },
  });

  return row ? { userId: row.userId } : null;
}

export type SessionGuardResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/**
 * Ensure the caller is authenticated. When `requestedUserId` is passed,
 * it must match the session user (prevents IDOR on user-scoped writes).
 */
export async function requireSessionUser(
  requestedUserId?: string
): Promise<SessionGuardResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { ok: false, error: 'Unauthorized' };
  if (requestedUserId && requestedUserId !== sessionUser.userId) {
    return { ok: false, error: 'Forbidden' };
  }
  return { ok: true, userId: sessionUser.userId };
}
