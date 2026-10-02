'use server';

// ──────────────────────────────────────────────────────────────────────────────
// Admin / Contributor — Past paper & grade-boundary CRUD (live D1)
// ──────────────────────────────────────────────────────────────────────────────

import {
  getDb,
  pastPapers,
  paperGradeBoundaries,
  subjectGradeBoundaries,
  examDataAuditLog,
  curriculums,
  subjects,
  profiles,
} from '@/lib/db';
import { and, asc, desc, eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth-session';

const EDITOR_ROLES = new Set(['admin', 'main_contributor', 'contributor']);

async function requireExamDataEditor(): Promise<
  | { ok: true; userId: string; name: string }
  | { ok: false; error: string }
> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: 'Unauthorized' };

  const db = getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, session.userId),
    columns: { id: true, name: true, role: true, roles: true },
  });
  if (!profile) return { ok: false, error: 'Unauthorized' };

  const roles = Array.isArray(profile.roles) ? profile.roles : [profile.role];
  const allowed = roles.some((r) => EDITOR_ROLES.has(String(r)));
  if (!allowed) return { ok: false, error: 'Forbidden — admin or contributor only' };

  return { ok: true, userId: profile.id, name: profile.name };
}

async function writeAudit(input: {
  actorUserId: string;
  actorName: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'past_paper' | 'paper_grade_boundary' | 'subject_grade_boundary';
  entityId: string;
  summary: string;
}) {
  const db = getDb();
  await db.insert(examDataAuditLog).values({
    actor_user_id: input.actorUserId,
    actor_name: input.actorName,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    summary: input.summary,
    created_at: new Date(),
  });
}

export async function adminListCurriculums() {
  const guard = await requireExamDataEditor();
  if (!guard.ok) return { success: false as const, error: guard.error, data: [] };

  const db = getDb();
  const data = await db.query.curriculums.findMany({
    columns: { id: true, name: true, code: true },
    orderBy: [asc(curriculums.name)],
  });
  return { success: true as const, data };
}

export async function adminListSubjects(curriculumId: string) {
  const guard = await requireExamDataEditor();
  if (!guard.ok) return { success: false as const, error: guard.error, data: [] };

  const db = getDb();
  const data = await db.query.subjects.findMany({
    where: eq(subjects.curriculum_id, curriculumId),
    columns: { id: true, name: true, code: true, curriculum_id: true },
    orderBy: [asc(subjects.name)],
  });
  return { success: true as const, data };
}

export async function adminListSeriesOptions(subjectId: string) {
  const guard = await requireExamDataEditor();
  if (!guard.ok) return { success: false as const, error: guard.error, data: [] as { year: number; series: string }[] };

  const db = getDb();
  const papers = await db.query.pastPapers.findMany({
    where: eq(pastPapers.subject_id, subjectId),
    columns: { year: true, series: true },
  });
  const map = new Map<string, { year: number; series: string }>();
  for (const p of papers) {
    map.set(`${p.year}|${p.series}`, { year: p.year, series: p.series });
  }
  const data = [...map.values()].sort((a, b) => b.year - a.year || a.series.localeCompare(b.series));
  return { success: true as const, data };
}

export async function adminListPapersForSeries(subjectId: string, year: number, series: string) {
  const guard = await requireExamDataEditor();
  if (!guard.ok) return { success: false as const, error: guard.error, data: [] };

  const db = getDb();
  const data = await db.query.pastPapers.findMany({
    where: and(
      eq(pastPapers.subject_id, subjectId),
      eq(pastPapers.year, year),
      eq(pastPapers.series, series)
    ),
    with: { gradeBoundaries: true },
    orderBy: [asc(pastPapers.paper_number), asc(pastPapers.variant)],
  });
  return { success: true as const, data };
}

export async function adminListSubjectBoundaries(
  subjectId: string,
  year: number,
  series: string
) {
  const guard = await requireExamDataEditor();
  if (!guard.ok) return { success: false as const, error: guard.error, data: [] };

  const db = getDb();
  const data = await db.query.subjectGradeBoundaries.findMany({
    where: and(
      eq(subjectGradeBoundaries.subject_id, subjectId),
      eq(subjectGradeBoundaries.year, year),
      eq(subjectGradeBoundaries.series, series)
    ),
    orderBy: [asc(subjectGradeBoundaries.grade)],
  });
  return { success: true as const, data };
}

