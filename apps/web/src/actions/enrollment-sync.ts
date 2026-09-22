'use server';

// Auto-create / refresh exam countdowns when a subject is enrolled or session changes.

import {
  getDb,
  exams,
  examCountdowns,
  userEnrollments,
  subjects,
  curriculums,
  studentProfiles,
} from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import {
  DEFAULT_EXAM_SESSION,
  examMatchesSession,
  examPaperMatchesTier,
  getPluginForCurriculumCode,
} from '@/lib/grading';
import {
  boardFromCurriculumCode,
  examMatchesMyanmarPaper,
  formatPaperRowLabel,
  type AwardLevel,
  type PaperPreferences,
} from '@/lib/exam-papers/myanmar-papers';
import type { SubjectTier } from '@/lib/grading/types';

async function deleteAutoCountdowns(userId: string, subjectId: string) {
  const db = getDb();
  const existing = await db.query.examCountdowns.findMany({
    where: and(eq(examCountdowns.user_id, userId), eq(examCountdowns.subject_id, subjectId)),
  });
  const { actionClearSourceQueue } = await import('@/actions/notifications');
  for (const row of existing) {
    if (row.is_custom) continue;
    await db.delete(examCountdowns).where(eq(examCountdowns.id, row.id));
    try {
      await actionClearSourceQueue('exam_countdown', row.id);
    } catch {
      /* ignore */
    }
  }
}

export async function getDefaultExamSession(userId: string): Promise<string> {
  const db = getDb();
  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.id, userId),
    columns: { default_exam_series: true },
  });
  return profile?.default_exam_series || DEFAULT_EXAM_SESSION;
}

export async function setDefaultExamSession(userId: string, series: string) {
  const db = getDb();
  const existing = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.id, userId),
  });
  if (existing) {
    await db
      .update(studentProfiles)
      .set({ default_exam_series: series })
      .where(eq(studentProfiles.id, userId));
  } else {
    await db.insert(studentProfiles).values({
      id: userId,
      default_exam_series: series,
    });
  }
  return { success: true as const };
}

export async function syncEnrollmentCountdowns(input: {
  userId: string;
  subjectId: string;
  curriculumId: string;
  targetSeries: string;
  tier?: SubjectTier | null;
  targetGrade?: string | null;
  awardLevel?: AwardLevel | null;
  paperPreferences?: PaperPreferences | null;
}) {
  const db = getDb();
  const [subject, curriculum] = await Promise.all([
    db.query.subjects.findFirst({ where: eq(subjects.id, input.subjectId) }),
    db.query.curriculums.findFirst({ where: eq(curriculums.id, input.curriculumId) }),
  ]);
  if (!subject || !curriculum) return { success: false as const, error: 'Subject not found' };

  const plugin = getPluginForCurriculumCode(curriculum.code);
  const tier = input.tier ?? null;
  const session = input.targetSeries || DEFAULT_EXAM_SESSION;
  const awardLevel = input.awardLevel ?? null;
  const routePrefs = input.paperPreferences ?? null;

  const catalog = await db.query.exams.findMany({
    where: eq(exams.subject_id, input.subjectId),
  });

  let matching = catalog.filter((exam) => examMatchesSession(exam, session));
  if (plugin.hasTiers && tier) {
    matching = matching.filter((exam) =>
      examPaperMatchesTier(exam.paper_number ?? '', subject.code, tier)
    );
  }

  const board = boardFromCurriculumCode(curriculum.code);
  if (board) {
    matching = matching.filter((exam) =>
      examMatchesMyanmarPaper(exam.paper_number ?? '', subject.code, board, {
        series: exam.season || exam.series || session,
        awardLevel,
        routePrefs,
        tier,
      })
    );
  }

  const color = subject.color_code ?? '#f59e0b';
  const paperLabel = (examPaper: string | null | undefined) =>
    board === 'EDEXCEL_IAL'
      ? subject.code
      : formatPaperRowLabel(examPaper ?? subject.code, null, board);

  const existing = await db.query.examCountdowns.findMany({
    where: and(eq(examCountdowns.user_id, input.userId), eq(examCountdowns.subject_id, input.subjectId)),
  });

  const matchingIds = new Set(matching.filter((exam) => exam.exam_date).map((exam) => exam.id));
  const dismissed = new Set(input.paperPreferences?.dismissedExamIds ?? []);
  const { actionClearSourceQueue, actionEnqueueExamCountdownReminders } = await import(
    '@/actions/notifications'
  );

  for (const row of existing) {
    if (row.is_custom) continue;
    if (!row.exam_id || !matchingIds.has(row.exam_id)) {
      await db.delete(examCountdowns).where(eq(examCountdowns.id, row.id));
      try {
        await actionClearSourceQueue('exam_countdown', row.id);
      } catch {
        /* ignore */
      }
    }
  }

  const keptExamIds = new Set(
    existing
      .filter((row) => !row.is_custom && row.exam_id && matchingIds.has(row.exam_id))
      .map((row) => row.exam_id as string)
  );

  let count = 0;
  for (const exam of matching) {
    if (!exam.exam_date) continue;
    if (dismissed.has(exam.id) || keptExamIds.has(exam.id)) continue;

    const nextTitle = exam.title;
    const nextPaper = paperLabel(exam.paper_number);
    const nextBoard = exam.exam_board ?? curriculum.code;

    const [inserted] = await db
      .insert(examCountdowns)
      .values({
        user_id: input.userId,
        subject_id: input.subjectId,
        exam_id: exam.id,
        title: nextTitle,
        exam_board: nextBoard,
        paper_name: nextPaper,
        exam_date: exam.exam_date,
        color_code: color,
        target_grade: input.targetGrade ?? null,
        is_custom: false,
        is_pinned: false,
      })
      .returning();
    count += 1;

    if (inserted?.id && inserted.exam_date) {
      try {
        await actionEnqueueExamCountdownReminders(
          inserted.id,
          input.userId,
          nextTitle,
          new Date(inserted.exam_date),
          false
        );
      } catch (err) {
        console.error('[enrollment-sync] enqueue countdown reminders failed', err);
      }
    }
  }

  return { success: true as const, count };
}

