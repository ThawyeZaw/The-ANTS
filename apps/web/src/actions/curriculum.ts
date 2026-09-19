'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Curriculum Hub Server Actions
// Supports: getCurriculums, getSubjectsByCurriculum, getSubjectWithProgress,
//           enrollInSubject, unenrollFromSubject
// ──────────────────────────────────────────────────────────────────────────────

import {
  getDb,
  curriculums,
  subjects,
  topics,
  topicProgress,
  userCurriculums,
  userEnrollments,
  pastPapers,
  userPastPaperRecords,
  examCountdowns,
  subjectGradeBoundaries,
  userComponentSelections,
  userCashInEnrollments,
} from '@/lib/db';
import { eq, and, asc, inArray, count } from 'drizzle-orm';
import {
  getDefaultExamSession,
  removeAutoCountdownsForSubject,
  syncEnrollmentCountdowns,
} from '@/actions/enrollment-sync';
import {
  examPaperMatchesTier,
  getPluginForCurriculumCode,
  syllabusHasTiers,
  computeSubjectGrade,
  isRequiredPaperRow,
  paperRowKey,
} from '@/lib/grading';
import type { SubjectTier } from '@/lib/grading/types';
import {
  boardFromCurriculumCode,
  formatPaperRowLabel,
  pastPaperMatchesMyanmarPaper,
  pastPaperMatchesAllPracticeSet,
  pastPaperMatchesPracticeSet,
  isEndorsementPaper,
  syllabusHasAwardLevel,
  syllabusNeedsMathsRoute,
  toCambridgePaperId,
  type AwardLevel,
  type ExamBoardFilter,
  type PaperPreferences,
} from '@/lib/exam-papers/myanmar-papers';

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
  title: string;
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
  target_series: string | null;
  target_grade: string | null;
  tier: string | null;
  award_level: AwardLevel | null;
  paper_preferences: PaperPreferences | null;
}

export interface TopicWithProgress {
  id: string;
  subject_id: string;
  name: string;
  description: string | null;
  order_index: number | null;
  subtopics_count: number | null;
  subtopics: string | null;
  difficulty_level: string | null;
  estimated_hours: number | null;
  status: string;
  last_studied_at: Date | null;
  completed_at: Date | null;
  completed_subtopics: string | null;
  notes: string | null;
}

// ── getPaperGridData types ─────────────────────────────────────────────────────

export interface HubSubject extends SubjectWithProgress {
  curriculum_name: string;
  curriculum_code: string;
  enrollmentId: string;
  countdown_mode: string | null;
  nextExamDate: Date | null;
  nextExamTitle: string | null;
}

export interface PaperGridSession {
  year: number;
  series: string;
  label: string; // e.g. "May/Jun 2023"
}

export interface PaperGridRow {
  paperId: string;
  paperNumber: string;
  variant: string | null;
  displayLabel: string;
  title: string | null;
  totalMarks: number | null;
  durationMinutes: number | null;
  examBoard: string;
  qualification: string;
  /** keyed by `${year}-${series}` */
  cells: Record<string, PaperGridCell>;
  isMyanmarDefault?: boolean;
  isRequired?: boolean;
  rowKey?: string;
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
  gradeBoundaries: { grade: string; min_mark: number; max_mark: number | null; ums_min: number | null; ums_max: number | null }[];
}

export interface SubjectProgressSummary {
  requiredTotal: number;
  requiredDone: number;
  compositeGrade: string | null;
  compositeIsOfficial: boolean;
  compositeMessage?: string;
  latestSeriesLabel: string | null;
}