export interface PastPaperUpsertInput {
  id?: string;
  exam_board: string;
  qualification: string;
  subject: string;
  syllabus_code: string;
  subject_id: string;
  curriculum_id: string;
  year: number;
  series: string;
  paper_number: string;
  variant?: string | null;
  title?: string | null;
  total_marks?: number | null;
  duration_minutes?: number | null;
}

export async function adminUpsertPastPaper(input: PastPaperUpsertInput) {
  const guard = await requireExamDataEditor();
  if (!guard.ok) return { success: false as const, error: guard.error };

  const db = getDb();
  const now = new Date();
  const id =
    input.id ||
    `pp-${input.syllabus_code}-${input.year}-${input.series.replace(/\W+/g, '').toLowerCase()}-qp-${input.paper_number}${input.variant ?? ''}-${crypto.randomUUID().slice(0, 6)}`;

  const existing = input.id
    ? await db.query.pastPapers.findFirst({ where: eq(pastPapers.id, input.id) })
    : null;

  const values = {
    exam_board: input.exam_board,
    qualification: input.qualification,
    subject: input.subject,
    syllabus_code: input.syllabus_code,
    subject_id: input.subject_id,
    curriculum_id: input.curriculum_id,
    year: input.year,
    series: input.series,
    paper_number: input.paper_number,
    variant: input.variant ?? null,
    title: input.title ?? null,
    total_marks: input.total_marks ?? null,
    duration_minutes: input.duration_minutes ?? null,
  };

  if (existing) {
    await db.update(pastPapers).set(values).where(eq(pastPapers.id, existing.id));
    await writeAudit({
      actorUserId: guard.userId,
      actorName: guard.name,
      action: 'update',
      entityType: 'past_paper',
      entityId: existing.id,
      summary: `Updated ${existing.syllabus_code} ${existing.year} ${existing.series} P${existing.paper_number}`,
    });
    return { success: true as const, id: existing.id };
  }

  await db.insert(pastPapers).values({
    id,
    ...values,
    created_at: now,
  });
  await writeAudit({
    actorUserId: guard.userId,
    actorName: guard.name,
    action: 'create',
    entityType: 'past_paper',
    entityId: id,
    summary: `Created ${input.syllabus_code} ${input.year} ${input.series} P${input.paper_number}`,
  });
  return { success: true as const, id };
}

export async function adminDeletePastPaper(paperId: string) {
  const guard = await requireExamDataEditor();
  if (!guard.ok) return { success: false as const, error: guard.error };

  const db = getDb();
  const paper = await db.query.pastPapers.findFirst({ where: eq(pastPapers.id, paperId) });
  if (!paper) return { success: false as const, error: 'Paper not found' };

  await db.delete(pastPapers).where(eq(pastPapers.id, paperId));
  await writeAudit({
    actorUserId: guard.userId,
    actorName: guard.name,
    action: 'delete',
    entityType: 'past_paper',
    entityId: paperId,
    summary: `Deleted ${paper.syllabus_code} ${paper.year} ${paper.series} P${paper.paper_number}`,
  });
  return { success: true as const };
}

export interface BoundaryUpsertInput {
  id?: string;
  past_paper_id: string;
  grade: string;
  min_mark: number;
  max_mark?: number | null;
  ums_min?: number | null;
  ums_max?: number | null;
}