export async function removeAutoCountdownsForSubject(userId: string, subjectId: string) {
  await deleteAutoCountdowns(userId, subjectId);
  return { success: true as const };
}

export async function applyExamSessionToAll(userId: string, series: string) {
  const db = getDb();
  await setDefaultExamSession(userId, series);

  const enrollments = await db.query.userEnrollments.findMany({
    where: eq(userEnrollments.user_id, userId),
    with: { curriculum: { columns: { code: true } } },
  });

  let updated = 0;
  for (const row of enrollments) {
    if (row.curriculum?.code === 'EDEXCEL_IAL') continue;
    await db
      .update(userEnrollments)
      .set({ target_series: series })
      .where(eq(userEnrollments.id, row.id));
    await syncEnrollmentCountdowns({
      userId,
      subjectId: row.subject_id,
      curriculumId: row.curriculum_id,
      targetSeries: series,
      tier: (row.tier as SubjectTier | null) ?? null,
      targetGrade: row.target_grade,
      awardLevel: (row.award_level as AwardLevel | null) ?? null,
      paperPreferences: (row.paper_preferences as PaperPreferences | null) ?? null,
    });
    updated += 1;
  }

  return { success: true as const, updated };
}

/** Rebuild auto paper rows when enrollment mode is stale (e.g. old per_subject) or missing. */
export async function healEnrollmentCountdowns(userId: string) {
  const db = getDb();
  const enrollments = await db.query.userEnrollments.findMany({
    where: eq(userEnrollments.user_id, userId),
    with: { curriculum: { columns: { code: true } } },
  });
  if (enrollments.length === 0) return { success: true as const, healed: 0 };

  const autoRows = await db.query.examCountdowns.findMany({
    where: eq(examCountdowns.user_id, userId),
    columns: { subject_id: true, is_custom: true, exam_id: true },
  });
  const autoCount = new Map<string, number>();
  for (const row of autoRows) {
    if (row.is_custom || !row.subject_id) continue;
    autoCount.set(row.subject_id, (autoCount.get(row.subject_id) ?? 0) + 1);
  }

  let healed = 0;
  for (const row of enrollments) {
    const plugin = getPluginForCurriculumCode(row.curriculum?.code);
    const staleMode = row.countdown_mode !== plugin.countdownMode;
    const missing = (autoCount.get(row.subject_id) ?? 0) === 0;
    if (!staleMode && !missing) continue;

    if (staleMode) {
      await db
        .update(userEnrollments)
        .set({ countdown_mode: plugin.countdownMode })
        .where(eq(userEnrollments.id, row.id));
    }

    await syncEnrollmentCountdowns({
      userId,
      subjectId: row.subject_id,
      curriculumId: row.curriculum_id,
      targetSeries: row.target_series || DEFAULT_EXAM_SESSION,
      tier: (row.tier as SubjectTier | null) ?? null,
      targetGrade: row.target_grade,
      awardLevel: (row.award_level as AwardLevel | null) ?? null,
      paperPreferences: (row.paper_preferences as PaperPreferences | null) ?? null,
    });
    healed += 1;
  }

  return { success: true as const, healed };
}
