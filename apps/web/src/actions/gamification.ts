'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Gamification read / privacy actions
// XP writes live in lib/gamification/award.ts (not a public server action).
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, userXpLedger, userBadges, userStreaks, profiles } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { ALL_BADGES } from '@/lib/gamification/badges';
import { dateKeyInTimeZone } from '@/lib/gamification/date-key';
import { levelFromTotalXp, rankTitleForLevel } from '@/lib/gamification/levels';
import { displayStreak } from '@/lib/gamification/streaks';
import { getSessionUser } from '@/lib/auth-session';

const HIDDEN_PROFILE = {
  hidden: true as const,
  totalXp: 0,
  level: 1,
  rankTitle: 'Novice Scholar',
  currentStreak: 0,
  longestStreak: 0,
  unlockedBadges: [] as { key: string; earnedAt: Date | string }[],
  allBadges: ALL_BADGES.map((b) => ({ ...b, unlocked: false })),
  recentActivity: [] as {
    id: string;
    amount: number;
    source: string;
    description: string | null;
    earnedAt: Date | string;
  }[],
};

/** Fetch complete gamification profile for user */
export async function getGamificationProfile(userId: string) {
  try {
    const db = getDb();
    const sessionUser = await getSessionUser();
    const isOwner = sessionUser?.userId === userId;

    const profileRow = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: { timezone: true, leaderboard_visible: true },
    });

    if (!profileRow) return HIDDEN_PROFILE;
    if (!isOwner && profileRow.leaderboard_visible === false) return HIDDEN_PROFILE;

    const todayKey = dateKeyInTimeZone(profileRow.timezone);

    const [streak, badges, ledger] = await Promise.all([
      db.query.userStreaks.findFirst({ where: eq(userStreaks.user_id, userId) }),
      db.query.userBadges.findMany({
        where: eq(userBadges.user_id, userId),
        orderBy: [desc(userBadges.earned_at)],
      }),
      db.query.userXpLedger.findMany({
        where: eq(userXpLedger.user_id, userId),
        orderBy: [desc(userXpLedger.earned_at)],
        limit: 10,
      }),
    ]);

    const unlockedKeys = new Set(badges.map((b) => b.badge_key));
    const totalXp = streak?.total_xp ?? 0;
    const level = levelFromTotalXp(totalXp);
    const storedStreak = streak?.current_streak ?? 0;
    const currentStreak = displayStreak(
      streak?.last_activity_date_key,
      storedStreak,
      todayKey,
      streak?.last_activity_date
    );
    const longestStreak = streak?.longest_streak ?? 0;

    return {
      totalXp,
      level,
      rankTitle: rankTitleForLevel(level),
      currentStreak,
      longestStreak,
      unlockedBadges: badges.map((b) => ({
        key: b.badge_key,
        earnedAt: b.earned_at,
      })),
      allBadges: ALL_BADGES.map((b) => ({
        ...b,
        unlocked: unlockedKeys.has(b.key),
      })),
      recentActivity: ledger.map((l) => ({
        id: l.id,
        amount: l.xp_amount,
        source: l.source,
        description: l.description,
        earnedAt: l.earned_at,
      })),
    };
  } catch (error) {
    console.error('[gamification] getGamificationProfile error:', error);
    return {
      totalXp: 0,
      level: 1,
      rankTitle: 'Novice Scholar',
      currentStreak: 0,
      longestStreak: 0,
      unlockedBadges: [],
      allBadges: ALL_BADGES.map((b) => ({ ...b, unlocked: false })),
      recentActivity: [],
    };
  }
}

export async function setLeaderboardVisibility(
  visible: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return { success: false, error: 'Unauthorized' };

    const db = getDb();
    await db
      .update(profiles)
      .set({ leaderboard_visible: visible, updated_at: new Date() })
      .where(eq(profiles.id, sessionUser.userId));
    return { success: true };
  } catch (error: unknown) {
    console.error('[gamification] setLeaderboardVisibility error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update visibility',
    };
  }
}

/** Thin stats helper used by past-paper tracker ribbon */
export async function getUserGamificationStats(userId: string) {
  const profile = await getGamificationProfile(userId);
  return {
    totalXp: profile.totalXp,
    level: profile.level,
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    badges: profile.unlockedBadges.map((b) => b.key),
  };
}
