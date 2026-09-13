'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Past Paper Tracker & Grade Calculation Server Actions
// Supports: CAIE IGCSE, CAIE A Level, Edexcel IGCSE, Edexcel IAL
// ──────────────────────────────────────────────────────────────────────────────

import {
  getDb,
  pastPapers,
  paperGradeBoundaries,
  userPastPaperRecords,
  userEnrollments,
  userCurriculums,
  subjects,
  curriculums,
  userXpLedger,
  userBadges,
  userStreaks,
  type ComponentMark,
} from '@/lib/db';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';

export interface PastPaperFilter {
  subjectId?: string;
  examBoard?: string;
  qualification?: string;
  year?: number;
  series?: string;
}

/** Get list of subjects the user is enrolled in, or all subjects if none enrolled */
export async function getEnrolledSubjects(userId: string) {
  try {
    const db = getDb();

    // 1. Fetch user enrollments
    const enrollments = await db.query.userEnrollments.findMany({
      where: eq(userEnrollments.user_id, userId),
      with: {
        subject: true,
        curriculum: true,
      },
    });

    if (enrollments.length > 0) {
      const subjectMap = new Map<string, any>();
      for (const e of enrollments) {
        if (e.subject && !subjectMap.has(e.subject.id)) {
          subjectMap.set(e.subject.id, {
            ...e.subject,
            curriculum: e.curriculum,
          });
        }
      }
      return Array.from(subjectMap.values());
    }

    // Fallback: If no explicit enrollments, check user_curriculums
    const userCurrs = await db.query.userCurriculums.findMany({
      where: eq(userCurriculums.user_id, userId),
      with: {
        curriculum: {
          with: {
            subjects: true,
          },
        },
      },
    });

    if (userCurrs.length > 0) {
      const subjs: any[] = [];
      for (const uc of userCurrs) {
        if (uc.curriculum?.subjects) {
          for (const s of uc.curriculum.subjects) {
            subjs.push({ ...s, curriculum: uc.curriculum });
          }
        }
      }
      if (subjs.length > 0) return subjs;
    }

    // Fallback 2: Return all subjects so new students can immediately interact
    const all = await db.query.subjects.findMany({
      with: {
        curriculum: true,
      },
      orderBy: [asc(subjects.name)],
    });
    return all;
  } catch (error) {
    console.error('[past-papers] getEnrolledSubjects error:', error);
    return [];
  }
}

/** Get all available curriculums and subjects for subject enrollment modal */
export async function getAllCurriculumsWithSubjects() {
  try {
    const db = getDb();
    return await db.query.curriculums.findMany({
      with: {
        subjects: true,
      },
      orderBy: [asc(curriculums.name)],
    });
  } catch (error) {
    console.error('[past-papers] getAllCurriculumsWithSubjects error:', error);
    return [];
  }
}

/** Enroll user in a subject */
export async function enrollInSubject(userId: string, curriculumId: string, subjectId: string) {
  try {
    const db = getDb();

    // Ensure userCurriculums record exists
    const existingCurr = await db.query.userCurriculums.findFirst({
      where: and(
        eq(userCurriculums.user_id, userId),
        eq(userCurriculums.curriculum_id, curriculumId)
      ),
    });
    if (!existingCurr) {
      await db.insert(userCurriculums).values({
        user_id: userId,
        curriculum_id: curriculumId,
      });
    }

    // Ensure userEnrollments record exists
    const existingEnroll = await db.query.userEnrollments.findFirst({
      where: and(
        eq(userEnrollments.user_id, userId),
        eq(userEnrollments.subject_id, subjectId)
      ),
    });
    if (!existingEnroll) {
      await db.insert(userEnrollments).values({
        user_id: userId,
        curriculum_id: curriculumId,
        subject_id: subjectId,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('[past-papers] enrollInSubject error:', error);
    return { success: false, error: error.message };
  }
}

/** List past papers with optional filters */
export async function listPastPapers(filters: PastPaperFilter = {}) {
  try {
    const db = getDb();
    const conditions = [];

    if (filters.subjectId) {
      conditions.push(eq(pastPapers.subject_id, filters.subjectId));
    }
    if (filters.examBoard) {
      conditions.push(eq(pastPapers.exam_board, filters.examBoard));
    }
    if (filters.qualification) {
      conditions.push(eq(pastPapers.qualification, filters.qualification));
    }
    if (filters.year) {
      conditions.push(eq(pastPapers.year, filters.year));
    }
    if (filters.series) {
      conditions.push(eq(pastPapers.series, filters.series));
    }

    return await db.query.pastPapers.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        gradeBoundaries: true,
        subject: true,
      },
      orderBy: [
        desc(pastPapers.year),
        asc(pastPapers.series),
        asc(pastPapers.paper_number),
        asc(pastPapers.variant),
      ],
    });
  } catch (error) {
    console.error('[past-papers] listPastPapers error:', error);
    return [];
  }
}

/** Get user past paper tracking records for a subject */
export async function getUserPastPaperRecords(userId: string, subjectId?: string) {
  try {
    const db = getDb();
    const userRecords = await db.query.userPastPaperRecords.findMany({
      where: eq(userPastPaperRecords.user_id, userId),
      with: {
        pastPaper: {
          with: {
            gradeBoundaries: true,
          },
        },
      },
      orderBy: [desc(userPastPaperRecords.updated_at)],
    });

    if (subjectId) {
      return userRecords.filter((r) => r.pastPaper?.subject_id === subjectId);
    }
    return userRecords;
  } catch (error) {
    console.error('[past-papers] getUserPastPaperRecords error:', error);
    return [];
  }
}

