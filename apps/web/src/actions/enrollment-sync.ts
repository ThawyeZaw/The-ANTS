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
  placeholderDateForSession,
  syllabusHasTiers,
} from '@/lib/grading';
import {
  boardFromCurriculumCode,
  examMatchesMyanmarPaper,
} from '@/lib/exam-papers/myanmar-papers';
import type { SubjectTier } from '@/lib/grading/types';

async function deleteAutoCountdowns(userId: string, subjectId: string) {
  const db = getDb();
  const existing = await db.query.examCountdowns.findMany({
    where: and(eq(examCountdowns.user_id, userId), eq(examCountdowns.subject_id, subjectId)),
  });
  for (const row of existing) {
    if (row.is_custom) continue;
    await db.delete(examCountdowns).where(eq(examCountdowns.id, row.id));
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

  await deleteAutoCountdowns(input.userId, input.subjectId);

  const catalog = await db.query.exams.findMany({
    where: eq(exams.subject_id, input.subjectId),
  });

  let matching = catalog.filter((exam) => examMatchesSession(exam, session));
  if (plugin.hasTiers && syllabusHasTiers(subject.code) && tier) {
    matching = matching.filter((exam) =>
      examPaperMatchesTier(exam.paper_number ?? '', subject.code, tier)
    );
  }

  const board = boardFromCurriculumCode(curriculum.code);
  if (board) {
    matching = matching.filter((exam) =>
      examMatchesMyanmarPaper(exam.paper_number ?? '', subject.code, board)
    );
  }

  const color = subject.color_code ?? '#f59e0b';

  if (plugin.countdownMode === 'per_paper') {
    const rows = matching.length > 0 ? matching : [];
    if (rows.length === 0) {
      await db.insert(examCountdowns).values({
        user_id: input.userId,
        subject_id: input.subjectId,
        exam_id: null,
        title: `${subject.name} (${session})`,
        exam_board: curriculum.code,
        paper_name: subject.code,
        exam_date: placeholderDateForSession(session),
        color_code: color,
        target_grade: input.targetGrade ?? null,
        is_custom: false,
        is_pinned: true,
      });
    } else {
      for (const exam of rows) {
        if (!exam.exam_date) continue;
        await db.insert(examCountdowns).values({
          user_id: input.userId,
          subject_id: input.subjectId,
          exam_id: exam.id,
          title: exam.title,
          exam_board: exam.exam_board ?? curriculum.code,
          paper_name: exam.paper_number ? `Paper ${exam.paper_number}` : subject.code,
          exam_date: exam.exam_date,
          color_code: color,
          target_grade: input.targetGrade ?? null,
          is_custom: false,
          is_pinned: true,
        });
      }
    }
    return { success: true as const, count: Math.max(rows.length, 1) };
  }

  // per_subject — one countdown at the earliest matching paper date
  const dated = matching
    .filter((e) => e.exam_date)
    .sort((a, b) => (a.exam_date as Date).getTime() - (b.exam_date as Date).getTime());
  const primary = dated[0];

  await db.insert(examCountdowns).values({
    user_id: input.userId,
    subject_id: input.subjectId,
    exam_id: primary?.id ?? null,
    title: `${subject.name} ${session}`,
    exam_board: primary?.exam_board ?? curriculum.code,
    paper_name: subject.code,
    exam_date: primary?.exam_date ?? placeholderDateForSession(session),
    color_code: color,
    target_grade: input.targetGrade ?? null,
    is_custom: false,
    is_pinned: true,
  });

  return { success: true as const, count: 1 };
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
  });

  for (const row of enrollments) {
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
    });
  }

  return { success: true as const, updated: enrollments.length };
}