export interface PaperGridData {
  sessions: PaperGridSession[];   // columns, newest first
  rows: PaperGridRow[];           // paper unit rows
  isIAL: boolean;
  subjectCode?: string;
  board?: ExamBoardFilter | null;
  progress?: SubjectProgressSummary;
  awardLevel?: AwardLevel | null;
  paperPreferences?: PaperPreferences | null;
  tier?: SubjectTier | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. getCurriculums — list all 4 boards with subject count + enrollment status
// ──────────────────────────────────────────────────────────────────────────────

export async function getCurriculums(userId: string): Promise<CurriculumWithStats[]> {
  try {
    const db = getDb();

    const [allCurriculums, subjectCountRows, enrolledCurriculumIds] = await Promise.all([
      db.query.curriculums.findMany({
        columns: {
          id: true,
          name: true,
          code: true,
          description: true,
          icon_url: true,
          created_at: true,
        },
        orderBy: [asc(curriculums.name)],
      }),
      db
        .select({ curriculumId: subjects.curriculum_id, n: count() })
        .from(subjects)
        .groupBy(subjects.curriculum_id),
      db.query.userCurriculums
        .findMany({ where: eq(userCurriculums.user_id, userId), columns: { curriculum_id: true } })
        .then((rows) => new Set(rows.map((r) => r.curriculum_id))),
    ]);

    const subjectCountMap = new Map(
      subjectCountRows.map((row) => [row.curriculumId, Number(row.n)])
    );

    return allCurriculums.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      description: c.description,
      icon_url: c.icon_url,
      created_at: c.created_at,
      subjectCount: subjectCountMap.get(c.id) ?? 0,
      isEnrolled: enrolledCurriculumIds.has(c.id),
    }));
  } catch (err) {
    console.error('[curriculum] getCurriculums error:', err);
    return [];
  }
}

