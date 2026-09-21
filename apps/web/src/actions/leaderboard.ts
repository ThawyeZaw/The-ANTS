'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Leaderboard Server Actions
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, userStreaks, userXpLedger, profiles } from '@/lib/db';
import { desc, eq, sql, gt, and } from 'drizzle-orm';
import { levelFromTotalXp } from '@/lib/gamification/levels';
import { displayStreak } from '@/lib/gamification/streaks';
import { dateKeyInTimeZone } from '@/lib/gamification/date-key';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  myEntry?: LeaderboardEntry;
}

function visibleProfileFilter() {
  return eq(profiles.leaderboard_visible, true);
}

async function buildMyEntry(
  userId: string,
  timeframe: 'weekly' | 'all_time'
): Promise<LeaderboardEntry | undefined> {
  const db = getDb();

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: {
      name: true,
      avatar_url: true,
      role: true,
      leaderboard_visible: true,
      timezone: true,
    },
  });
  const todayKey = dateKeyInTimeZone(profile?.timezone);
  if (!profile || profile.leaderboard_visible === false) return undefined;

  const streak = await db.query.userStreaks.findFirst({
    where: eq(userStreaks.user_id, userId),
  });

  let totalXp = streak?.total_xp ?? 0;
  if (timeframe === 'weekly') {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [row] = await db
      .select({
        weeklyXp: sql<number>`coalesce(sum(${userXpLedger.xp_amount}), 0)`.as('weekly_xp'),
      })
      .from(userXpLedger)
      .where(and(eq(userXpLedger.user_id, userId), gt(userXpLedger.earned_at, sevenDaysAgo)));
    totalXp = Number(row?.weeklyXp) || 0;
  }

  let rank = 1;
  if (timeframe === 'weekly') {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyRows = await db
      .select({
        userId: userXpLedger.user_id,
        weeklyXp: sql<number>`sum(${userXpLedger.xp_amount})`.as('weekly_xp'),
      })
      .from(userXpLedger)
      .innerJoin(profiles, eq(userXpLedger.user_id, profiles.id))
      .where(and(gt(userXpLedger.earned_at, sevenDaysAgo), visibleProfileFilter()))
      .groupBy(userXpLedger.user_id);
    rank =
      weeklyRows.filter((row) => (Number(row.weeklyXp) || 0) > totalXp).length + 1;
  } else {
    const [rankRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userStreaks)
      .innerJoin(profiles, eq(userStreaks.user_id, profiles.id))
      .where(and(visibleProfileFilter(), gt(userStreaks.total_xp, totalXp)));
    rank = Number(rankRow?.count ?? 0) + 1;
  }

  return {
    rank,
    userId,
    name: profile.name || 'Anonymous Ant',
    avatarUrl: profile.avatar_url,
    role: profile.role || 'student',
    totalXp,
    level: levelFromTotalXp(streak?.total_xp ?? 0),
    currentStreak: displayStreak(
      streak?.last_activity_date_key,
      streak?.current_streak ?? 0,
      todayKey,
      streak?.last_activity_date
    ),
    isCurrentUser: true,
  };
}

export async function getLeaderboard(
  currentUserId?: string,
  timeframe: 'weekly' | 'all_time' = 'all_time'
): Promise<LeaderboardResult> {
  try {
    const db = getDb();
    let todayKey = dateKeyInTimeZone(undefined);
    if (currentUserId) {
      const viewerProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, currentUserId),
        columns: { timezone: true },
      });
      todayKey = dateKeyInTimeZone(viewerProfile?.timezone);
    }

    if (timeframe === 'weekly') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const rows = await db
        .select({
          userId: userXpLedger.user_id,
          weeklyXp: sql<number>`sum(${userXpLedger.xp_amount})`.as('weekly_xp'),
          name: profiles.name,
          avatarUrl: profiles.avatar_url,
          role: profiles.role,
          currentStreak: userStreaks.current_streak,
          lastActivityDateKey: userStreaks.last_activity_date_key,
          lastActivityDate: userStreaks.last_activity_date,
          totalXpAllTime: userStreaks.total_xp,
        })
        .from(userXpLedger)
        .innerJoin(profiles, eq(userXpLedger.user_id, profiles.id))
        .leftJoin(userStreaks, eq(userXpLedger.user_id, userStreaks.user_id))
        .where(and(gt(userXpLedger.earned_at, sevenDaysAgo), visibleProfileFilter()))
        .groupBy(userXpLedger.user_id)
        .orderBy(desc(sql`weekly_xp`))
        .limit(50);

      const entries: LeaderboardEntry[] = rows.map((row, i) => ({
        rank: i + 1,
        userId: row.userId,
        name: row.name || 'Anonymous Ant',
        avatarUrl: row.avatarUrl,
        role: row.role || 'student',
        totalXp: Number(row.weeklyXp) || 0,
        level: levelFromTotalXp(row.totalXpAllTime ?? 0),
        currentStreak: displayStreak(
          row.lastActivityDateKey,
          row.currentStreak ?? 0,
          todayKey,
          row.lastActivityDate
        ),
        isCurrentUser: currentUserId === row.userId,
      }));

      let myEntry = entries.find((e) => e.isCurrentUser);
      if (currentUserId && !myEntry) {
        myEntry = await buildMyEntry(currentUserId, 'weekly');
      }

      return { entries, myEntry };
    }

    const rows = await db
      .select({
        userId: userStreaks.user_id,
        totalXp: userStreaks.total_xp,
        currentStreak: userStreaks.current_streak,
        lastActivityDateKey: userStreaks.last_activity_date_key,
        lastActivityDate: userStreaks.last_activity_date,
        name: profiles.name,
        avatarUrl: profiles.avatar_url,
        role: profiles.role,
      })
      .from(userStreaks)
      .innerJoin(profiles, eq(userStreaks.user_id, profiles.id))
      .where(visibleProfileFilter())
      .orderBy(desc(userStreaks.total_xp))
      .limit(50);

    const entries: LeaderboardEntry[] = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      name: r.name || 'Anonymous Ant',
      avatarUrl: r.avatarUrl,
      role: r.role || 'student',
      totalXp: r.totalXp,
      level: levelFromTotalXp(r.totalXp),
      currentStreak: displayStreak(
        r.lastActivityDateKey,
        r.currentStreak ?? 0,
        todayKey,
        r.lastActivityDate
      ),
      isCurrentUser: currentUserId === r.userId,
    }));

    let myEntry = entries.find((e) => e.isCurrentUser);
    if (currentUserId && !myEntry) {
      myEntry = await buildMyEntry(currentUserId, 'all_time');
    }

    return { entries, myEntry };
  } catch (error) {
    console.error('[leaderboard] getLeaderboard error:', error);
    return { entries: [] };
  }
}
