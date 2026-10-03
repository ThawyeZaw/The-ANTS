import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { eq, and, gt } from 'drizzle-orm';
import { createDb, session, profiles } from '@the-ants/db';

const SESSION_COOKIES = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
];

export interface AuthSessionUser {
  id: string;
  role: string;
  roles: string[];
}

declare module 'hono' {
  interface ContextVariableMap {
    sessionUser: AuthSessionUser;
  }
}

/** Better Auth may sign the cookie as `token.signature`. The session table stores `token`. */
function cleanSessionToken(cookieValue: string): string {
  const dot = cookieValue.lastIndexOf('.');
  return dot > 0 ? cookieValue.slice(0, dot) : cookieValue;
}

export async function resolveSessionUser(
  c: Context,
  db: ReturnType<typeof createDb>
): Promise<AuthSessionUser | null> {
  let token: string | null = null;

  for (const name of SESSION_COOKIES) {
    const val = getCookie(c, name);
    if (val) {
      token = cleanSessionToken(val);
      break;
    }
  }

  if (!token) {
    const authHeader = c.req.header('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = cleanSessionToken(authHeader.slice(7).trim());
    }
  }

  if (!token) return null;

  try {
    const sessionRow = await db.query.session.findFirst({
      where: and(eq(session.token, token), gt(session.expiresAt, new Date())),
      columns: { userId: true },
    });

    if (!sessionRow?.userId) return null;

    const profileRow = await db.query.profiles.findFirst({
      where: eq(profiles.id, sessionRow.userId as any),
      columns: { role: true, roles: true },
    });

    const role = profileRow?.role || 'student';
    const roles = (profileRow?.roles as string[] | null) || [role];

    return {
      id: sessionRow.userId,
      role,
      roles,
    };
  } catch (err) {
    console.error('[session] Error resolving session:', err);
    return null;
  }
}

export function createAuthMiddleware(getDb: (c: Context) => ReturnType<typeof createDb>) {
  return async (c: Context, next: Next) => {
    const db = getDb(c);
    const user = await resolveSessionUser(c, db);
    if (!user) {
      return c.json({ error: 'Unauthorized: Valid session required' }, 401);
    }
    c.set('sessionUser', user);
    await next();
  };
}

export function createAdminMiddleware(getDb: (c: Context) => ReturnType<typeof createDb>) {
  return async (c: Context, next: Next) => {
    const db = getDb(c);
    const user = await resolveSessionUser(c, db);
    if (!user) {
      return c.json({ error: 'Unauthorized: Valid session required' }, 401);
    }
    if (!user.roles.includes('admin')) {
      return c.json({ error: 'Forbidden: Administrator privileges required' }, 403);
    }
    c.set('sessionUser', user);
    await next();
  };
}

export function createModeratorMiddleware(getDb: (c: Context) => ReturnType<typeof createDb>) {
  return async (c: Context, next: Next) => {
    const db = getDb(c);
    const user = await resolveSessionUser(c, db);
    if (!user) {
      return c.json({ error: 'Unauthorized: Valid session required' }, 401);
    }
    const isModerator = user.roles.includes('admin') || user.roles.includes('main_contributor');
    if (!isModerator) {
      return c.json({ error: 'Forbidden: Moderator or Administrator privileges required' }, 403);
    }
    c.set('sessionUser', user);
    await next();
  };
}
