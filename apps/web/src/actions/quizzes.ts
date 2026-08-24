'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Standalone Quiz Server Actions (Neon Drizzle DB)
// Persisted in `standalone_quizzes` / `quiz_live_sessions` / `quiz_live_participants`.
// ──────────────────────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDb, standaloneQuizzes, quizSessions, quizParticipants } from '@/lib/db';
import { slugify } from '@/lib/utils';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function nullableUuid(value: string | undefined | null): string | null {
  return value && UUID_RE.test(value) ? value : null;
}

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ── Row → legacy shape mappers (UI depends on these exact keys) ─────────────

type QuizRow = typeof standaloneQuizzes.$inferSelect;
type SessionRow = typeof quizSessions.$inferSelect;
type ParticipantRow = typeof quizParticipants.$inferSelect;

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

function shapeQuiz(row: QuizRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    questions: (row.questions ?? []) as any[],
    created_by: row.created_by ?? 'user',
    is_public: row.is_public,
    status: row.status,
    share_code: row.share_code ?? null,
    curriculum_id: row.curriculum_id ?? null,
    difficulty: row.difficulty ?? null,
    time_limit_minutes: row.time_limit_minutes ?? null,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function shapeParticipant(row: ParticipantRow) {
  return {
    id: row.id,
    session_id: row.session_id,
    user_id: row.user_id ?? null,
    display_name: row.display_name,
    answers: (row.answers ?? []).map((a) => ({
      questionIndex: a.questionIndex,
      answer: a.answer,
      timeTakenMs: a.timeTakenMs,
    })),
    score: row.score,
  };
}

async function shapeSession(db: ReturnType<typeof getDb>, row: SessionRow) {
  const [quizRow] = await db
    .select()
    .from(standaloneQuizzes)
    .where(eq(standaloneQuizzes.id, row.quiz_id))
    .catch(() => []);

  const participantRows = await db
    .select()
    .from(quizParticipants)
    .where(eq(quizParticipants.session_id, row.id));

  return {
    id: row.id,
    quiz_id: row.quiz_id,
    quiz: quizRow
      ? shapeQuiz(quizRow)
      : { title: 'Live Quiz', questions: [] as any[] },
    host_id: row.host_id ?? null,
    join_code: row.join_code,
    status: row.status,
    current_question_index: row.current_question_index,
    participants: participantRows.map(shapeParticipant),
    created_at: toIso(row.created_at),
  };
}

// ── CRUD Actions ─────────────────────────────────────────────────────────────

export async function actionGetQuizzes(userId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(standaloneQuizzes)
    .where(eq(standaloneQuizzes.created_by, userId))
    .orderBy(desc(standaloneQuizzes.created_at));
  return { success: true, data: rows.map(shapeQuiz) };
}

export async function actionGetQuizById(quizId: string) {
  const db = getDb();

  if (UUID_RE.test(quizId)) {
    const [row] = await db
      .select()
      .from(standaloneQuizzes)
      .where(eq(standaloneQuizzes.id, quizId));
    if (row) return { success: true, data: shapeQuiz(row) };
  }

  // Slug lookup preserved from the original contract
  const all = await db.select().from(standaloneQuizzes);
  const found = all.find((q) => slugify(q.title) === quizId);
  if (found) return { success: true, data: shapeQuiz(found) };

  return { success: false, error: 'Quiz not found' };
}

export async function actionGetPublicQuizzes() {
  const db = getDb();
  const rows = await db
    .select()
    .from(standaloneQuizzes)
    .where(and(eq(standaloneQuizzes.is_public, true), eq(standaloneQuizzes.status, 'published')))
    .orderBy(desc(standaloneQuizzes.created_at));
  return { success: true, data: rows.map(shapeQuiz) };
}

export async function actionCreateQuiz(data: {
  title: string;
  description?: string;
  questions: any[];
  is_public?: boolean;
  curriculum_id?: string;
  difficulty?: string;
  time_limit_minutes?: number;
  userId?: string;
}): Promise<{ success: true; data: any } | { success: false; error: string }> {
  const db = getDb();

  const [row] = await db
    .insert(standaloneQuizzes)
    .values({
      title: data.title,
      description: data.description ?? null,
      questions: data.questions,
      created_by: nullableUuid(data.userId),
      is_public: data.is_public ?? false,
      status: 'published',
      curriculum_id: nullableUuid(data.curriculum_id),
      difficulty: data.difficulty ?? null,
      time_limit_minutes: data.time_limit_minutes ?? null,
    })
    .returning();

  revalidatePath('/quizzes');
  return { success: true, data: shapeQuiz(row) };
}

export async function actionUpdateQuiz(quizId: string, userId: string, data: any) {
  const db = getDb();
  if (!UUID_RE.test(quizId)) return { success: false, error: 'Quiz not found' };

  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.questions !== undefined) updates.questions = data.questions;
  if (data.is_public !== undefined) updates.is_public = data.is_public;
  if (data.status !== undefined) updates.status = data.status;
  if (data.curriculum_id !== undefined) updates.curriculum_id = nullableUuid(data.curriculum_id);
  if (data.difficulty !== undefined) updates.difficulty = data.difficulty;
  if (data.time_limit_minutes !== undefined) updates.time_limit_minutes = data.time_limit_minutes;

  const [row] = await db
    .update(standaloneQuizzes)
    .set(updates)
    .where(eq(standaloneQuizzes.id, quizId))
    .returning();

  if (!row) return { success: false, error: 'Quiz not found' };
  revalidatePath('/quizzes');
  return { success: true, data: shapeQuiz(row) };
}

