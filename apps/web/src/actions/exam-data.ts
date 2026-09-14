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
  pastPapers,
  paperGradeBoundaries,
} from '@/lib/db';
import { eq, and, gt, gte, asc, desc } from 'drizzle-orm';

function asTitle<T extends { name: string; id: string }>(row: T) {
  return { ...row, title: row.name };
}

export async function listCurriculums() {
  const db = getDb();
  const rows = await db
    .select({
      id: curriculums.id,
      name: curriculums.name,
      code: curriculums.code,
    })
    .from(curriculums)
    .orderBy(asc(curriculums.name));
  return rows.map(asTitle);
}

export async function listSubjects() {
  const db = getDb();
  const rows = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
      curriculum_id: subjects.curriculum_id,
    })
    .from(subjects)
    .orderBy(asc(subjects.name));
  return rows.map(asTitle);
}

/** Upcoming catalog by default. Pass `{ all: true }` only for a full history list. */
export async function listExams(opts?: { all?: boolean }) {
  const db = getDb();
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const rows = await db
    .select({
      id: exams.id,
      subject_id: exams.subject_id,
      curriculum_id: exams.curriculum_id,
      title: exams.title,
      exam_board: exams.exam_board,
      qualification_type: exams.qualification_type,
      syllabus_code: exams.syllabus_code,
      season: exams.season,
      series: exams.series,
      paper_number: exams.paper_number,
      exam_date: exams.exam_date,
      created_at: exams.created_at,
    })
    .from(exams)
    .where(opts?.all ? undefined : gte(exams.exam_date, cutoff))
    .orderBy(asc(exams.exam_date));

  return rows.map((row) => {
    const examSeries = [row.season, row.series].filter(Boolean).join(' ') || null;
    const examDate =
      row.exam_date instanceof Date ? row.exam_date.toISOString() : row.exam_date;
    return {
      ...row,
      qualification: row.qualification_type,
      exam_series: examSeries,
      date_type: row.exam_date ? ('fixed' as const) : ('custom' as const),
      exam_date: examDate,
    };
  });
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

/** Structured calculator presets for one subject (papers + boundaries). */
export async function listApprovedCalculatorPresets(subjectId?: string) {
  if (!subjectId) return [];
  const db = getDb();
  const rows = await db.query.pastPapers.findMany({
    where: eq(pastPapers.subject_id, subjectId),
    columns: {
      id: true,
      title: true,
      subject: true,
      syllabus_code: true,
      curriculum_id: true,
      subject_id: true,
      series: true,
      year: true,
      exam_board: true,
      qualification: true,
      paper_number: true,
      variant: true,
      total_marks: true,
    },
    with: {
      gradeBoundaries: {
        columns: {
          grade: true,
          min_mark: true,
          max_mark: true,
          ums_min: true,
          ums_max: true,
        },
      },
    },
    orderBy: [desc(pastPapers.year), desc(pastPapers.series)],
  });

  return rows.map((r) => {
    const isModular = r.qualification === 'IAL';
    return {
      id: r.id,
      title: r.title || `${r.subject} Paper ${r.paper_number}`,
      subject_code: r.syllabus_code,
      curriculum_id: r.curriculum_id || '',
      subject_id: r.subject_id || '',
      series: `${r.series} ${r.year}`,
      year: r.year,
      exam_board: r.exam_board,
      qualification: r.qualification,
      papers: [
        {
          name: r.title || `Paper ${r.paper_number}${r.variant ? ` (v${r.variant})` : ''}`,
          max_mark: r.total_marks || 100,
          weight: 100,
          paper_number: r.paper_number,
          variant: r.variant,
          paper_boundaries: r.gradeBoundaries.map((b) => ({
            grade: b.grade,
            min_mark: b.min_mark,
            max_mark: b.max_mark,
            ums_min: b.ums_min,
            ums_max: b.ums_max,
          })),
        },
      ],
      grade_boundaries: r.gradeBoundaries.map((b) => ({
        grade: b.grade,
        min_mark: b.min_mark,
        ums_min: b.ums_min,
        ums_max: b.ums_max,
      })),
      is_modular: isModular,
      paper_number: r.paper_number,
      variant: r.variant,
      syllabus_code: r.syllabus_code,
      status: 'approved',
    };
  });
}

export async function listMyExamEditorSubmissions(_userId: string) {
  return [];
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
