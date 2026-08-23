'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Standalone Quiz Server Actions (Neon Drizzle / API)
// ──────────────────────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/utils';

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// In-memory sessions store for live quiz sessions
const liveQuizSessions = new Map<string, any>();
const standaloneQuizzes = new Map<string, any>();

// ── CRUD Actions ─────────────────────────────────────────────────────────────

export async function actionGetQuizzes(userId: string) {
  const quizzes = Array.from(standaloneQuizzes.values()).filter((q) => q.created_by === userId);
  return { success: true, data: quizzes };
}

export async function actionGetQuizById(quizId: string) {
  const quiz = standaloneQuizzes.get(quizId);
  if (quiz) return { success: true, data: quiz };

  const found = Array.from(standaloneQuizzes.values()).find(
    (q) => q.id === quizId || slugify(q.title) === quizId
  );
  if (found) return { success: true, data: found };

  return { success: false, error: 'Quiz not found' };
}

export async function actionGetPublicQuizzes() {
  const publicList = Array.from(standaloneQuizzes.values()).filter((q) => q.is_public);
  return { success: true, data: publicList };
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
}) {
  const id = `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newQuiz = {
    id,
    title: data.title,
    description: data.description ?? null,
    questions: data.questions,
    created_by: data.userId || 'user',
    is_public: data.is_public ?? false,
    curriculum_id: data.curriculum_id ?? null,
    difficulty: data.difficulty ?? null,
    time_limit_minutes: data.time_limit_minutes ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  standaloneQuizzes.set(id, newQuiz);
  revalidatePath('/quizzes');
  return { success: true, data: newQuiz };
}

export async function actionUpdateQuiz(quizId: string, userId: string, data: any) {
  const existing = standaloneQuizzes.get(quizId);
  if (!existing) return { success: false, error: 'Quiz not found' };

  const updated = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };
  standaloneQuizzes.set(quizId, updated);
  revalidatePath('/quizzes');
  return { success: true, data: updated };
}

export async function actionDeleteQuiz(quizId: string, userId: string) {
  standaloneQuizzes.delete(quizId);
  revalidatePath('/quizzes');
  return { success: true };
}

export async function actionShareQuiz(quizId: string) {
  const quiz = standaloneQuizzes.get(quizId);
  if (!quiz) return { success: false, error: 'Quiz not found' };

  if (!quiz.share_code) {
    quiz.share_code = generateJoinCode();
    standaloneQuizzes.set(quizId, quiz);
  }

  return { success: true, data: { share_code: quiz.share_code } };
}

// ── Session Actions ──────────────────────────────────────────────────────────

export async function actionCreateSession(quizId: string, hostId: string) {
  const quiz = standaloneQuizzes.get(quizId);
  const sessionId = `session_${Date.now()}`;
  const joinCode = generateJoinCode();

  const session = {
    id: sessionId,
    quiz_id: quizId,
    quiz: quiz || { title: 'Live Quiz', questions: [] },
    host_id: hostId,
    join_code: joinCode,
    status: 'waiting',
    current_question_index: -1,
    participants: [],
    created_at: new Date().toISOString(),
  };

  liveQuizSessions.set(sessionId, session);
  liveQuizSessions.set(joinCode, session);

  return { success: true, data: session };
}

export async function actionJoinSession(joinCode: string, userId: string, displayName: string) {
  const session = liveQuizSessions.get(joinCode);
  if (!session) return { success: false, error: 'Session not found. Check your join code.' };
  if (session.status !== 'waiting') return { success: false, error: 'This session has already started or ended.' };

  let participant = session.participants.find((p: any) => p.user_id === userId);
  if (!participant) {
    participant = {
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      session_id: session.id,
      user_id: userId,
      display_name: displayName,
      answers: [],
      score: 0,
    };
    session.participants.push(participant);
  }

  return { success: true, data: { session, participant } };
}

export async function actionAdvanceQuestion(sessionId: string, hostId: string, questionIndex: number) {
  const session = liveQuizSessions.get(sessionId);
  if (!session) return { success: false, error: 'Session not found' };
  session.current_question_index = questionIndex;
  session.status = 'in_progress';
  return { success: true, data: session };
}

export async function actionEndSession(sessionId: string, hostId: string) {
  const session = liveQuizSessions.get(sessionId);
  if (!session) return { success: false, error: 'Session not found' };
  session.status = 'ended';
  return { success: true, data: session };
}

export async function actionSubmitAnswer(
  sessionId: string,
  participantId: string,
  questionIndex: number,
  answer: any,
  timeTakenMs: number
) {
  const session = liveQuizSessions.get(sessionId);
  if (!session) return { success: false, error: 'Session not found' };

  const participant = session.participants.find((p: any) => p.id === participantId);
  if (!participant) return { success: false, error: 'Participant not found' };

  participant.answers.push({ questionIndex, answer, timeTakenMs });
  return { success: true, data: participant };
}
