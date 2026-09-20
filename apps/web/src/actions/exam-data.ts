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
} from '@/lib/db';
import { eq, and, gt, gte, asc, desc, inArray } from 'drizzle-orm';
import {
  boardFromCurriculumCode,
  examMatchesMyanmarPaper,
  examRowMatchesMyanmar,
} from '@/lib/exam-papers/myanmar-papers';
import { IAL_CASH_INS, type IalCashInCode } from '@/lib/grading/ial-cash-in';

function asTitle<T extends { name: string; id: string }>(row: T) {
  return { ...row, title: row.name };
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const catalogMemoryCache = new Map<string, CacheEntry<any>>();

function getFromCache<T>(key: string): T | null {
  const entry = catalogMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    catalogMemoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setInCache<T>(key: string, data: T, ttlMs: number = 10 * 60 * 1000): T {
  catalogMemoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

export async function listCurriculums() {
  const cached = getFromCache<ReturnType<typeof asTitle>[]>('curriculums');
  if (cached) return cached;

  const db = getDb();
  const rows = await db
    .select({
      id: curriculums.id,
      name: curriculums.name,
      code: curriculums.code,
    })
    .from(curriculums)
    .orderBy(asc(curriculums.name));
  const result = rows.map(asTitle);
  return setInCache('curriculums', result, 15 * 60 * 1000);
}

export async function listSubjects() {
  const cached = getFromCache<ReturnType<typeof asTitle>[]>('subjects:v2');
  if (cached) return cached;

  const db = getDb();
  const rows = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
      curriculum_id: subjects.curriculum_id,
      subject_type: subjects.subject_type,
      qualification_data: subjects.qualification_data,
    })
    .from(subjects)
    .orderBy(asc(subjects.name));
  const result = rows.map(asTitle);
  return setInCache('subjects:v2', result, 15 * 60 * 1000);
}

/** Upcoming catalog by default. Pass `{ all: true }` only for a full history list. */
export async function listExams(opts?: { all?: boolean; myanmarOnly?: boolean }) {
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
      curriculum_code: curriculums.code,
      subject_code: subjects.code,
    })
    .from(exams)
    .leftJoin(curriculums, eq(exams.curriculum_id, curriculums.id))
    .leftJoin(subjects, eq(exams.subject_id, subjects.id))
    .where(opts?.all ? undefined : gte(exams.exam_date, cutoff))
    .orderBy(asc(exams.exam_date));

  const mapped = rows.map((row) => {
    const examSeries = [row.season, row.series].filter(Boolean).join(' ') || null;
    const examDate =
      row.exam_date instanceof Date ? row.exam_date.toISOString() : row.exam_date;
    return {
      ...row,
      qualification: row.qualification_type,
      paper_code: row.paper_number,
      exam_series: examSeries,
      date_type: row.exam_date ? ('fixed' as const) : ('custom' as const),
      exam_date: examDate,
    };
  });

  if (opts?.myanmarOnly === false) return mapped;
  return mapped.filter((row) =>
    examRowMatchesMyanmar({
      paper_number: row.paper_number,
      syllabus_code: row.syllabus_code ?? row.subject_code,
      season: row.season,
      series: row.series,
      curriculum_code: row.curriculum_code,
      exam_board: row.exam_board,
      subject_code: row.subject_code,
    })
  );
}

export async function listUpcomingExamsBySubject(subjectId: string) {
  const db = getDb();
  const now = new Date();
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.id, subjectId),
    with: { curriculum: true },
  });
  const rows = await db
    .select()
    .from(exams)
    .where(and(eq(exams.subject_id, subjectId), gt(exams.exam_date, now)))
    .orderBy(asc(exams.exam_date));

  const board = boardFromCurriculumCode(subject?.curriculum?.code);
  const subjectCode = subject?.code ?? '';
  if (!board || !subjectCode) return rows;

  return rows.filter((exam) =>
    examMatchesMyanmarPaper(exam.paper_number ?? '', subjectCode, board, {
      series: exam.season || exam.series,
    })
  );
}

