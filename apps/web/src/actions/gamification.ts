'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Unified Gamification Server Actions (XP, Streaks, Badges)
// Connected across: Past Papers, Pomodoro, Timetable, and Lessons
// ──────────────────────────────────────────────────────────────────────────────

import {
  getDb,
  userXpLedger,
  userBadges,
  userStreaks,
  profiles,
} from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';

export interface BadgeDefinition {
  key: string;
  title: string;
  description: string;
  iconName: string;
  category: 'past_paper' | 'pomodoro' | 'streak' | 'level' | 'lesson';
  xpReward: number;
}

const ALL_BADGES: BadgeDefinition[] = [
  {
    key: 'first_paper_done',
    title: 'First Step',
    description: 'Completed your first past paper exam.',
    iconName: 'BookOpen',
    category: 'past_paper',
    xpReward: 50,
  },
  {
    key: 'five_papers_done',
    title: 'Paper Grinder',
    description: 'Completed 5 past paper exams.',
    iconName: 'Award',
    category: 'past_paper',
    xpReward: 100,
  },
  {
    key: 'first_pomodoro',
    title: 'Deep Focus',
    description: 'Completed your first 25-minute Pomodoro study block.',
    iconName: 'Timer',
    category: 'pomodoro',
    xpReward: 30,
  },
  {
    key: 'first_lesson',
    title: 'Syllabus Explorer',
    description: 'Mastered your first syllabus topic.',
    iconName: 'CheckCircle2',
    category: 'lesson',
    xpReward: 40,
  },
  {
    key: 'streak_3',
    title: 'Spark of Consistency',
    description: 'Maintained a 3-day continuous study streak.',
    iconName: 'Flame',
    category: 'streak',
    xpReward: 50,
  },
  {
    key: 'streak_7',
    title: 'Unstoppable Momentum',
    description: 'Maintained a full 7-day study streak.',
    iconName: 'Zap',
    category: 'streak',
    xpReward: 100,
  },
  {
    key: 'level_5',
    title: 'Rising Scholar',
    description: 'Reached Scholar Level 5.',
    iconName: 'GraduationCap',
    category: 'level',
    xpReward: 150,
  },
  {
    key: 'level_10',
    title: 'Master Academic',
    description: 'Reached Scholar Level 10.',
    iconName: 'Sparkles',
    category: 'level',
    xpReward: 300,
  },
];

/** Fetch complete gamification profile for user */
export async function getGamificationProfile(userId: string) {
  try {
    const db = getDb();
    const [streak, badges, ledger] = await Promise.all([
      db.query.userStreaks.findFirst({
        where: eq(userStreaks.user_id, userId),
      }),
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
    const level = streak?.level ?? 1;
    const currentStreak = streak?.current_streak ?? 0;
    const longestStreak = streak?.longest_streak ?? 0;

    // Rank title
    let rankTitle = 'Novice Scholar';
    if (level >= 10) rankTitle = 'Master Scholar';
    else if (level >= 7) rankTitle = 'Distinguished Scholar';
    else if (level >= 4) rankTitle = 'Senior Scholar';
    else if (level >= 2) rankTitle = 'Apprentice Scholar';

    return {
      totalXp,
      level,
      rankTitle,
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

/** Award XP to user from any tool and update streaks/levels */
export async function awardXp(
  userId: string,
  amount: number,
  source: 'past_paper' | 'pomodoro' | 'lesson' | 'timetable' | 'badge',
  sourceId?: string,
  description?: string
) {
  try {
    const db = getDb();
    const now = new Date();

    // 1. Insert XP ledger entry
    await db.insert(userXpLedger).values({
      user_id: userId,
      xp_amount: amount,
      source,
      source_id: sourceId,
      description: description || `Earned ${amount} XP from ${source}`,
      earned_at: now,
    });

    // 2. Update streaks & total XP
    const streakRecord = await db.query.userStreaks.findFirst({
      where: eq(userStreaks.user_id, userId),
    });

    const todayStr = now.toISOString().slice(0, 10);
    let newCurrentStreak = 1;
    let newLongestStreak = 1;
    let newTotalXp = amount;

    if (streakRecord) {
      newTotalXp = (streakRecord.total_xp || 0) + amount;
      const lastDateStr = streakRecord.last_activity_date
        ? new Date(streakRecord.last_activity_date).toISOString().slice(0, 10)
        : null;

      if (lastDateStr === todayStr) {
        newCurrentStreak = streakRecord.current_streak;
      } else if (lastDateStr) {
        const diffDays = Math.floor(
          (new Date(todayStr).getTime() - new Date(lastDateStr).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
          newCurrentStreak = streakRecord.current_streak + 1;
        } else {
          newCurrentStreak = 1;
        }
      }
      newLongestStreak = Math.max(streakRecord.longest_streak || 0, newCurrentStreak);

      const newLevel = Math.floor(newTotalXp / 100) + 1;

      await db
        .update(userStreaks)
        .set({
          total_xp: newTotalXp,
          level: newLevel,
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_activity_date: now,
          updated_at: now,
        })
        .where(eq(userStreaks.user_id, userId));
    } else {
      await db.insert(userStreaks).values({
        user_id: userId,
        total_xp: newTotalXp,
        level: 1,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: now,
        updated_at: now,
      });
    }

    // 3. Check milestone badges
    const currentLevel = Math.floor(newTotalXp / 100) + 1;
    const badgesToAward: string[] = [];

    if (newCurrentStreak >= 3) badgesToAward.push('streak_3');
    if (newCurrentStreak >= 7) badgesToAward.push('streak_7');
    if (currentLevel >= 5) badgesToAward.push('level_5');
    if (currentLevel >= 10) badgesToAward.push('level_10');
    if (source === 'pomodoro') badgesToAward.push('first_pomodoro');
    if (source === 'lesson') badgesToAward.push('first_lesson');

    for (const badgeKey of badgesToAward) {
      const existing = await db.query.userBadges.findFirst({
        where: and(
          eq(userBadges.user_id, userId),
          eq(userBadges.badge_key, badgeKey)
        ),
      });
      if (!existing) {
        await db.insert(userBadges).values({
          user_id: userId,
          badge_key: badgeKey,
          earned_at: now,
        });
      }
    }

    return { success: true, totalXp: newTotalXp, currentStreak: newCurrentStreak };
  } catch (error: any) {
    console.error('[gamification] awardXp error:', error);
    return { success: false, error: error.message };
  }
}