export async function adminUpsertPaperBoundary(input: BoundaryUpsertInput) {
  const guard = await requireExamDataEditor();
  if (!guard.ok) return { success: false as const, error: guard.error };

  const db = getDb();
  const now = new Date();
  const id = input.id || `pgb-${input.past_paper_id}-${input.grade}-${crypto.randomUUID().slice(0, 6)}`;

  if (input.id) {
    await db
      .update(paperGradeBoundaries)
      .set({
        grade: input.grade,
        min_mark: input.min_mark,
        max_mark: input.max_mark ?? null,
        ums_min: input.ums_min ?? null,
        ums_max: input.ums_max ?? null,
      })
      .where(eq(paperGradeBoundaries.id, input.id));
    await writeAudit({
      actorUserId: guard.userId,
      actorName: guard.name,
      action: 'update',
      entityType: 'paper_grade_boundary',
      entityId: input.id,
      summary: `Updated boundary ${input.grade} on ${input.past_paper_id}`,
    });
    return { success: true as const, id: input.id };
  }

  await db.insert(paperGradeBoundaries).values({
    id,
    past_paper_id: input.past_paper_id,
    grade: input.grade,
    min_mark: input.min_mark,
    max_mark: input.max_mark ?? null,
    ums_min: input.ums_min ?? null,
    ums_max: input.ums_max ?? null,
    created_at: now,
  });
  await writeAudit({
    actorUserId: guard.userId,
    actorName: guard.name,
    action: 'create',
    entityType: 'paper_grade_boundary',
    entityId: id,
    summary: `Created boundary ${input.grade} on ${input.past_paper_id}`,
  });
  return { success: true as const, id };
}

export async function adminDeletePaperBoundary(boundaryId: string) {
  const guard = await requireExamDataEditor();
  if (!guard.ok) return { success: false as const, error: guard.error };

  const db = getDb();
  await db.delete(paperGradeBoundaries).where(eq(paperGradeBoundaries.id, boundaryId));
  await writeAudit({
    actorUserId: guard.userId,
    actorName: guard.name,
    action: 'delete',
    entityType: 'paper_grade_boundary',
    entityId: boundaryId,
    summary: `Deleted paper grade boundary ${boundaryId}`,
  });
  return { success: true as const };
}

export interface SubjectBoundaryUpsertInput {
  id?: string;
  subject_id: string;
  year: number;
  series: string;
  variant?: string | null;
  tier?: string | null;
  grade: string;
  min_mark: number;
  max_mark?: number | null;
}

export async function adminUpsertSubjectBoundary(input: SubjectBoundaryUpsertInput) {
  const guard = await requireExamDataEditor();
  if (!guard.ok) return { success: false as const, error: guard.error };

  const db = getDb();
  const now = new Date();
  const id =
    input.id ||
    `sgb-${input.subject_id}-${input.year}-${input.series}-${input.grade}-${crypto.randomUUID().slice(0, 6)}`;

  const values = {
    subject_id: input.subject_id,
    year: input.year,
    series: input.series,
    variant: input.variant ?? null,
    tier: input.tier ?? null,
    grade: input.grade,
    min_mark: input.min_mark,
    max_mark: input.max_mark ?? null,
  };

  if (input.id) {
    await db.update(subjectGradeBoundaries).set(values).where(eq(subjectGradeBoundaries.id, input.id));
    await writeAudit({
      actorUserId: guard.userId,
      actorName: guard.name,
      action: 'update',
      entityType: 'subject_grade_boundary',
      entityId: input.id,
      summary: `Updated subject boundary ${input.grade} ${input.year} ${input.series}`,
    });
    return { success: true as const, id: input.id };
  }

  await db.insert(subjectGradeBoundaries).values({ id, ...values, created_at: now });
  await writeAudit({
    actorUserId: guard.userId,
    actorName: guard.name,
    action: 'create',
    entityType: 'subject_grade_boundary',
    entityId: id,
    summary: `Created subject boundary ${input.grade} ${input.year} ${input.series}`,
  });
  return { success: true as const, id };
}

export async function adminDeleteSubjectBoundary(boundaryId: string) {
  const guard = await requireExamDataEditor();
  if (!guard.ok) return { success: false as const, error: guard.error };

  const db = getDb();
  await db.delete(subjectGradeBoundaries).where(eq(subjectGradeBoundaries.id, boundaryId));
  await writeAudit({
    actorUserId: guard.userId,
    actorName: guard.name,
    action: 'delete',
    entityType: 'subject_grade_boundary',
    entityId: boundaryId,
    summary: `Deleted subject grade boundary ${boundaryId}`,
  });
  return { success: true as const };
}

export async function adminListRecentAudit(limit = 30) {
  const guard = await requireExamDataEditor();
  if (!guard.ok) return { success: false as const, error: guard.error, data: [] };

  const db = getDb();
  const data = await db.query.examDataAuditLog.findMany({
    orderBy: [desc(examDataAuditLog.created_at)],
    limit,
  });
  return { success: true as const, data };
}