export async function getExamById(examId: string) {
  const db = getDb();
  const row = await db.query.exams.findFirst({ where: eq(exams.id, examId) });
  return row ?? null;
}

function mapPastPaperToPreset(r: {
  id: string;
  title: string | null;
  subject: string;
  syllabus_code: string;
  curriculum_id: string | null;
  subject_id: string | null;
  series: string;
  year: number;
  exam_board: string;
  qualification: string;
  paper_number: string;
  variant: string | null;
  total_marks: number | null;
  gradeBoundaries: {
    grade: string;
    min_mark: number;
    max_mark: number | null;
    ums_min: number | null;
    ums_max: number | null;
  }[];
}) {
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
        paper_number: isModular ? r.syllabus_code : r.paper_number,
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
}

const PRESET_COLUMNS = {
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
} as const;

const PRESET_BOUNDARY_COLUMNS = {
  grade: true,
  min_mark: true,
  max_mark: true,
  ums_min: true,
  ums_max: true,
} as const;

/** Structured calculator presets for one subject (papers + boundaries). */
export async function listApprovedCalculatorPresets(subjectId?: string) {
  if (!subjectId) return [];
  return listApprovedCalculatorPresetsForSubjects([subjectId]);
}

/** Load calculator presets for one or more catalog subject IDs (IAL units). */
export async function listApprovedCalculatorPresetsForSubjects(subjectIds: string[]) {
  const ids = [...new Set(subjectIds.filter(Boolean))].sort();
  if (ids.length === 0) return [];
  const cacheKey = `presets:v3:${ids.join(',')}`;
  const cached = getFromCache<ReturnType<typeof mapPastPaperToPreset>[]>(cacheKey);
  if (cached) return cached;

  const db = getDb();
  const rows = await db.query.pastPapers.findMany({
    where: inArray(pastPapers.subject_id, ids),
    columns: PRESET_COLUMNS,
    with: {
      gradeBoundaries: {
        columns: PRESET_BOUNDARY_COLUMNS,
      },
    },
    orderBy: [desc(pastPapers.year), desc(pastPapers.series)],
  });

  return setInCache(cacheKey, rows.map(mapPastPaperToPreset), 10 * 60 * 1000);
}

/** Load past-paper presets for every unit in an IAL cash-in award. */
export async function listCashInCalculatorPresets(cashInCode: string, subjectId?: string) {
  const db = getDb();
  let codes: string[] = [];

  const award = IAL_CASH_INS[cashInCode as IalCashInCode];
  if (award) {
    codes = [...award.compulsory, ...award.optional];
  } else if (subjectId) {
    // Check if the subject has qualification_data containing this cashInCode
    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, subjectId),
      columns: { qualification_data: true }
    });
    
    if (subject?.qualification_data) {
      try {
        const spec = typeof subject.qualification_data === 'string' 
          ? JSON.parse(subject.qualification_data) 
          : subject.qualification_data;
        const profile = spec?.qualifications?.find((q: any) => q.cashInCode === cashInCode);
        if (profile) {
          codes = [...(profile.mandatoryUnits || []), ...(profile.electiveRules?.allowedUnitPool || [])];
        }
      } catch (e) {
        console.error('Failed to parse qualification_data in listCashInCalculatorPresets', e);
      }
    }
  }

  if (codes.length === 0) return [];

  const unitSubjects = await db.query.subjects.findMany({
    where: inArray(subjects.code, [...codes]),
    columns: { id: true, code: true, curriculum_id: true },
  });
  const ialUnits = unitSubjects.filter(
    (s) => s.curriculum_id === 'curr-edexcel-ial' || codes.includes(s.code)
  );
  return listApprovedCalculatorPresetsForSubjects(ialUnits.map((s) => s.id));
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

  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.id, input.subjectId),
    with: { curriculum: true },
  });
  const board = boardFromCurriculumCode(subject?.curriculum?.code);
  if (
    board &&
    subject?.code &&
    !examMatchesMyanmarPaper(newExam.paper_number ?? '', subject.code, board, {
      series: newExam.season || newExam.series,
    })
  ) {
    return { success: false as const, error: 'That paper is not on the Myanmar timetable' };
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
