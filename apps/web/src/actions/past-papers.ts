'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Past Paper Tracker & Grade Calculation Server Actions
// Supports: CAIE IGCSE, CAIE A Level, Edexcel IGCSE, Edexcel IAL
// ──────────────────────────────────────────────────────────────────────────────

import {
  getDb,
  pastPapers,
  userPastPaperRecords,
  userEnrollments,
  curriculums,
  subjects,
  userXpLedger,
  type ComponentMark,
} from '@/lib/db';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import { getPluginForPaper } from '@/lib/grading';
import { awardXp, XP_AMOUNTS, type AwardXpResult } from '@/lib/gamification/award';
import { requireSessionUser } from '@/lib/auth-session';

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
      columns: {
        subject_id: true,
        target_series: true,
        target_grade: true,
        tier: true,
      },
      with: {
        subject: {
          columns: {
            id: true,
            name: true,
            code: true,
            curriculum_id: true,
            icon_url: true,
            color_code: true,
            subject_type: true,
            qualification_data: true,
          },
        },
        curriculum: { columns: { id: true, name: true, code: true } },
      },
    });

    if (enrollments.length > 0) {
      const subjectMap = new Map<string, any>();
      for (const e of enrollments) {
        if (e.subject && !subjectMap.has(e.subject.id)) {
          subjectMap.set(e.subject.id, {
            ...e.subject,
            curriculum: e.curriculum,
            target_series: e.target_series,
            target_grade: e.target_grade,
            tier: e.tier,
          });
        }
      }
      return Array.from(subjectMap.values());
    }

    return [];
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
      columns: { id: true, name: true, code: true, icon_url: true },
      with: {
        subjects: {
          columns: {
            id: true,
            name: true,
            code: true,
            curriculum_id: true,
            description: true,
            color_code: true,
            subject_type: true,
            qualification_data: true,
          },
          orderBy: [asc(subjects.name)],
        },
      },
      orderBy: [asc(curriculums.name)],
    });
  } catch (error) {
    console.error('[past-papers] getAllCurriculumsWithSubjects error:', error);
    return [];
  }
}

import { enrollInSubject as enrollInSubjectAction } from '@/actions/curriculum';

/** Enroll user in a subject (shared with curriculum hub — auto-syncs countdown). */
export async function enrollInSubject(
  userId: string,
  curriculumId: string,
  subjectId: string,
  options?: Parameters<typeof enrollInSubjectAction>[3]
) {
  return enrollInSubjectAction(userId, curriculumId, subjectId, options);
}

/** List past papers. Requires at least one filter so the full table is never scanned. */
export async function listPastPapers(filters: PastPaperFilter = {}) {
  try {
    if (
      !filters.subjectId &&
      !filters.examBoard &&
      !filters.qualification &&
      !filters.year &&
      !filters.series
    ) {
      return [];
    }

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
    const paperIds = subjectId
      ? (
          await db
            .select({ id: pastPapers.id })
            .from(pastPapers)
            .where(eq(pastPapers.subject_id, subjectId))
        ).map((p) => p.id)
      : null;
    if (subjectId && paperIds && paperIds.length === 0) return [];

    return await db.query.userPastPaperRecords.findMany({
      where: and(
        eq(userPastPaperRecords.user_id, userId),
        paperIds ? inArray(userPastPaperRecords.past_paper_id, paperIds) : undefined
      ),
      columns: {
        id: true,
        past_paper_id: true,
        status: true,
        component_marks: true,
        raw_score: true,
        max_score: true,
        percentage: true,
        calculated_grade: true,
        calculated_ums: true,
        notes: true,
      },
      with: {
        pastPaper: { columns: { id: true, subject_id: true } },
      },
      orderBy: [desc(userPastPaperRecords.updated_at)],
    });
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
    const guard = await requireSessionUser(input.userId);
    if (!guard.ok) return { success: false, error: guard.error };

    const db = getDb();
    const now = new Date();

    const existing = await db.query.userPastPaperRecords.findFirst({
      where: and(
        eq(userPastPaperRecords.user_id, input.userId),
        eq(userPastPaperRecords.past_paper_id, input.pastPaperId)
      ),
    });

    let isNewlyCompleted = false;
    let calculatedGrade = input.calculatedGrade;
    let calculatedUms = input.calculatedUms;
    let percentage = input.percentage;

    if (input.rawScore !== undefined && input.maxScore !== undefined && input.maxScore > 0) {
      if (percentage === undefined) {
        percentage = Math.round((input.rawScore / input.maxScore) * 1000) / 10;
      }
      if (calculatedGrade === undefined) {
        const paper = await db.query.pastPapers.findFirst({
          where: eq(pastPapers.id, input.pastPaperId),
          with: { gradeBoundaries: true, curriculum: true },
        });
        if (paper) {
          const plugin = getPluginForPaper({
            examBoard: paper.exam_board,
            qualification: paper.qualification,
            curriculumCode: paper.curriculum?.code,
          });
          const result = plugin.gradeFromRawMark(
            input.rawScore,
            input.maxScore,
            paper.gradeBoundaries ?? []
          );
          calculatedGrade = result.grade;
          calculatedUms = result.ums;
        }
      }
    }
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
          percentage: percentage !== undefined ? percentage : existing.percentage,
          calculated_grade: calculatedGrade ?? existing.calculated_grade,
          calculated_ums: calculatedUms ?? existing.calculated_ums,
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
        percentage,
        calculated_grade: calculatedGrade,
        calculated_ums: calculatedUms,
        notes: input.notes,
        completed_at: input.status === 'done' ? now : null,
        created_at: now,
        updated_at: now,
      });
    }

    const hasMarks =
      (input.componentMarks && input.componentMarks.length > 0) ||
      (input.rawScore !== undefined && input.rawScore !== null && input.maxScore !== undefined);

    let gamification: AwardXpResult | undefined;
    if (isNewlyCompleted) {
      const xpEarned = hasMarks ? XP_AMOUNTS.pastPaperWithMarks : XP_AMOUNTS.pastPaperPlain;
      gamification = await awardXp(
        input.userId,
        xpEarned,
        'past_paper',
        input.pastPaperId,
        hasMarks ? 'Completed past paper with grade marks' : 'Completed past paper'
      );
    } else if (input.status === 'done' && hasMarks) {
      const baseAward = await db.query.userXpLedger.findFirst({
        where: and(
          eq(userXpLedger.user_id, input.userId),
          eq(userXpLedger.source, 'past_paper'),
          eq(userXpLedger.source_id, input.pastPaperId)
        ),
      });
      if (baseAward?.xp_amount === XP_AMOUNTS.pastPaperPlain) {
        gamification = await awardXp(
          input.userId,
          XP_AMOUNTS.pastPaperMarksTopUp,
          'past_paper',
          `${input.pastPaperId}:marks`,
          'Added grade marks to a completed past paper'
        );
      }
    }

    return { success: true, calculatedGrade, calculatedUms, percentage, gamification };
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