async function subjectStatCounts(userId: string, subjectIds: string[]) {
  const empty = {
    topicCount: new Map<string, number>(),
    topicDone: new Map<string, number>(),
    paperCount: new Map<string, number>(),
    paperDone: new Map<string, number>(),
  };
  if (subjectIds.length === 0) return empty;

  const db = getDb();
  const [topicRows, topicDoneRows, paperRows, paperDoneRows] = await Promise.all([
    db
      .select({ subjectId: topics.subject_id, n: count() })
      .from(topics)
      .where(inArray(topics.subject_id, subjectIds))
      .groupBy(topics.subject_id),
    db
      .select({ subjectId: topics.subject_id, n: count() })
      .from(topicProgress)
      .innerJoin(topics, eq(topicProgress.topic_id, topics.id))
      .where(
        and(
          eq(topicProgress.user_id, userId),
          eq(topicProgress.status, 'completed'),
          inArray(topics.subject_id, subjectIds)
        )
      )
      .groupBy(topics.subject_id),
    db
      .select({ subjectId: pastPapers.subject_id, n: count() })
      .from(pastPapers)
      .where(inArray(pastPapers.subject_id, subjectIds))
      .groupBy(pastPapers.subject_id),
    db
      .select({ subjectId: pastPapers.subject_id, n: count() })
      .from(userPastPaperRecords)
      .innerJoin(pastPapers, eq(userPastPaperRecords.past_paper_id, pastPapers.id))
      .where(
        and(
          eq(userPastPaperRecords.user_id, userId),
          eq(userPastPaperRecords.status, 'done'),
          inArray(pastPapers.subject_id, subjectIds)
        )
      )
      .groupBy(pastPapers.subject_id),
  ]);

  const toMap = (rows: { subjectId: string | null; n: number }[]) => {
    const map = new Map<string, number>();
    for (const row of rows) {
      if (row.subjectId) map.set(row.subjectId, Number(row.n));
    }
    return map;
  };

  return {
    topicCount: toMap(topicRows),
    topicDone: toMap(topicDoneRows),
    paperCount: toMap(paperRows),
    paperDone: toMap(paperDoneRows),
  };
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

    const [allSubjects, userEnrollRows] = await Promise.all([
      db.query.subjects.findMany({
        where: eq(subjects.curriculum_id, curriculumId),
        columns: {
          id: true,
          curriculum_id: true,
          name: true,
          code: true,
          description: true,
          icon_url: true,
          color_code: true,
          created_at: true,
        },
        orderBy: [asc(subjects.name)],
      }),
      db.query.userEnrollments.findMany({
        where: and(eq(userEnrollments.user_id, userId), eq(userEnrollments.curriculum_id, curriculumId)),
        columns: {
          subject_id: true,
          target_series: true,
          target_grade: true,
          tier: true,
          award_level: true,
          paper_preferences: true,
        },
      }),
    ]);

    const enrolledBySubject = new Map(userEnrollRows.map((r) => [r.subject_id, r]));
    const stats = await subjectStatCounts(
      userId,
      allSubjects.map((s) => s.id)
    );

    return allSubjects.map((s) => {
      const enroll = enrolledBySubject.get(s.id);
      return {
        id: s.id,
        curriculum_id: s.curriculum_id,
        name: s.name,
        title: s.name,
        code: s.code,
        description: s.description,
        icon_url: s.icon_url,
        color_code: s.color_code,
        created_at: s.created_at,
        topicCount: stats.topicCount.get(s.id) ?? 0,
        completedTopics: stats.topicDone.get(s.id) ?? 0,
        paperCount: stats.paperCount.get(s.id) ?? 0,
        completedPapers: stats.paperDone.get(s.id) ?? 0,
        isEnrolled: Boolean(enroll),
        target_series: enroll?.target_series ?? null,
        target_grade: enroll?.target_grade ?? null,
        tier: enroll?.tier ?? null,
        award_level: (enroll?.award_level as AwardLevel | null) ?? null,
        paper_preferences: (enroll?.paper_preferences as PaperPreferences | null) ?? null,
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
        subtopics: t.subtopics,
        difficulty_level: t.difficulty_level,
        estimated_hours: t.estimated_hours,
        status: prog?.status ?? 'not_started',
        last_studied_at: prog?.last_studied_at ?? null,
        completed_at: prog?.completed_at ?? null,
        completed_subtopics: prog?.completed_subtopics ?? null,
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
  yearTo?: number,
  tier?: SubjectTier | null
): Promise<PaperGridData> {
  try {
    const db = getDb();

    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, subjectId),
      with: { curriculum: true },
    });
    const subjectCode = subject?.code ?? '';
    const board = boardFromCurriculumCode(subject?.curriculum?.code);

    const enroll = await db.query.userEnrollments.findFirst({
      where: and(eq(userEnrollments.user_id, userId), eq(userEnrollments.subject_id, subjectId)),
      columns: { tier: true, award_level: true, paper_preferences: true },
    });
    const effectiveTier = (tier ?? (enroll?.tier as SubjectTier | null) ?? null) as SubjectTier | null;
    const awardLevel = (enroll?.award_level as AwardLevel | null) ?? null;
    const routePrefs = (enroll?.paper_preferences as PaperPreferences | null) ?? null;

    const allPapersRaw = await db.query.pastPapers.findMany({
      where: eq(pastPapers.subject_id, subjectId),
      with: { gradeBoundaries: true },
      orderBy: [asc(pastPapers.paper_number), asc(pastPapers.variant)],
    });

    let allPapers = allPapersRaw.filter((p) => !isEndorsementPaper(subjectCode, p.paper_number));
    if (board && subjectCode) {
      allPapers = allPapers.filter((p) =>
        pastPaperMatchesAllPracticeSet(p.paper_number, p.variant, subjectCode, board, {
          awardLevel,
          routePrefs,
          tier: effectiveTier,
        })
      );
    }
    if (effectiveTier && (syllabusHasTiers(subjectCode) || subjectCode === '4MA1')) {
      allPapers = allPapers.filter((p) =>
        examPaperMatchesTier(
          board === 'CAIE_IGCSE' || board === 'CAIE_ALEVEL'
            ? toCambridgePaperId(p.paper_number, p.variant)
            : p.paper_number,
          subjectCode,
          effectiveTier
        )
      );
    }

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
        const isMyanmarDefault =
          board && subjectCode
            ? pastPaperMatchesMyanmarPaper(p.paper_number, p.variant, subjectCode, board, {
                awardLevel,
                routePrefs,
                tier: effectiveTier,
              })
            : false;
        const isRequired =
          board && subjectCode
            ? isRequiredPaperRow(p.paper_number, p.variant, subjectCode, board, {
                awardLevel,
                routePrefs,
                tier: effectiveTier,
              })
            : false;
        rowMap.set(rowKey, {
          paperId: p.id,
          paperNumber: p.paper_number,
          variant: p.variant,
          displayLabel: formatPaperRowLabel(p.paper_number, p.variant, board),
          title: p.title,
          totalMarks: p.total_marks,
          durationMinutes: p.duration_minutes,
          examBoard: p.exam_board,
          qualification: p.qualification,
          cells: {},
          isMyanmarDefault,
          isRequired,
          rowKey,
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
        gradeBoundaries: (p.gradeBoundaries ?? []).map((b) => ({
          grade: b.grade,
          min_mark: b.min_mark,
          max_mark: b.max_mark,
          ums_min: b.ums_min,
          ums_max: b.ums_max,
        })),
      };
    }

    const rows = [...rowMap.values()]
      .filter((row) => Object.keys(row.cells).length > 0)
      .sort((a, b) =>
        a.displayLabel.localeCompare(b.displayLabel, undefined, { numeric: true })
      );

    const requiredRows = rows.filter((r) => r.isRequired);
    let requiredDone = 0;
    for (const row of requiredRows) {
      const anyDone = Object.values(row.cells).some((c) => c.status === 'done');
      if (anyDone) requiredDone += 1;
    }

    let progress: SubjectProgressSummary = {
      requiredTotal: requiredRows.length,
      requiredDone,
      compositeGrade: null,
      compositeIsOfficial: false,
      latestSeriesLabel: sessions[0]?.label ?? null,
    };

    if (sessions.length > 0 && board && subjectCode) {
      const latest = sessions[0];
      const paperInputs = rows.flatMap((row) => {
        const key = `${latest.year}-${latest.series}`;
        const cell = row.cells[key];
        if (!cell) return [];
        return [
          {
            paperNumber: row.paperNumber,
            variant: row.variant,
            rawScore: cell.rawScore,
            maxScore: cell.maxScore ?? row.totalMarks,
            year: latest.year,
            series: latest.series,
          },
        ];
      });

      const compositeRows = await db.query.subjectGradeBoundaries.findMany({
        where: and(
          eq(subjectGradeBoundaries.subject_id, subjectId),
          eq(subjectGradeBoundaries.year, latest.year),
          eq(subjectGradeBoundaries.series, latest.series)
        ),
      });

      const boundaries = compositeRows.map((b) => ({
        grade: b.grade,
        min_mark: b.min_mark,
        max_mark: b.max_mark ?? undefined,
      }));

      const gradeResult = computeSubjectGrade({
        subjectCode,
        board,
        curriculumCode: subject?.curriculum?.code,
        awardLevel,
        routePrefs,
        tier: effectiveTier,
        seriesYear: latest.year,
        seriesName: latest.series,
        papers: paperInputs,
        compositeBoundaries: boundaries,
        hasBoundaryData: boundaries.length > 0,
      });

      progress = {
        ...progress,
        compositeGrade: gradeResult.grade,
        compositeIsOfficial: gradeResult.isOfficial,
        compositeMessage: gradeResult.message,
      };
    }

    return {
      sessions,
      rows,
      isIAL,
      subjectCode,
      board,
      progress,
      awardLevel,
      paperPreferences: routePrefs,
      tier: effectiveTier,
    };
  } catch (err) {
    console.error('[curriculum] getPaperGridData error:', err);
    return { sessions: [], rows: [], isIAL: false };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. enrollInSubject / unenrollFromSubject
// ──────────────────────────────────────────────────────────────────────────────

export type EnrollmentSettingsPatch = {
  targetSeries?: string;
  tier?: SubjectTier | null;
  targetGrade?: string | null;
  awardLevel?: AwardLevel | null;
  paperPreferences?: PaperPreferences | null;
};

function defaultAwardLevel(curriculumCode: string, subjectCode: string): AwardLevel | null {
  if (syllabusHasAwardLevel(subjectCode) || curriculumCode === 'CAIE_ALEVEL') return 'A Level';
  return null;
}

function defaultPaperPreferences(subjectCode: string): PaperPreferences | null {
  if (syllabusNeedsMathsRoute(subjectCode)) return { mathsRoute: '42' };
  return null;
}

export async function enrollInSubject(
  userId: string,
  curriculumId: string,
  subjectId: string,
  options?: EnrollmentSettingsPatch
) {
  try {
    const db = getDb();
    const curriculum = await db.query.curriculums.findFirst({
      where: eq(curriculums.id, curriculumId),
    });
    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, subjectId),
    });
    if (!curriculum || !subject) {
      return { success: false, error: 'Subject not found' };
    }

    const plugin = getPluginForCurriculumCode(curriculum.code);
    const targetSeries = options?.targetSeries || (await getDefaultExamSession(userId));
    const defaultTier: SubjectTier | null =
      plugin.hasTiers && (syllabusHasTiers(subject.code) || subject.code === '4MA1')
        ? (options?.tier ?? 'extended')
        : (options?.tier ?? null);
    const awardLevel =
      options?.awardLevel ?? defaultAwardLevel(curriculum.code, subject.code);
    const paperPreferences =
      options?.paperPreferences ?? defaultPaperPreferences(subject.code);

    const existingCurr = await db.query.userCurriculums.findFirst({
      where: and(eq(userCurriculums.user_id, userId), eq(userCurriculums.curriculum_id, curriculumId)),
    });
    if (!existingCurr) {
      await db.insert(userCurriculums).values({ user_id: userId, curriculum_id: curriculumId });
    }

    const existingEnroll = await db.query.userEnrollments.findFirst({
      where: and(eq(userEnrollments.user_id, userId), eq(userEnrollments.subject_id, subjectId)),
    });
    if (!existingEnroll) {
      await db.insert(userEnrollments).values({
        user_id: userId,
        curriculum_id: curriculumId,
        subject_id: subjectId,
        target_series: targetSeries,
        target_grade: options?.targetGrade ?? null,
        tier: defaultTier,
        award_level: awardLevel,
        paper_preferences: paperPreferences,
        countdown_mode: plugin.countdownMode,
      });
    } else {
      await db
        .update(userEnrollments)
        .set({
          target_series: existingEnroll.target_series ?? targetSeries,
          tier: existingEnroll.tier ?? defaultTier,
          award_level: existingEnroll.award_level ?? awardLevel,
          paper_preferences: existingEnroll.paper_preferences ?? paperPreferences,
          countdown_mode: plugin.countdownMode,
        })
        .where(eq(userEnrollments.id, existingEnroll.id));
    }

    await syncEnrollmentCountdowns({
      userId,
      subjectId,
      curriculumId,
      targetSeries: existingEnroll?.target_series || targetSeries,
      tier: (existingEnroll?.tier as SubjectTier | null) ?? defaultTier,
      targetGrade: existingEnroll?.target_grade ?? options?.targetGrade ?? null,
      awardLevel: (existingEnroll?.award_level as AwardLevel | null) ?? awardLevel,
      paperPreferences: (existingEnroll?.paper_preferences as PaperPreferences | null) ?? paperPreferences,
    });

    return { success: true };
  } catch (err: any) {
    console.error('[curriculum] enrollInSubject error:', err);
    return { success: false, error: err.message };
  }
}

