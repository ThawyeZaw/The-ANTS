'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Curriculum Hub Server Actions
// Supports: getCurriculums, getSubjectsByCurriculum, getSubjectWithProgress,
//           enrollInSubject, unenrollFromSubject
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, curriculums, subjects, topics, topicProgress, userCurriculums, userEnrollments, pastPapers, userPastPaperRecords } from '@/lib/db';
import { eq, and, asc, count, sql, inArray } from 'drizzle-orm';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CurriculumWithStats {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon_url: string | null;
  created_at: Date | null;
  subjectCount: number;
  isEnrolled: boolean;
}

export interface SubjectWithProgress {
  id: string;
  curriculum_id: string;
  name: string;
  code: string;
  description: string | null;
  icon_url: string | null;
  color_code: string | null;
  created_at: Date | null;
  topicCount: number;
  completedTopics: number;
  paperCount: number;
  completedPapers: number;
  isEnrolled: boolean;
}

export interface TopicWithProgress {
  id: string;
  subject_id: string;
  name: string;
  description: string | null;
  order_index: number | null;
  subtopics_count: number | null;
  difficulty_level: string | null;
  estimated_hours: number | null;
  status: string;
  last_studied_at: Date | null;
  completed_at: Date | null;
  notes: string | null;
}

// ── getPaperGridData types ─────────────────────────────────────────────────────

export interface PaperGridSession {
  year: number;
  series: string;
  label: string; // e.g. "May/Jun 2023"
}

export interface PaperGridRow {
  paperId: string;
  paperNumber: string;
  variant: string | null;
  title: string | null;
  totalMarks: number | null;
  durationMinutes: number | null;
  examBoard: string;
  qualification: string;
  /** keyed by `${year}-${series}` */
  cells: Record<string, PaperGridCell>;
}

export interface PaperGridCell {
  paperId: string;
  recordId: string | null;
  status: 'not_done' | 'done' | 'skipped';
  rawScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  calculatedGrade: string | null;
  calculatedUms: number | null;
}