export interface UpsertPastPaperRecordInput {
  userId: string;
  pastPaperId: string;
  status: 'not_done' | 'done' | 'skipped';
  componentMarks?: ComponentMark[];
  rawScore?: number;
  maxScore?: number;
  percentage?: number;
  calculatedGrade?: string;
  calculatedUms?: number;
  notes?: string;
}

/** Record or update student progress on a past paper + award XP */
export async function upsertPastPaperRecord(input: UpsertPastPaperRecordInput) {
  try {
    const db = getDb();
    const now = new Date();

    const existing = await db.query.userPastPaperRecords.findFirst({
      where: and(
        eq(userPastPaperRecords.user_id, input.userId),
        eq(userPastPaperRecords.past_paper_id, input.pastPaperId)
      ),
    });

    let isNewlyCompleted = false;
    if (input.status === 'done' && (!existing || existing.status !== 'done')) {
      isNewlyCompleted = true;
    }

    if (existing) {
      await db
        .update(userPastPaperRecords)
        .set({
          status: input.status,
          component_marks: input.componentMarks ?? existing.component_marks,
          raw_score: input.rawScore !== undefined ? input.rawScore : existing.raw_score,
          max_score: input.maxScore !== undefined ? input.maxScore : existing.max_score,
          percentage: input.percentage !== undefined ? input.percentage : existing.percentage,
          calculated_grade: input.calculatedGrade ?? existing.calculated_grade,
          calculated_ums: input.calculatedUms ?? existing.calculated_ums,
          notes: input.notes !== undefined ? input.notes : existing.notes,
          completed_at: input.status === 'done' ? existing.completed_at || now : null,
          updated_at: now,
        })
        .where(eq(userPastPaperRecords.id, existing.id));
    } else {
      await db.insert(userPastPaperRecords).values({
        user_id: input.userId,
        past_paper_id: input.pastPaperId,
        status: input.status,
        component_marks: input.componentMarks ?? [],
        raw_score: input.rawScore,
        max_score: input.maxScore,
        percentage: input.percentage,
        calculated_grade: input.calculatedGrade,
        calculated_ums: input.calculatedUms,
        notes: input.notes,
        completed_at: input.status === 'done' ? now : null,
        created_at: now,
        updated_at: now,
      });
    }

    // ── Award Gamification XP & Badges if completed ──────────────────────────
    if (isNewlyCompleted) {
      const hasMarks = input.componentMarks && input.componentMarks.length > 0;
      const xpEarned = hasMarks ? 35 : 20;

      // 1. Record in XP ledger
      await db.insert(userXpLedger).values({
        user_id: input.userId,
        xp_amount: xpEarned,
        source: 'past_paper',
        source_id: input.pastPaperId,
        description: hasMarks
          ? 'Completed past paper with grade marks'
          : 'Completed past paper',
      });

      // 2. Update user streak & total XP
      const streakRecord = await db.query.userStreaks.findFirst({
        where: eq(userStreaks.user_id, input.userId),
      });

      const todayStr = now.toISOString().slice(0, 10);
      let newCurrentStreak = 1;
      let newLongestStreak = 1;
      let newTotalXp = xpEarned;

      if (streakRecord) {
        newTotalXp = (streakRecord.total_xp || 0) + xpEarned;
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
          .where(eq(userStreaks.user_id, input.userId));
      } else {
        await db.insert(userStreaks).values({
          user_id: input.userId,
          total_xp: newTotalXp,
          level: 1,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: now,
          updated_at: now,
        });
      }

      // 3. First paper badge check
      const existingBadge = await db.query.userBadges.findFirst({
        where: and(
          eq(userBadges.user_id, input.userId),
          eq(userBadges.badge_key, 'first_paper_done')
        ),
      });
      if (!existingBadge) {
        await db.insert(userBadges).values({
          user_id: input.userId,
          badge_key: 'first_paper_done',
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('[past-papers] upsertPastPaperRecord error:', error);
    return { success: false, error: error.message };
  }
}

/** Get single past paper with grade boundaries */
export async function getPastPaperWithBoundaries(pastPaperId: string) {
  try {
    const db = getDb();
    return await db.query.pastPapers.findFirst({
      where: eq(pastPapers.id, pastPaperId),
      with: {
        gradeBoundaries: true,
        subject: true,
      },
    });
  } catch (error) {
    console.error('[past-papers] getPastPaperWithBoundaries error:', error);
    return null;
  }
}

/** Get gamification stats for user (XP, Level, Streak, Badges) */
export async function getUserGamificationStats(userId: string) {
  try {
    const db = getDb();
    const streak = await db.query.userStreaks.findFirst({
      where: eq(userStreaks.user_id, userId),
    });
    const badges = await db.query.userBadges.findMany({
      where: eq(userBadges.user_id, userId),
      orderBy: [desc(userBadges.earned_at)],
    });

    return {
      totalXp: streak?.total_xp ?? 0,
      level: streak?.level ?? 1,
      currentStreak: streak?.current_streak ?? 0,
      longestStreak: streak?.longest_streak ?? 0,
      badges: badges.map((b) => b.badge_key),
    };
  } catch (error) {
    console.error('[past-papers] getUserGamificationStats error:', error);
    return {
      totalXp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      badges: [],
    };
  }
}
