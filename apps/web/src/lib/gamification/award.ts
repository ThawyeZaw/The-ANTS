import {
  getDb,
  userXpLedger,
  userBadges,
  userStreaks,
  userPastPaperRecords,
  profiles,
} from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { badgeByKey, type BadgeDefinition } from '@/lib/gamification/badges';
import { dateKeyInTimeZone } from '@/lib/gamification/date-key';
import { levelFromTotalXp } from '@/lib/gamification/levels';
import { computeNextStreak, displayStreak } from '@/lib/gamification/streaks';
import type { AwardXpResult, XpSource } from '@/lib/gamification/types';

export type { AwardXpResult, XpSource } from '@/lib/gamification/types';

/** Fixed payouts — callers cannot invent amounts. */
export const XP_AMOUNTS = {
  pastPaperPlain: 20,
  pastPaperWithMarks: 30,
  pastPaperMarksTopUp: 10,
  pomodoro: 20,
  lesson: 10,
  timetable: 10,
} as const;

const ALLOWED_AMOUNTS = new Set<number>(Object.values(XP_AMOUNTS));

async function countDistinctDonePapers(userId: string): Promise<number> {
  const db = getDb();
  const rows = await db.query.userPastPaperRecords.findMany({
    where: and(
      eq(userPastPaperRecords.user_id, userId),
      eq(userPastPaperRecords.status, 'done')
    ),
    columns: { past_paper_id: true },
  });
  return new Set(rows.map((r) => r.past_paper_id)).size;
}

async function evaluateBadgeKeys(
  userId: string,
  ctx: {
    source: XpSource;
    currentStreak: number;
    level: number;
    donePaperCount: number;
  }
): Promise<string[]> {
  const keys: string[] = [];

  if (ctx.donePaperCount >= 1) keys.push('first_paper_done');
  if (ctx.donePaperCount >= 5) keys.push('five_papers_done');
  if (ctx.source === 'pomodoro') keys.push('first_pomodoro');
  if (ctx.source === 'lesson') keys.push('first_lesson');
  if (ctx.currentStreak >= 3) keys.push('streak_3');
  if (ctx.currentStreak >= 7) keys.push('streak_7');
  if (ctx.level >= 5) keys.push('level_5');
  if (ctx.level >= 10) keys.push('level_10');

  const db = getDb();
  const existing = await db.query.userBadges.findMany({
    where: eq(userBadges.user_id, userId),
    columns: { badge_key: true },
  });
  const unlocked = new Set(existing.map((b) => b.badge_key));
  return keys.filter((k) => !unlocked.has(k));
}

async function grantBadges(userId: string, badgeKeys: string[]): Promise<BadgeDefinition[]> {
  if (badgeKeys.length === 0) return [];
  const db = getDb();
  const now = new Date();
  const granted: BadgeDefinition[] = [];

  for (const badgeKey of badgeKeys) {
    const existing = await db.query.userBadges.findFirst({
      where: and(eq(userBadges.user_id, userId), eq(userBadges.badge_key, badgeKey)),
    });
    if (existing) continue;

    try {
      await db.insert(userBadges).values({
        user_id: userId,
        badge_key: badgeKey,
        earned_at: now,
      });
    } catch {
      continue;
    }

    const def = badgeByKey(badgeKey);
    if (def) granted.push(def);
  }

  return granted;
}

/**
 * Internal XP writer — NOT a server action. Import only from other server modules.
 * Idempotent per (user, source, sourceId).
 */
export async function awardXp(
  userId: string,
  amount: number,
  source: XpSource,
  sourceId: string,
  description?: string
): Promise<AwardXpResult> {
  try {
    if (!userId || !sourceId) {
      return { success: false, awarded: false, error: 'userId and sourceId are required' };
    }
    if (!ALLOWED_AMOUNTS.has(amount) || amount <= 0) {
      return { success: false, awarded: false, error: 'Invalid XP amount' };
    }

    const db = getDb();
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: { timezone: true },
    });
    const todayKey = dateKeyInTimeZone(profile?.timezone);
    const now = new Date();

    const existingEntry = await db.query.userXpLedger.findFirst({
      where: and(
        eq(userXpLedger.user_id, userId),
        eq(userXpLedger.source, source),
        eq(userXpLedger.source_id, sourceId)
      ),
    });

    if (existingEntry) {
      const streak = await db.query.userStreaks.findFirst({
        where: eq(userStreaks.user_id, userId),
      });
      return {
        success: true,
        awarded: false,
        totalXp: streak?.total_xp ?? 0,
        currentLevel: levelFromTotalXp(streak?.total_xp ?? 0),
        currentStreak: displayStreak(
          streak?.last_activity_date_key,
          streak?.current_streak ?? 0,
          todayKey,
          streak?.last_activity_date
        ),
      };
    }

    try {
      await db.insert(userXpLedger).values({
        user_id: userId,
        xp_amount: amount,
        source,
        source_id: sourceId,
        description: description || `Earned ${amount} XP from ${source}`,
        earned_at: now,
      });
    } catch (insertError: unknown) {
      const message = insertError instanceof Error ? insertError.message : '';
      if (message.toLowerCase().includes('unique')) {
        const streak = await db.query.userStreaks.findFirst({
          where: eq(userStreaks.user_id, userId),
        });
        return {
          success: true,
          awarded: false,
          totalXp: streak?.total_xp ?? 0,
          currentLevel: levelFromTotalXp(streak?.total_xp ?? 0),
        };
      }
      throw insertError;
    }

    const streakRecord = await db.query.userStreaks.findFirst({
      where: eq(userStreaks.user_id, userId),
    });

    const previousTotalXp = streakRecord?.total_xp ?? 0;
    const previousLevel = levelFromTotalXp(previousTotalXp);
    const newTotalXp = previousTotalXp + amount;

    const { currentStreak: nextStreak, longestStreak: computedLongest } = computeNextStreak(
      streakRecord?.last_activity_date_key,
      streakRecord?.current_streak ?? 0,
      todayKey,
      streakRecord?.last_activity_date
    );
    const newLongestStreak = Math.max(streakRecord?.longest_streak ?? 0, computedLongest);
    const newLevel = levelFromTotalXp(newTotalXp);

    if (streakRecord) {
      await db
        .update(userStreaks)
        .set({
          total_xp: newTotalXp,
          level: newLevel,
          current_streak: nextStreak,
          longest_streak: newLongestStreak,
          last_activity_date: now,
          last_activity_date_key: todayKey,
          updated_at: now,
        })
        .where(eq(userStreaks.user_id, userId));
    } else {
      await db.insert(userStreaks).values({
        user_id: userId,
        total_xp: newTotalXp,
        level: newLevel,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: now,
        last_activity_date_key: todayKey,
        updated_at: now,
      });
    }

    const donePaperCount = await countDistinctDonePapers(userId);
    const badgeKeys = await evaluateBadgeKeys(userId, {
      source,
      currentStreak: nextStreak,
      level: newLevel,
      donePaperCount,
    });
    const newBadges = await grantBadges(userId, badgeKeys);

    return {
      success: true,
      awarded: true,
      xpAmount: amount,
      totalXp: newTotalXp,
      previousLevel,
      currentLevel: newLevel,
      levelUp: newLevel > previousLevel,
      newBadges,
      currentStreak: nextStreak,
    };
  } catch (error: unknown) {
    console.error('[gamification] awardXp error:', error);
    return {
      success: false,
      awarded: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