export interface PaperGridData {
  sessions: PaperGridSession[];   // columns, newest first
  rows: PaperGridRow[];           // paper unit rows
  isIAL: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. getCurriculums — list all 4 boards with subject count + enrollment status
// ──────────────────────────────────────────────────────────────────────────────

export async function getCurriculums(userId: string): Promise<CurriculumWithStats[]> {
  try {
    const db = getDb();

    const [allCurriculums, enrolledCurriculumIds] = await Promise.all([
      db.query.curriculums.findMany({
        with: { subjects: { columns: { id: true } } },
        orderBy: [asc(curriculums.name)],
      }),
      db.query.userCurriculums
        .findMany({ where: eq(userCurriculums.user_id, userId), columns: { curriculum_id: true } })
        .then((rows) => new Set(rows.map((r) => r.curriculum_id))),
    ]);

    return allCurriculums.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      description: c.description,
      icon_url: c.icon_url,
      created_at: c.created_at,
      subjectCount: c.subjects?.length ?? 0,
      isEnrolled: enrolledCurriculumIds.has(c.id),
    }));
  } catch (err) {
    console.error('[curriculum] getCurriculums error:', err);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. getSubjectsByCurriculum — list subjects with per-user topic + paper progress
// ──────────────────────────────────────────────────────────────────────────────

export async function getSubjectsByCurriculum(
  curriculumId: string,
  userId: string
): Promise<SubjectWithProgress[]> {
  try {
    const db = getDb();

    const [allSubjects, userEnrollRows, progressRows, paperRows, paperRecordRows] = await Promise.all([
      db.query.subjects.findMany({
        where: eq(subjects.curriculum_id, curriculumId),
        with: { topics: { columns: { id: true } } },
        orderBy: [asc(subjects.name)],
      }),
      db.query.userEnrollments.findMany({
        where: eq(userEnrollments.user_id, userId),
        columns: { subject_id: true },
      }),
      db.query.topicProgress.findMany({
        where: eq(topicProgress.user_id, userId),
        columns: { topic_id: true, status: true },
        with: { topic: { columns: { subject_id: true } } },
      }),
      db.query.pastPapers.findMany({
        where: eq(pastPapers.curriculum_id, curriculumId),
        columns: { id: true, subject_id: true },
      }),
      db.query.userPastPaperRecords.findMany({
        where: eq(userPastPaperRecords.user_id, userId),
        columns: { past_paper_id: true, status: true },
        with: { pastPaper: { columns: { subject_id: true } } },
      }),
    ]);

    const enrolledSubjectIds = new Set(userEnrollRows.map((r) => r.subject_id));

    // Build progress map: subjectId → { completed, total }
    const topicProgressMap = new Map<string, { completed: number; total: number }>();
    for (const prog of progressRows) {
      const subjectId = prog.topic?.subject_id;
      if (!subjectId) continue;
      const entry = topicProgressMap.get(subjectId) ?? { completed: 0, total: 0 };
      entry.total++;
      if (prog.status === 'completed') entry.completed++;
      topicProgressMap.set(subjectId, entry);
    }

    // Build paper progress map: subjectId → { completed, total }
    const paperCountMap = new Map<string, number>();
    for (const p of paperRows) {
      if (!p.subject_id) continue;
      paperCountMap.set(p.subject_id, (paperCountMap.get(p.subject_id) ?? 0) + 1);
    }
    const paperDoneMap = new Map<string, number>();
    for (const r of paperRecordRows) {
      const subjectId = r.pastPaper?.subject_id;
      if (!subjectId || r.status !== 'done') continue;
      paperDoneMap.set(subjectId, (paperDoneMap.get(subjectId) ?? 0) + 1);
    }

    return allSubjects.map((s) => {
      const prog = topicProgressMap.get(s.id) ?? { completed: 0, total: s.topics?.length ?? 0 };
      return {
        id: s.id,
        curriculum_id: s.curriculum_id,
        name: s.name,
        code: s.code,
        description: s.description,
        icon_url: s.icon_url,
        color_code: s.color_code,
        created_at: s.created_at,
        topicCount: s.topics?.length ?? 0,
        completedTopics: prog.completed,
        paperCount: paperCountMap.get(s.id) ?? 0,
        completedPapers: paperDoneMap.get(s.id) ?? 0,
        isEnrolled: enrolledSubjectIds.has(s.id),
      };
    });
  } catch (err) {
    console.error('[curriculum] getSubjectsByCurriculum error:', err);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. getSubjectTopicsWithProgress — topics + per-user progress for subject page
// ──────────────────────────────────────────────────────────────────────────────

export async function getSubjectTopicsWithProgress(
  subjectId: string,
  userId: string
): Promise<TopicWithProgress[]> {
  try {
    const db = getDb();

    const allTopics = await db.query.topics.findMany({
      where: eq(topics.subject_id, subjectId),
      orderBy: [asc(topics.order_index)],
    });

    const topicIds = allTopics.map((t) => t.id);
    const filteredProgress =
      topicIds.length > 0
        ? await db.query.topicProgress.findMany({
            where: and(
              eq(topicProgress.user_id, userId),
              inArray(topicProgress.topic_id, topicIds)
            ),
          })
        : [];

    const progressMap = new Map(filteredProgress.map((p) => [p.topic_id, p]));

    return allTopics.map((t) => {
      const prog = progressMap.get(t.id);
      return {
        id: t.id,
        subject_id: t.subject_id,
        name: t.name,
        description: t.description,
        order_index: t.order_index,
        subtopics_count: t.subtopics_count,
        difficulty_level: t.difficulty_level,
        estimated_hours: t.estimated_hours,
        status: prog?.status ?? 'not_started',
        last_studied_at: prog?.last_studied_at ?? null,
        completed_at: prog?.completed_at ?? null,
        notes: prog?.notes ?? null,
      };
    });
  } catch (err) {
    console.error('[curriculum] getSubjectTopicsWithProgress error:', err);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. getPaperGridData — Excel-style grid: rows × session columns
// ──────────────────────────────────────────────────────────────────────────────

export async function getPaperGridData(
  userId: string,
  subjectId: string,
  yearFrom?: number,
  yearTo?: number
): Promise<PaperGridData> {
  try {
    const db = getDb();

    // Fetch all papers for this subject
    const allPapers = await db.query.pastPapers.findMany({
      where: eq(pastPapers.subject_id, subjectId),
      orderBy: [asc(pastPapers.paper_number), asc(pastPapers.variant)],
    });

    // Fetch user records for those papers
    const paperIds = allPapers.map((p) => p.id);
    const userRecords =
      paperIds.length > 0
        ? await db.query.userPastPaperRecords.findMany({
            where: and(
              eq(userPastPaperRecords.user_id, userId),
              inArray(userPastPaperRecords.past_paper_id, paperIds)
            ),
          })
        : [];

    const recordMap = new Map(userRecords.map((r) => [r.past_paper_id, r]));

    // Detect IAL (Edexcel modular with UMS)
    const isIAL = allPapers.some((p) => p.qualification === 'IAL');

    // Collect unique sessions (year × series)
    const sessionSet = new Map<string, PaperGridSession>();
    for (const p of allPapers) {
      const yearOk =
        (!yearFrom || p.year >= yearFrom) && (!yearTo || p.year <= yearTo);
      if (!yearOk) continue;
      const key = `${p.year}-${p.series}`;
      if (!sessionSet.has(key)) {
        sessionSet.set(key, {
          year: p.year,
          series: p.series,
          label: `${p.series.replace('May/June', 'May').replace('Oct/Nov', 'Oct')} ${p.year}`,
        });
      }
    }

    // Sort sessions newest → oldest
    const sessions: PaperGridSession[] = [...sessionSet.values()].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      // Within same year: May/June before Oct/Nov before Jan
      const seriesOrder: Record<string, number> = { 'May/June': 1, 'Oct/Nov': 2, Jan: 3, 'Feb/March': 4 };
      return (seriesOrder[a.series] ?? 9) - (seriesOrder[b.series] ?? 9);
    });

    // Group papers into rows (each unique paper_number + variant combination = a row)
    const rowMap = new Map<string, PaperGridRow>();
    for (const p of allPapers) {
      const yearOk =
        (!yearFrom || p.year >= yearFrom) && (!yearTo || p.year <= yearTo);

      const rowKey = `${p.paper_number}-${p.variant ?? ''}`;
      if (!rowMap.has(rowKey)) {
        rowMap.set(rowKey, {
          paperId: p.id,
          paperNumber: p.paper_number,
          variant: p.variant,
          title: p.title,
          totalMarks: p.total_marks,
          durationMinutes: p.duration_minutes,
          examBoard: p.exam_board,
          qualification: p.qualification,
          cells: {},
        });
      }

      if (!yearOk) continue;

      const sessionKey = `${p.year}-${p.series}`;
      const record = recordMap.get(p.id);
      const row = rowMap.get(rowKey)!;
      row.cells[sessionKey] = {
        paperId: p.id,
        recordId: record?.id ?? null,
        status: (record?.status as 'not_done' | 'done' | 'skipped') ?? 'not_done',
        rawScore: record?.raw_score ?? null,
        maxScore: record?.max_score ?? null,
        percentage: record?.percentage ?? null,
        calculatedGrade: record?.calculated_grade ?? null,
        calculatedUms: record?.calculated_ums ?? null,
      };
    }

    const rows = [...rowMap.values()].sort((a, b) =>
      a.paperNumber.localeCompare(b.paperNumber, undefined, { numeric: true })
    );

    return { sessions, rows, isIAL };
  } catch (err) {
    console.error('[curriculum] getPaperGridData error:', err);
    return { sessions: [], rows: [], isIAL: false };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. enrollInSubject / unenrollFromSubject
// ──────────────────────────────────────────────────────────────────────────────

export async function enrollInSubject(userId: string, curriculumId: string, subjectId: string) {
  try {
    const db = getDb();

    // Ensure curriculum enrollment
    const existingCurr = await db.query.userCurriculums.findFirst({
      where: and(eq(userCurriculums.user_id, userId), eq(userCurriculums.curriculum_id, curriculumId)),
    });
    if (!existingCurr) {
      await db.insert(userCurriculums).values({ user_id: userId, curriculum_id: curriculumId });
    }

    // Ensure subject enrollment
    const existingEnroll = await db.query.userEnrollments.findFirst({
      where: and(eq(userEnrollments.user_id, userId), eq(userEnrollments.subject_id, subjectId)),
    });
    if (!existingEnroll) {
      await db.insert(userEnrollments).values({ user_id: userId, curriculum_id: curriculumId, subject_id: subjectId });
    }

    return { success: true };
  } catch (err: any) {
    console.error('[curriculum] enrollInSubject error:', err);
    return { success: false, error: err.message };
  }
}

export async function unenrollFromSubject(userId: string, subjectId: string) {
  try {
    const db = getDb();
    await db
      .delete(userEnrollments)
      .where(and(eq(userEnrollments.user_id, userId), eq(userEnrollments.subject_id, subjectId)));
    return { success: true };
  } catch (err: any) {
    console.error('[curriculum] unenrollFromSubject error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateTopicProgress(
  userId: string,
  topicId: string,
  status: 'not_started' | 'in_progress' | 'completed',
  notes?: string
) {
  try {
    const db = getDb();
    const now = new Date();

    const existing = await db.query.topicProgress.findFirst({
      where: and(eq(topicProgress.user_id, userId), eq(topicProgress.topic_id, topicId)),
    });

    if (existing) {
      await db
        .update(topicProgress)
        .set({
          status,
          notes: notes !== undefined ? notes : existing.notes,
          last_studied_at: now,
          completed_at: status === 'completed' ? existing.completed_at || now : null,
        })
        .where(eq(topicProgress.id, existing.id));
    } else {
      await db.insert(topicProgress).values({
        user_id: userId,
        topic_id: topicId,
        status,
        notes: notes || null,
        last_studied_at: now,
        completed_at: status === 'completed' ? now : null,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('[curriculum] updateTopicProgress error:', err);
    return { success: false, error: err.message };
  }
}