export async function unenrollFromSubject(userId: string, subjectId: string) {
  try {
    const db = getDb();
    await removeAutoCountdownsForSubject(userId, subjectId);
    await db
      .delete(userEnrollments)
      .where(and(eq(userEnrollments.user_id, userId), eq(userEnrollments.subject_id, subjectId)));
    return { success: true };
  } catch (err: any) {
    console.error('[curriculum] unenrollFromSubject error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateEnrollmentSettings(
  userId: string,
  subjectId: string,
  patch: EnrollmentSettingsPatch
) {
  try {
    const db = getDb();
    const existing = await db.query.userEnrollments.findFirst({
      where: and(eq(userEnrollments.user_id, userId), eq(userEnrollments.subject_id, subjectId)),
    });
    if (!existing) return { success: false, error: 'Not enrolled' };

    const nextSeries = patch.targetSeries ?? existing.target_series;
    const nextTier = patch.tier !== undefined ? patch.tier : (existing.tier as SubjectTier | null);
    const nextGrade = patch.targetGrade !== undefined ? patch.targetGrade : existing.target_grade;
    const nextAward =
      patch.awardLevel !== undefined ? patch.awardLevel : (existing.award_level as AwardLevel | null);
    const nextPrefs =
      patch.paperPreferences !== undefined
        ? { ...(existing.paper_preferences as PaperPreferences | null), ...patch.paperPreferences }
        : (existing.paper_preferences as PaperPreferences | null);

    await db
      .update(userEnrollments)
      .set({
        target_series: nextSeries,
        tier: nextTier,
        target_grade: nextGrade,
        award_level: nextAward,
        paper_preferences: nextPrefs,
      })
      .where(eq(userEnrollments.id, existing.id));

    if (patch.targetGrade !== undefined) {
      const autoCds = await db.query.examCountdowns.findMany({
        where: and(eq(examCountdowns.user_id, userId), eq(examCountdowns.subject_id, subjectId)),
      });
      for (const cd of autoCds) {
        if (cd.is_custom) continue;
        await db.update(examCountdowns).set({ target_grade: nextGrade }).where(eq(examCountdowns.id, cd.id));
      }
    }

    if (
      patch.targetSeries !== undefined ||
      patch.tier !== undefined ||
      patch.awardLevel !== undefined ||
      patch.paperPreferences !== undefined
    ) {
      await syncEnrollmentCountdowns({
        userId,
        subjectId,
        curriculumId: existing.curriculum_id,
        targetSeries: nextSeries || (await getDefaultExamSession(userId)),
        tier: nextTier,
        targetGrade: nextGrade,
        awardLevel: nextAward,
        paperPreferences: nextPrefs,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('[curriculum] updateEnrollmentSettings error:', err);
    return { success: false, error: err.message };
  }
}

export interface SubjectCalculatorContext {
  subjectId: string;
  subjectCode: string;
  curriculumCode: string;
  awardLevel: AwardLevel | null;
  tier: SubjectTier | null;
  paperPreferences: PaperPreferences | null;
  targetSeries: string | null;
  routeKey: string | null;
  hasOfficialBoundaries: boolean;
}

export async function enrollCashInAward(
  userId: string,
  cashInCode: string,
  awardLevel: AwardLevel,
  selectedUnits: string[]
) {
  try {
    const db = getDb();
    const { IAL_CASH_INS } = await import('@/lib/grading/ial-cash-in');
    const award = IAL_CASH_INS[cashInCode as keyof typeof IAL_CASH_INS];
    if (!award) return { success: false, error: 'Unknown cash-in code' };

    const allUnits = [...new Set([...award.compulsory, ...selectedUnits])];
    const unitSubjects = await db.query.subjects.findMany({
      where: inArray(subjects.code, allUnits),
      columns: { id: true, code: true, curriculum_id: true },
    });

    const existing = await db.query.userCashInEnrollments.findFirst({
      where: and(
        eq(userCashInEnrollments.user_id, userId),
        eq(userCashInEnrollments.cash_in_code, cashInCode)
      ),
    });

    const appliedPair =
      selectedUnits.length >= 2 ? ([selectedUnits[0], selectedUnits[1]] as [string, string]) : null;

    if (existing) {
      await db
        .update(userCashInEnrollments)
        .set({ selected_units: allUnits, applied_pair: appliedPair, award_level: awardLevel })
        .where(eq(userCashInEnrollments.id, existing.id));
    } else {
      await db.insert(userCashInEnrollments).values({
        user_id: userId,
        cash_in_code: cashInCode,
        award_level: awardLevel,
        selected_units: allUnits,
        applied_pair: appliedPair,
      });
    }

    for (const unit of unitSubjects) {
      await enrollInSubject(userId, unit.curriculum_id!, unit.id, {
        awardLevel,
        paperPreferences: { appliedUnits: allUnits },
      });
    }

    return { success: true, units: allUnits };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Enrollment failed';
    console.error('[curriculum] enrollCashInAward error:', err);
    return { success: false, error: message };
  }
}

export async function getSubjectCalculatorContext(
  userId: string,
  subjectId: string
): Promise<SubjectCalculatorContext | null> {
  try {
    const db = getDb();
    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, subjectId),
      with: { curriculum: true },
    });
    if (!subject) return null;

    const [enroll, selection, boundarySample, compositeSample] = await Promise.all([
      db.query.userEnrollments.findFirst({
        where: and(eq(userEnrollments.user_id, userId), eq(userEnrollments.subject_id, subjectId)),
      }),
      db.query.userComponentSelections.findFirst({
        where: and(
          eq(userComponentSelections.user_id, userId),
          eq(userComponentSelections.subject_id, subjectId)
        ),
      }),
      db.query.pastPapers.findFirst({
        where: eq(pastPapers.subject_id, subjectId),
        with: { gradeBoundaries: true },
      }),
      db.query.subjectGradeBoundaries.findFirst({
        where: eq(subjectGradeBoundaries.subject_id, subjectId),
      }),
    ]);

    const curriculumCode = subject.curriculum?.code ?? '';

    return {
      subjectId,
      subjectCode: subject.code,
      curriculumCode,
      awardLevel: (enroll?.award_level as AwardLevel | null) ?? null,
      tier: (enroll?.tier as SubjectTier | null) ?? null,
      paperPreferences:
        (selection?.paper_preferences as PaperPreferences | null) ??
        (enroll?.paper_preferences as PaperPreferences | null) ??
        defaultPaperPreferences(subject.code),
      targetSeries: enroll?.target_series ?? null,
      routeKey: selection?.route_key ?? null,
      hasOfficialBoundaries:
        Boolean(boundarySample?.gradeBoundaries?.length) || Boolean(compositeSample),
    };
  } catch (err) {
    console.error('[curriculum] getSubjectCalculatorContext error:', err);
    return null;
  }
}

export async function getMySubjectsHub(userId: string): Promise<{
  subjects: HubSubject[];
  defaultExamSeries: string;
}> {
  try {
    const db = getDb();
    const [enrollments, defaultExamSeries] = await Promise.all([
      db.query.userEnrollments.findMany({
        where: eq(userEnrollments.user_id, userId),
        columns: {
          id: true,
          subject_id: true,
          curriculum_id: true,
          target_series: true,
          target_grade: true,
          tier: true,
          award_level: true,
          paper_preferences: true,
          countdown_mode: true,
        },
        with: {
          subject: {
            columns: {
              id: true,
              name: true,
              code: true,
              description: true,
              icon_url: true,
              color_code: true,
              created_at: true,
            },
          },
          curriculum: { columns: { id: true, name: true, code: true } },
        },
      }),
      getDefaultExamSession(userId),
    ]);

    if (enrollments.length === 0) {
      return { subjects: [], defaultExamSeries };
    }

    const subjectIds = enrollments.map((e) => e.subject_id);

    const [stats, countdownRows] = await Promise.all([
      subjectStatCounts(userId, subjectIds),
      db.query.examCountdowns.findMany({
        where: eq(examCountdowns.user_id, userId),
        columns: { subject_id: true, exam_date: true, title: true },
        orderBy: [asc(examCountdowns.exam_date)],
      }),
    ]);

    const nextBySubject = new Map<string, { date: Date; title: string }>();
    const now = Date.now();
    for (const cd of countdownRows) {
      if (!cd.subject_id || !cd.exam_date) continue;
      const t = new Date(cd.exam_date).getTime();
      if (t < now) continue;
      const existing = nextBySubject.get(cd.subject_id);
      if (!existing || t < existing.date.getTime()) {
        nextBySubject.set(cd.subject_id, { date: new Date(cd.exam_date), title: cd.title });
      }
    }

    const hub: HubSubject[] = enrollments.map((e) => {
      const subj = e.subject;
      const curr = e.curriculum;
      return {
        id: e.subject_id,
        curriculum_id: e.curriculum_id,
        name: subj?.name ?? 'Subject',
        title: subj?.name ?? 'Subject',
        code: subj?.code ?? '',
        description: subj?.description ?? null,
        icon_url: subj?.icon_url ?? null,
        color_code: subj?.color_code ?? null,
        created_at: subj?.created_at ?? null,
        topicCount: stats.topicCount.get(e.subject_id) ?? 0,
        completedTopics: stats.topicDone.get(e.subject_id) ?? 0,
        paperCount: stats.paperCount.get(e.subject_id) ?? 0,
        completedPapers: stats.paperDone.get(e.subject_id) ?? 0,
        isEnrolled: true,
        target_series: e.target_series ?? defaultExamSeries,
        target_grade: e.target_grade ?? null,
        tier: e.tier ?? null,
        award_level: (e.award_level as AwardLevel | null) ?? null,
        paper_preferences: (e.paper_preferences as PaperPreferences | null) ?? null,
        curriculum_name: curr?.name ?? '',
        curriculum_code: curr?.code ?? '',
        enrollmentId: e.id,
        countdown_mode: e.countdown_mode ?? getPluginForCurriculumCode(curr?.code).countdownMode,
        nextExamDate: nextBySubject.get(e.subject_id)?.date ?? null,
        nextExamTitle: nextBySubject.get(e.subject_id)?.title ?? null,
      };
    });

    hub.sort((a, b) => a.name.localeCompare(b.name));
    return { subjects: hub, defaultExamSeries };
  } catch (err) {
    console.error('[curriculum] getMySubjectsHub error:', err);
    return { subjects: [], defaultExamSeries: 'May/June 2026' };
  }
}

const compositeBoundariesCache = new Map<string, { data: any[]; expiresAt: number }>();

export async function listSubjectCompositeBoundaries(
  subjectId: string,
  year: number,
  series: string,
  opts?: { variant?: string | null; tier?: string | null }
) {
  const cacheKey = `${subjectId}:${year}:${series}:${opts?.variant ?? ''}:${opts?.tier ?? ''}`;
  const hit = compositeBoundariesCache.get(cacheKey);
  if (hit && Date.now() < hit.expiresAt) {
    return hit.data;
  }

  try {
    const db = getDb();
    const rows = await db.query.subjectGradeBoundaries.findMany({
      where: and(
        eq(subjectGradeBoundaries.subject_id, subjectId),
        eq(subjectGradeBoundaries.year, year),
        eq(subjectGradeBoundaries.series, series)
      ),
    });
    const result = rows.filter((r) => {
      if (opts?.tier && r.tier && r.tier !== opts.tier) return false;
      if (opts?.variant && r.variant && r.variant !== opts.variant) return false;
      return true;
    });
    compositeBoundariesCache.set(cacheKey, { data: result, expiresAt: Date.now() + 15 * 60 * 1000 });
    return result;
  } catch (err) {
    console.error('[curriculum] listSubjectCompositeBoundaries error:', err);
    return [];
  }
}

export async function listUserEnrollments(userId: string) {
  const db = getDb();
  return db.query.userEnrollments.findMany({
    where: eq(userEnrollments.user_id, userId),
    columns: {
      id: true,
      user_id: true,
      curriculum_id: true,
      subject_id: true,
      exam_id: true,
      target_series: true,
      target_grade: true,
      tier: true,
      award_level: true,
      paper_preferences: true,
      countdown_mode: true,
      enrolled_at: true,
    },
    with: {
      subject: { columns: { id: true, name: true, curriculum_id: true } },
      curriculum: { columns: { id: true, name: true, code: true } },
    },
  });
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

export async function toggleSubtopicProgress(
  userId: string,
  topicId: string,
  subtopicName: string,
  isCompleted: boolean,
  totalSubtopics: number
) {
  try {
    const db = getDb();
    const now = new Date();

    const existing = await db.query.topicProgress.findFirst({
      where: and(eq(topicProgress.user_id, userId), eq(topicProgress.topic_id, topicId)),
    });

    let completed: string[] = [];
    try {
      if (existing?.completed_subtopics) {
        completed = JSON.parse(existing.completed_subtopics);
      }
    } catch (e) {
      completed = [];
    }
    
    if (isCompleted) {
      if (!completed.includes(subtopicName)) completed.push(subtopicName);
    } else {
      completed = completed.filter((s: string) => s !== subtopicName);
    }
    
    const newStatus = completed.length === totalSubtopics && totalSubtopics > 0 
      ? 'completed' 
      : (completed.length > 0 ? 'in_progress' : 'not_started');
      
    const completedStr = JSON.stringify(completed);

    if (existing) {
      await db
        .update(topicProgress)
        .set({
          completed_subtopics: completedStr,
          status: newStatus,
          last_studied_at: now,
          completed_at: newStatus === 'completed' ? existing.completed_at || now : null,
        })
        .where(eq(topicProgress.id, existing.id));
    } else {
      await db.insert(topicProgress).values({
        user_id: userId,
        topic_id: topicId,
        status: newStatus,
        completed_subtopics: completedStr,
        last_studied_at: now,
        completed_at: newStatus === 'completed' ? now : null,
      });
    }

    return { success: true, newStatus };
  } catch (err: any) {
    console.error('[curriculum] toggleSubtopicProgress error:', err);
    return { success: false, error: err.message };
  }
}

