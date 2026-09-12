'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Exam / countdown / grade-calculator data (D1 / Drizzle)
// Replaces legacy Supabase stub reads for key exam tools.
// ──────────────────────────────────────────────────────────────────────────────

import {
  getDb,
  curriculums,
  subjects,
  exams,
  examCountdowns,
  editorSubmissions,
} from '@/lib/db';
import { eq, and, gt, asc, desc } from 'drizzle-orm';

function asTitle<T extends { name: string; id: string }>(row: T) {
  return { ...row, title: row.name };
}

export async function listCurriculums() {
  const db = getDb();
  const rows = await db.select().from(curriculums).orderBy(asc(curriculums.name));
  return rows.map(asTitle);
}

export async function listSubjects() {
  const db = getDb();
  const rows = await db.select().from(subjects).orderBy(asc(subjects.name));
  return rows.map(asTitle);
}

export async function listExams() {
  const db = getDb();
  return db.select().from(exams).orderBy(asc(exams.exam_date));
}

export async function listUpcomingExamsBySubject(subjectId: string) {
  const db = getDb();
  const now = new Date();
  return db
    .select()
    .from(exams)
    .where(and(eq(exams.subject_id, subjectId), gt(exams.exam_date, now)))
    .orderBy(asc(exams.exam_date));
}

export async function getExamById(examId: string) {
  const db = getDb();
  const row = await db.query.exams.findFirst({ where: eq(exams.id, examId) });
  return row ?? null;
}

/** Approved calculator presets stored via editor submissions (jsonb payload). */
export async function listApprovedCalculatorPresets() {
  const db = getDb();
  const rows = await db
    .select()
    .from(editorSubmissions)
    .where(
      and(
        eq(editorSubmissions.entity_type, 'exam_calculator_preset'),
        eq(editorSubmissions.status, 'approved')
      )
    )
    .orderBy(desc(editorSubmissions.created_at));

  return rows.map((r) => {
    const data = (r.data ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      title: (data.title as string) || r.title,
      subject_code: (data.subject_code as string) || '',
      curriculum_id: (data.curriculum_id as string) || '',
      subject_id: (data.subject_id as string) || '',
      series: (data.series as string) || '',
      papers: (data.papers as unknown[]) || [],
      grade_boundaries: (data.grade_boundaries as unknown[]) || [],
      is_modular: Boolean(data.is_modular),
      status: r.status,
      ...data,
    };
  });
}

export async function listMyExamEditorSubmissions(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(editorSubmissions)
    .where(eq(editorSubmissions.submitted_by, userId as any))
    .orderBy(desc(editorSubmissions.created_at));
}

export async function listExamCountdownsForUser(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(examCountdowns)
    .where(eq(examCountdowns.user_id, userId as any))
    .orderBy(asc(examCountdowns.exam_date));
}

export async function switchExamCountdownSession(input: {
  userId: string;
  subjectId: string;
  oldExamId: string;
  newExamId: string;
}) {
  const db = getDb();
  const newExam = await db.query.exams.findFirst({
    where: eq(exams.id, input.newExamId),
  });
  if (!newExam || !newExam.exam_date) {
    return { success: false as const, error: 'Exam not found' };
  }

  const existing = await db.query.examCountdowns.findFirst({
    where: and(
      eq(examCountdowns.user_id, input.userId as any),
      eq(examCountdowns.exam_id, input.oldExamId)
    ),
  });

  if (existing) {
    await db.delete(examCountdowns).where(eq(examCountdowns.id, existing.id));
  }

  const [inserted] = await db
    .insert(examCountdowns)
    .values({
      user_id: input.userId as any,
      exam_id: input.newExamId,
      subject_id: input.subjectId as any,
      title: newExam.title,
      exam_board: newExam.exam_board,
      exam_date: newExam.exam_date,
    })
    .returning();

  return {
    success: true as const,
    countdown: inserted,
    exam: newExam,
    removedCountdownId: existing?.id ?? null,
  };
}
