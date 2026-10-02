import { getDb, profiles, user } from '@/lib/db';
import { eq } from 'drizzle-orm';

function slugUsername(raw: string): string {
  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 24) || 'user'
  );
}

/**
 * Ensures a `profiles` row exists for an auth user.
 * Enrollment and most study tables FK to `profiles.id`, so missing rows
 * cause opaque D1 "Failed query: insert …" errors on enroll.
 */
export async function ensureUserProfile(userId: string): Promise<boolean> {
  const db = getDb();

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { id: true },
  });
  if (existing) return true;

  const authUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true, email: true, name: true, image: true },
  });
  if (!authUser) return false;

  const base = slugUsername(authUser.name || authUser.email.split('@')[0] || 'user');
  const taken = await db.query.profiles.findFirst({
    where: eq(profiles.username, base),
    columns: { id: true },
  });
  const username = taken
    ? `${base}_${Math.random().toString(36).slice(2, 6)}`
    : base;

  try {
    await db
      .insert(profiles)
      .values({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name || authUser.email.split('@')[0] || 'User',
        username,
        avatar_url: authUser.image,
        role: 'student',
        roles: ['student'],
      })
      .onConflictDoNothing();
  } catch (err) {
    console.error('[ensureUserProfile] insert failed:', err);
    return false;
  }

  const confirmed = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { id: true },
  });
  return Boolean(confirmed);
}
