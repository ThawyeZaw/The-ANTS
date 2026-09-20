import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, desc, gte, type SQL } from 'drizzle-orm';
import { createDb, exams, examCountdowns, gradeEntries, subjects, curriculums } from '@the-ants/db';
import { remember } from '../lib/memory-cache';
import { examRowMatchesMyanmar } from '@the-ants/shared-types';

function toIso(value: Date | number | string | null | undefined): string | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function examSeriesLabel(exam: { season?: string | null; series?: string | null }) {
  const series = exam.series?.trim() ?? '';
  const compact = series.match(/^([swmj])(\d{2})$/i);
  if (compact) {
    const letter = compact[1]!.toLowerCase();
    const yy = Number(compact[2]);
    const year = yy >= 50 ? 1900 + yy : 2000 + yy;
    const season =
      letter === 's' ? 'May/June' : letter === 'w' ? 'Oct/Nov' : letter === 'm' ? 'Feb/March' : 'Jan';
    return `${season} ${year}`;
  }
  const parts = [exam.season, exam.series].filter((part): part is string => Boolean(part && part.trim()));
  return parts.length > 0 ? parts.join(' ') : null;
}

function serializeExam(exam: Record<string, unknown>) {
  const subject = exam.subject as { id?: string; name?: string; code?: string; curriculum_id?: string } | null;
  const curriculum = exam.curriculum as { id?: string; name?: string; code?: string } | null;
  const season = (exam.season as string | null) ?? null;
  const series = (exam.series as string | null) ?? null;
  return {
    ...exam,
    exam_date: toIso(exam.exam_date as Date | number | string | null),
    created_at: toIso(exam.created_at as Date | number | string | null),
    exam_series: examSeriesLabel({ season, series }),
    paper_code: (exam.paper_number as string | null) ?? (exam.paper_code as string | null) ?? null,
    qualification: (exam.qualification_type as string | null) ?? (exam.qualification as string | null) ?? null,
    date_type: exam.exam_date ? 'fixed' : 'custom',
    subject_name: subject?.name ?? null,
    curriculum_name: curriculum?.name ?? null,
    curriculum_code: curriculum?.code ?? null,
  };
}

function serializeCountdown(row: Record<string, unknown>) {
  const iso = toIso(row.exam_date as Date | number | string | null);
  const subject = row.subject as { id?: string; name?: string; curriculum_id?: string } | null;
  return {
    ...row,
    exam_date: iso,
    target_date: iso,
    custom_title: (row.title as string | null) ?? null,
    is_custom: Boolean(row.is_custom),
    is_pinned: Boolean(row.is_pinned),
    is_mock: Boolean(row.is_mock),
    subject_name: subject?.name ?? null,
    curriculum_id: subject?.curriculum_id ?? null,
  };
}