export async function actionDeleteQuiz(quizId: string, userId: string) {
  const db = getDb();
  if (UUID_RE.test(quizId)) {
    await db.delete(standaloneQuizzes).where(eq(standaloneQuizzes.id, quizId));
  }
  revalidatePath('/quizzes');
  return { success: true };
}

export async function actionShareQuiz(quizId: string) {
  const db = getDb();
  if (!UUID_RE.test(quizId)) return { success: false, error: 'Quiz not found' };

  const [existing] = await db
    .select()
    .from(standaloneQuizzes)
    .where(eq(standaloneQuizzes.id, quizId));

  if (!existing) return { success: false, error: 'Quiz not found' };

  if (!existing.share_code) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateJoinCode();
      const [updated] = await db
        .update(standaloneQuizzes)
        .set({ share_code: code })
        .where(
          and(
            eq(standaloneQuizzes.id, quizId),
            existing.share_code
              ? eq(standaloneQuizzes.share_code, existing.share_code)
              : isNull(standaloneQuizzes.share_code)
          )
        )
        .returning();
      if (updated?.share_code === code) {
        return { success: true, data: { share_code: code } };
      }
      const [fresh] = await db
        .select()
        .from(standaloneQuizzes)
        .where(eq(standaloneQuizzes.id, quizId));
      if (fresh?.share_code && fresh.share_code !== existing.share_code) break;
    }
    const [current] = await db
      .select()
      .from(standaloneQuizzes)
      .where(eq(standaloneQuizzes.id, quizId));
    return { success: true, data: { share_code: current?.share_code ?? null } };
  }

  return { success: true, data: { share_code: existing.share_code } };
}

export async function actionGetSessionByCode(
  joinCode: string
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  const db = getDb();

  const [sessionRow] = await db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.join_code, joinCode.toUpperCase()));

  if (!sessionRow) return { success: false, error: 'Session not found. Check your join code.' };
  return { success: true, data: await shapeSession(db, sessionRow) };
}

// ── Session Actions ──────────────────────────────────────────────────────────

export async function actionCreateSession(
  quizId: string,
  hostId: string
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  const db = getDb();
  if (!UUID_RE.test(quizId)) return { success: false, error: 'Quiz not found' };

  for (let attempt = 0; attempt < 5; attempt++) {
    const joinCode = generateJoinCode();
    try {
      const [row] = await db
        .insert(quizSessions)
        .values({
          quiz_id: quizId,
          host_id: nullableUuid(hostId),
          join_code: joinCode,
          status: 'waiting',
          current_question_index: -1,
        })
        .returning();
      return { success: true, data: await shapeSession(db, row) };
    } catch (err: any) {
      // Unique violation on join_code — regenerate and retry
      if (attempt === 4) {
        return { success: false, error: err?.message || 'Failed to create session' };
      }
    }
  }
  return { success: false, error: 'Failed to create session' };
}

export async function actionJoinSession(joinCode: string, userId: string, displayName: string) {
  const db = getDb();

  const [sessionRow] = await db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.join_code, joinCode.toUpperCase()));

  if (!sessionRow) return { success: false, error: 'Session not found. Check your join code.' };
  if (sessionRow.status !== 'waiting') {
    return { success: false, error: 'This session has already started or ended.' };
  }

  const existing = await db
    .select()
    .from(quizParticipants)
    .where(eq(quizParticipants.session_id, sessionRow.id));

  let participantRow = existing.find((p) => p.user_id === userId);
  if (!participantRow) {
    const [inserted] = await db
      .insert(quizParticipants)
      .values({
        session_id: sessionRow.id,
        user_id: nullableUuid(userId),
        display_name: displayName,
        answers: [],
        score: 0,
      })
      .returning();
    participantRow = inserted;
  }

  return {
    success: true,
    data: {
      session: await shapeSession(db, sessionRow),
      participant: shapeParticipant(participantRow),
    },
  };
}

export async function actionAdvanceQuestion(
  sessionId: string,
  hostId: string,
  questionIndex: number
) {
  const db = getDb();
  if (!UUID_RE.test(sessionId)) return { success: false, error: 'Session not found' };

  const [row] = await db
    .update(quizSessions)
    .set({ current_question_index: questionIndex, status: 'in_progress' })
    .where(eq(quizSessions.id, sessionId))
    .returning();

  if (!row) return { success: false, error: 'Session not found' };
  return { success: true, data: await shapeSession(db, row) };
}

export async function actionEndSession(sessionId: string, hostId: string) {
  const db = getDb();
  if (!UUID_RE.test(sessionId)) return { success: false, error: 'Session not found' };

  const [row] = await db
    .update(quizSessions)
    .set({ status: 'ended' })
    .where(eq(quizSessions.id, sessionId))
    .returning();

  if (!row) return { success: false, error: 'Session not found' };
  return { success: true, data: await shapeSession(db, row) };
}

export async function actionSubmitAnswer(
  sessionId: string,
  participantId: string,
  questionIndex: number,
  answer: any,
  timeTakenMs: number
) {
  const db = getDb();
  if (!UUID_RE.test(participantId)) return { success: false, error: 'Participant not found' };

  const [participant] = await db
    .select()
    .from(quizParticipants)
    .where(eq(quizParticipants.id, participantId));

  if (!participant || participant.session_id !== sessionId) {
    return { success: false, error: 'Participant not found' };
  }

  const answers = [
    ...(participant.answers ?? []),
    { questionIndex, answer, timeTakenMs },
  ];

  const [updated] = await db
    .update(quizParticipants)
    .set({ answers })
    .where(eq(quizParticipants.id, participantId))
    .returning();

  return { success: true, data: shapeParticipant(updated) };
}
