'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Leaderboard Server Actions
// Weekly and All-Time rankings by Scholar XP and Streaks
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, userStreaks, userXpLedger, profiles } from '@/lib/db';
import { desc, eq, sql, gt } from 'drizzle-orm';

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

export async function getLeaderboard(
  currentUserId?: string,
  timeframe: 'weekly' | 'all_time' = 'all_time'
): Promise<LeaderboardEntry[]> {
  try {
    const db = getDb();

    if (timeframe === 'weekly') {
      // XP earned in the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const rows = await db
        .select({
          userId: userXpLedger.user_id,
          weeklyXp: sql<number>`sum(${userXpLedger.xp_amount})`.as('weekly_xp'),
        })
        .from(userXpLedger)
        .where(gt(userXpLedger.earned_at, sevenDaysAgo))
        .groupBy(userXpLedger.user_id)
        .orderBy(desc(sql`weekly_xp`))
        .limit(50);

      const entries: LeaderboardEntry[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const [profile, streak] = await Promise.all([
          db.query.profiles.findFirst({ where: eq(profiles.id, row.userId) }),
          db.query.userStreaks.findFirst({ where: eq(userStreaks.user_id, row.userId) }),
        ]);

        const displayName = profile?.name || 'Anonymous Ant';

        entries.push({
          rank: i + 1,
          userId: row.userId,
          name: displayName,
          avatarUrl: profile?.avatar_url,
          role: profile?.role || 'student',
          totalXp: Number(row.weeklyXp) || 0,
          level: streak?.level || 1,
          currentStreak: streak?.current_streak || 0,
          isCurrentUser: currentUserId === row.userId,
        });
      }
      return entries;
    }

    // All-time rankings
    const rows = await db.query.userStreaks.findMany({
      orderBy: [desc(userStreaks.total_xp)],
      limit: 50,
      with: {
        user: true,
      },
    });

    return rows.map((r, i) => {
      const displayName = r.user?.name || 'Anonymous Ant';
      return {
        rank: i + 1,
        userId: r.user_id,
        name: displayName,
        avatarUrl: r.user?.avatar_url,
        role: r.user?.role || 'student',
        totalXp: r.total_xp,
        level: r.level,
        currentStreak: r.current_streak,
        isCurrentUser: currentUserId === r.user_id,
      };
    });
  } catch (error) {
    console.error('[leaderboard] getLeaderboard error:', error);
    return [];
  }
}