export function createExamRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // Upcoming catalog by default. Pass all=1 only when a full history list is required.
  router.get('/', async (c) => {
    try {
      const db = getDb();
      const subjectId = c.req.query('subjectId');
      const curriculumId = c.req.query('curriculumId');
      const board = c.req.query('board');
      const includeAll = c.req.query('all') === '1';
      const myanmarOnly = c.req.query('myanmar') !== '0';

      const conditions: SQL[] = [];
      if (!includeAll) {
        conditions.push(gte(exams.exam_date, new Date(Date.now() - 12 * 60 * 60 * 1000)));
      }
      if (subjectId) conditions.push(eq(exams.subject_id, subjectId));
      if (curriculumId) conditions.push(eq(exams.curriculum_id, curriculumId));
      if (board) conditions.push(eq(exams.exam_board, board));

      const cacheKey = `exams:${includeAll ? 'all' : 'upcoming'}:${myanmarOnly ? 'mm' : 'allvar'}:${subjectId || ''}:${curriculumId || ''}:${board || ''}`;
      const payload = await remember(cacheKey, 60_000, async () => {
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
            subject_name: subjects.name,
            subject_code: subjects.code,
            curriculum_name: curriculums.name,
            curriculum_code: curriculums.code,
          })
          .from(exams)
          .leftJoin(subjects, eq(exams.subject_id, subjects.id))
          .leftJoin(curriculums, eq(exams.curriculum_id, curriculums.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(exams.exam_date));

        const myanmarRows = myanmarOnly
          ? rows.filter((row) =>
              examRowMatchesMyanmar({
                paper_number: row.paper_number,
                syllabus_code: row.syllabus_code ?? row.subject_code,
                season: row.season,
                series: row.series,
                curriculum_code: row.curriculum_code,
                exam_board: row.exam_board,
                subject_code: row.subject_code,
              })
            )
          : rows;
        const examsOut = myanmarRows.map((row) => serializeExam(row as Record<string, unknown>));

        return {
          success: true as const,
          exams: examsOut,
        };
      });

      c.header('Cache-Control', 'public, max-age=60');
      return c.json(payload);
    } catch (err) {
      console.error('[exams] list failed', err);
      return c.json({ error: 'Failed to load exams' }, 500);
    }
  });

  // 2. Get user exam countdowns
  router.get('/countdowns', async (c) => {
    try {
      const db = getDb();
      const userId = c.req.query('userId');
      const subjectId = c.req.query('subjectId');
      const curriculumId = c.req.query('curriculumId');

      if (!userId) {
        return c.json({ error: 'userId is required' }, 400);
      }

      const conditions: SQL[] = [eq(examCountdowns.user_id, userId)];
      if (subjectId) conditions.push(eq(examCountdowns.subject_id, subjectId));
      if (curriculumId) conditions.push(eq(subjects.curriculum_id, curriculumId));

      const rows = curriculumId
        ? await db
            .select({
              countdown: examCountdowns,
              subject_name: subjects.name,
              curriculum_id: subjects.curriculum_id,
            })
            .from(examCountdowns)
            .leftJoin(subjects, eq(examCountdowns.subject_id, subjects.id))
            .where(and(...conditions))
            .orderBy(examCountdowns.exam_date)
        : await db
            .select()
            .from(examCountdowns)
            .where(and(...conditions))
            .orderBy(examCountdowns.exam_date);

      const countdowns = rows.map((row) => {
        if ('countdown' in row) {
          return serializeCountdown({
            ...row.countdown,
            subject_name: row.subject_name,
            curriculum_id: row.curriculum_id,
          } as Record<string, unknown>);
        }
        return serializeCountdown(row as Record<string, unknown>);
      });

      return c.json({ success: true, countdowns });
    } catch (err) {
      console.error('[exams] list countdowns failed', err);
      return c.json({ error: 'Failed to load countdowns' }, 500);
    }
  });

  // 3. Create countdown
  router.post('/countdowns', async (c) => {
    try {
      const db = getDb();
      const raw = await c.req.json();
      const body = {
        ...raw,
        userId: raw.userId ?? raw.user_id,
        title: raw.title ?? raw.customTitle ?? raw.custom_title,
        examDate: raw.examDate ?? raw.targetDate ?? raw.target_date,
        examId: raw.examId ?? raw.exam_id,
        subjectId: raw.subjectId ?? raw.subject_id,
        examBoard: raw.examBoard ?? raw.exam_board,
        paperName: raw.paperName ?? raw.paper_name,
        colorCode: raw.colorCode ?? raw.color_code,
        targetGrade: raw.targetGrade ?? raw.target_grade,
        isMock: raw.isMock ?? raw.is_mock,
        isPinned: raw.isPinned ?? raw.is_pinned,
        isCustom: raw.isCustom ?? raw.is_custom,
      };

      const CountdownSchema = z.object({
        userId: z.string().min(1),
        title: z.string().min(1),
        examDate: z.string().min(1),
        examId: z.string().nullish(),
        subjectId: z.string().nullish(),
        examBoard: z.string().nullish(),
        paperName: z.string().nullish(),
        colorCode: z.string().nullish(),
        targetGrade: z.string().nullish(),
        isMock: z.boolean().optional().default(false),
        isPinned: z.boolean().optional().default(false),
        isCustom: z.boolean().optional().default(false),
      });

      const parsed = CountdownSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
      }

      const data = parsed.data;
      let subjectId = data.subjectId;
      let examBoard = data.examBoard;
      let paperName = data.paperName;
      let title = data.title;
      let examDate = data.examDate;

      if (data.examId) {
        const official = await db.query.exams.findFirst({
          where: eq(exams.id, data.examId),
          with: { subject: { with: { curriculum: true } } },
        });
        if (official) {
          subjectId = subjectId || official.subject_id || undefined;
          examBoard = examBoard || official.exam_board || undefined;
          paperName = paperName || (official.paper_number ? `Paper ${official.paper_number}` : undefined);
          title = title || official.title;
          if (official.exam_date) {
            examDate = toIso(official.exam_date) ?? examDate;
          }
          const isCustom = data.isCustom ?? !data.examId;
          if (!isCustom) {
            const curriculumCode = official.subject?.curriculum?.code;
            const syllabusCode = official.syllabus_code || official.subject?.code;
            if (
              !examRowMatchesMyanmar({
                paper_number: official.paper_number,
                syllabus_code: syllabusCode,
                season: official.season,
                series: official.series,
                curriculum_code: curriculumCode,
                exam_board: official.exam_board,
                subject_code: official.subject?.code,
              })
            ) {
              return c.json({ error: 'That paper is not on the Myanmar timetable' }, 400);
            }
          }
        }
      }

      const [newCountdown] = await db
        .insert(examCountdowns)
        .values({
          user_id: data.userId,
          title,
          exam_date: new Date(examDate),
          exam_id: data.examId,
          subject_id: subjectId,
          exam_board: examBoard,
          paper_name: paperName,
          color_code: data.colorCode,
          target_grade: data.targetGrade,
          is_mock: data.isMock,
          is_pinned: data.isPinned,
          is_custom: data.isCustom ?? !data.examId,
        })
        .returning();

      return c.json({ success: true, countdown: serializeCountdown(newCountdown as Record<string, unknown>) }, 201);
    } catch (err) {
      console.error('[exams] create countdown failed', err);
      return c.json({ error: 'Failed to create countdown' }, 500);
    }
  });

  // 4. Delete countdown
  router.delete('/countdowns/:id', async (c) => {
    try {
      const db = getDb();
      const id = c.req.param('id');
      const userId = c.req.query('userId');

      if (!userId) {
        return c.json({ error: 'userId is required' }, 400);
      }

      const existing = await db.query.examCountdowns.findFirst({
        where: and(eq(examCountdowns.id, id), eq(examCountdowns.user_id, userId)),
      });

      if (!existing) {
        return c.json({ error: 'Countdown not found or unauthorized' }, 404);
      }

      await db.delete(examCountdowns).where(eq(examCountdowns.id, id));

      return c.json({ success: true, id });
    } catch (err) {
      console.error('[exams] delete countdown failed', err);
      return c.json({ error: 'Failed to delete countdown' }, 500);
    }
  });

  // 5. User Grade Entries
  router.get('/grades', async (c) => {
    try {
      const db = getDb();
      const userId = c.req.query('userId');

      if (!userId) {
        return c.json({ error: 'userId is required' }, 400);
      }

      const entries = await db.query.gradeEntries.findMany({
        where: eq(gradeEntries.user_id, userId),
        orderBy: [desc(gradeEntries.exam_date)],
      });

      return c.json({ success: true, grades: entries });
    } catch (err) {
      console.error('[exams] list grades failed', err);
      return c.json({ error: 'Failed to load grades' }, 500);
    }
  });

  // 6. Record Grade Entry
  router.post('/grades', async (c) => {
    try {
      const db = getDb();
      const body = await c.req.json();

      const GradeSchema = z.object({
        userId: z.string().min(1),
        subjectId: z.string().min(1),
        examId: z.string().optional(),
        score: z.number(),
        maxScore: z.number(),
        grade: z.string().optional(),
        examDate: z.string().optional(),
        notes: z.string().optional(),
      });

      const parsed = GradeSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.format() }, 400);
      }

      const { userId, subjectId, examId, score, maxScore, grade, examDate, notes } = parsed.data;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

      const [newEntry] = await db
        .insert(gradeEntries)
        .values({
          user_id: userId,
          subject_id: subjectId,
          exam_id: examId,
          score,
          max_score: maxScore,
          percentage,
          grade,
          exam_date: examDate ? new Date(examDate) : new Date(),
          notes,
        })
        .returning();

      return c.json({ success: true, entry: newEntry }, 201);
    } catch (err) {
      console.error('[exams] create grade failed', err);
      return c.json({ error: 'Failed to save grade' }, 500);
    }
  });

  return router;
}
