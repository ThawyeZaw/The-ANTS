'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Standalone Quiz Server Actions
// ──────────────────────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Json } from '@/types/supabase';

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function requireOwnership(quizId: string, userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('quizzes_standalone' as any)
    .select('created_by')
    .eq('id', quizId)
    .single();

  if (!data) return { success: false, error: 'Quiz not found' };
  if ((data as any).created_by !== userId) return { success: false, error: 'Only the quiz owner can perform this action' };
  return { success: true };
}

async function requireHost(sessionId: string, hostId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('quiz_sessions' as any)
    .select('host_id')
    .eq('id', sessionId)
    .single();

  if (!data) return { success: false, error: 'Session not found' };
  if ((data as any).host_id !== hostId) return { success: false, error: 'Only the session host can perform this action' };
  return { success: true };
}

// ── CRUD Actions ─────────────────────────────────────────────────────────────

export async function actionGetQuizzes(userId: string) {
  const supabase = await createClient();
  const { data: quizzes, error } = await supabase
    .from('quizzes_standalone' as any)
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: quizzes ?? [] };
}

export async function actionGetQuizById(quizId: string) {
  const supabase = await createClient();
  const { data: quiz, error } = await supabase
    .from('quizzes_standalone' as any)
    .select('*')
    .eq('id', quizId)
    .single();

  if (error || !quiz) return { success: false, error: 'Quiz not found' };
  return { success: true, data: quiz };
}

export async function actionGetPublicQuizzes() {
  const supabase = await createClient();
  const { data: quizzes, error } = await supabase
    .from('quizzes_standalone_official' as any)
    .select('*')
    .eq('review_status', 'approved')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: quizzes ?? [] };
}

export async function actionCreateQuiz(
  data: {
    title: string;
    description?: string;
    questions: any[];
    is_public?: boolean;
    curriculum_id?: string;
    difficulty?: string;
    time_limit_minutes?: number;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: quiz, error } = await supabase
    .from('quizzes_standalone' as any)
    .insert({
      title: data.title,
      description: data.description ?? null,
      questions: data.questions as Json,
      created_by: user.id,
      is_public: data.is_public ?? false,
      curriculum_id: data.curriculum_id ?? null,
      difficulty: data.difficulty ?? null,
      time_limit_minutes: data.time_limit_minutes ?? null,
    } as any)
    .select()
    .single();

  if (error || !quiz) return { success: false, error: error?.message ?? 'Failed to create quiz' };

  revalidatePath('/quizzes');
  return { success: true, data: quiz as any };
}

export async function actionUpdateQuiz(quizId: string, userId: string, data: any) {
  const auth = await requireOwnership(quizId, userId);
  if (!auth.success) return auth;

  const supabase = await createClient();
  const clean: Record<string, any> = {};

  // Only include provided fields
  if (data.title !== undefined) clean.title = data.title;
  if (data.description !== undefined) clean.description = data.description;
  if (data.questions !== undefined) clean.questions = data.questions as Json;
  if (data.is_public !== undefined) clean.is_public = data.is_public;
  if (data.status !== undefined) clean.status = data.status;
  if (data.curriculum_id !== undefined) clean.curriculum_id = data.curriculum_id;
  if (data.difficulty !== undefined) clean.difficulty = data.difficulty;
  if (data.time_limit_minutes !== undefined) clean.time_limit_minutes = data.time_limit_minutes;

  const { data: updated, error } = await supabase
    .from('quizzes_standalone' as any)
    .update(clean as any)
    .eq('id', quizId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  if (!updated) return { success: false, error: 'Failed to update quiz' };

  revalidatePath('/quizzes');
  return { success: true, data: updated };
}

export async function actionDeleteQuiz(quizId: string, userId: string) {
  const auth = await requireOwnership(quizId, userId);
  if (!auth.success) return auth;

  const supabase = await createClient();
  const { error } = await supabase
    .from('quizzes_standalone' as any)
    .delete()
    .eq('id', quizId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/quizzes');
  return { success: true };
}

export async function actionShareQuiz(quizId: string) {
  const supabase = await createClient();

  // Check if share_code already exists
  const { data: existing } = await supabase
    .from('quizzes_standalone' as any)
    .select('share_code')
    .eq('id', quizId)
    .single();

  if (!existing) return { success: false, error: 'Quiz not found' };

  if ((existing as any).share_code) {
    return { success: true, data: { share_code: (existing as any).share_code } };
  }

  // Generate a new share code
  const shareCode = generateJoinCode();
  const { data: updated, error } = await supabase
    .from('quizzes_standalone' as any)
    .update({ share_code: shareCode } as any)
    .eq('id', quizId)
    .select('share_code')
    .single();

  if (error || !updated) return { success: false, error: error?.message ?? 'Failed to generate share code' };

  return { success: true, data: { share_code: (updated as any).share_code } };
}

// ── Session Actions (live Kahoot-style) ──────────────────────────────────────

export async function actionCreateSession(quizId: string, hostId: string) {
  const supabase = await createClient();

  // Verify the quiz exists
  const { data: quiz } = await supabase
    .from('quizzes_standalone' as any)
    .select('id')
    .eq('id', quizId)
    .single();

  if (!quiz) return { success: false, error: 'Quiz not found' };

  // Generate a unique join code
  let joinCode = generateJoinCode();
  let isUnique = false;
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data: existing } = await supabase
      .from('quiz_sessions' as any)
      .select('id')
      .eq('join_code', joinCode)
      .single();
    if (!existing) {
      isUnique = true;
      break;
    }
    joinCode = generateJoinCode();
  }
  if (!isUnique) return { success: false, error: 'Failed to generate a unique join code. Please try again.' };

  const { data: session, error } = await supabase
    .from('quiz_sessions' as any)
    .insert({
      quiz_id: quizId,
      host_id: hostId,
      join_code: joinCode,
      status: 'waiting',
      current_question_index: -1,
    } as any)
    .select()
    .single();

  if (error || !session) return { success: false, error: error?.message ?? 'Failed to create session' };
  return { success: true, data: session };
}

export async function actionJoinSession(joinCode: string, userId: string, displayName: string) {
  const supabase = await createClient();

  // Find the session by join code
  const { data: session } = await supabase
    .from('quiz_sessions' as any)
    .select('*')
    .eq('join_code', joinCode)
    .single();

  if (!session) return { success: false, error: 'Session not found. Check your join code.' };
  if ((session as any).status !== 'waiting') return { success: false, error: 'This session has already started or ended.' };

  // Check if participant already joined
  const { data: existingParticipant } = await supabase
    .from('quiz_session_participants' as any)
    .select('id')
    .eq('session_id', (session as any).id)
    .eq('user_id', userId)
    .single();

  if (existingParticipant) {
    return { success: true, data: { session, participant: existingParticipant } };
  }

  // Add participant
  const { data: participant, error } = await supabase
    .from('quiz_session_participants' as any)
    .insert({
      session_id: (session as any).id,
      user_id: userId,
      display_name: displayName,
      answers: [],
      score: 0,
    } as any)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  return { success: true, data: { session, participant } };
}

export async function actionAdvanceQuestion(sessionId: string, hostId: string, questionIndex: number) {
  const auth = await requireHost(sessionId, hostId);
  if (!auth.success) return auth;

  const supabase = await createClient();

  // Get current session to verify we're advancing sequentially
  const { data: session } = await supabase
    .from('quiz_sessions' as any)
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) return { success: false, error: 'Session not found' };
  if ((session as any).status === 'finished') return { success: false, error: 'Session has already ended' };

  // If advancing past question 0, auto-grade the previous question
  if (questionIndex > 0 && (session as any).current_question_index < questionIndex) {
    const prevQuestionIndex = questionIndex - 1;

    // Get the quiz to check correct answers
    const { data: quiz } = await supabase
      .from('quizzes_standalone' as any)
      .select('questions')
      .eq('id', (session as any).quiz_id)
      .single();

    if (quiz) {
      const questions = (quiz as any).questions as any[];
      const prevQuestion = questions[prevQuestionIndex];

      if (prevQuestion) {
        // Get all participants and grade their answers for the previous question
        const { data: participants } = await supabase
          .from('quiz_session_participants' as any)
          .select('id, answers')
          .eq('session_id', sessionId);

        if (participants) {
          for (const participant of participants as any[]) {
            const answers = (participant.answers || []) as any[];
            const answerIndex = answers.findIndex(
              (a: any) => a.question_id === prevQuestion.id
            );

            if (answerIndex >= 0) {
              const isCorrect = answers[answerIndex].answer === prevQuestion.correct_answer;
              answers[answerIndex].is_correct = isCorrect;

              // Update participant score
              const scoreDelta = isCorrect ? prevQuestion.points : 0;
              await supabase
                .from('quiz_session_participants' as any)
                .update({
                  answers: answers as Json,
                  score: participant.score + scoreDelta,
                } as any)
                .eq('id', participant.id);
            }
          }
        }
      }
    }
  }

  // Update session status and current question index
  const updateData: Record<string, any> = {
    current_question_index: questionIndex,
  };

  if ((session as any).status === 'waiting') {
    updateData.status = 'active';
    updateData.started_at = new Date().toISOString();
  }

  const { data: updated, error } = await supabase
    .from('quiz_sessions' as any)
    .update(updateData as any)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: updated };
}

export async function actionSubmitAnswer(
  sessionId: string,
  userId: string,
  questionId: string,
  answer: string
) {
  const supabase = await createClient();

  // Verify the session is active
  const { data: session } = await supabase
    .from('quiz_sessions' as any)
    .select('status')
    .eq('id', sessionId)
    .single();

  if (!session) return { success: false, error: 'Session not found' };
  if ((session as any).status !== 'active') return { success: false, error: 'Session is not active' };

  // Find the participant
  const { data: participant } = await supabase
    .from('quiz_session_participants' as any)
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (!participant) return { success: false, error: 'You are not a participant in this session' };

  // Add or update the answer
  const answers = ((participant as any).answers || []) as any[];
  const existingIndex = answers.findIndex((a: any) => a.question_id === questionId);

  const answerEntry = {
    question_id: questionId,
    answer,
    is_correct: null,
    answered_at: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    answers[existingIndex] = answerEntry;
  } else {
    answers.push(answerEntry);
  }

  const { error } = await supabase
    .from('quiz_session_participants' as any)
    .update({ answers: answers as Json } as any)
    .eq('id', (participant as any).id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function actionEndSession(sessionId: string, hostId: string) {
  const auth = await requireHost(sessionId, hostId);
  if (!auth.success) return auth;

  const supabase = await createClient();

  // Get session details
  const { data: session } = await supabase
    .from('quiz_sessions' as any)
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) return { success: false, error: 'Session not found' };

  // Get the quiz to grade any remaining unanswered questions
  const { data: quiz } = await supabase
    .from('quizzes_standalone' as any)
    .select('questions')
    .eq('id', (session as any).quiz_id)
    .single();

  if (quiz) {
    const questions = ((quiz as any).questions as any[]) || [];

    // Get all participants and grade questions after the last advanced index
    const { data: participants } = await supabase
      .from('quiz_session_participants' as any)
      .select('id, answers, score')
      .eq('session_id', sessionId);

    if (participants) {
      for (const participant of participants as any[]) {
        const answers = (participant.answers || []) as any[];
        let currentScore = participant.score || 0;
        let hasChanges = false;

        for (const question of questions) {
          const answerEntry = answers.find((a: any) => a.question_id === question.id);
          if (answerEntry && answerEntry.is_correct === null) {
            const isCorrect = answerEntry.answer === question.correct_answer;
            answerEntry.is_correct = isCorrect;
            if (isCorrect) {
              currentScore += question.points;
            }
            hasChanges = true;
          }
        }

        if (hasChanges) {
          await supabase
            .from('quiz_session_participants' as any)
            .update({
              answers: answers as Json,
              score: currentScore,
            } as any)
            .eq('id', participant.id);
        }
      }
    }
  }

  // Mark session as finished
  const { data: updated, error } = await supabase
    .from('quiz_sessions' as any)
    .update({
      status: 'finished',
      ended_at: new Date().toISOString(),
    } as any)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: updated };
}

export async function actionGetSessionByCode(joinCode: string) {
  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from('quiz_sessions' as any)
    .select('*')
    .eq('join_code', joinCode)
    .single();

  if (error || !session) return { success: false, error: 'Session not found' };
  return { success: true, data: session };
}

// ── Contributor Actions ──────────────────────────────────────────────────────

export async function actionSubmitQuizForReview(quizId: string, userId: string) {
  const auth = await requireOwnership(quizId, userId);
  if (!auth.success) return auth;

  const supabase = await createClient();

  // Get the full quiz data
  const { data: quiz, error } = await supabase
    .from('quizzes_standalone' as any)
    .select('*')
    .eq('id', quizId)
    .single();

  if (error || !quiz) return { success: false, error: error?.message ?? 'Quiz not found' };

  // Update quiz status to published
  const { error: updateError } = await supabase
    .from('quizzes_standalone' as any)
    .update({ status: 'published' } as any)
    .eq('id', quizId);

  if (updateError) return { success: false, error: updateError.message };

  // Upsert into the official quizzes table
  const admin = await createAdminClient();
  const quizData = quiz as any;
  const { error: upsertError } = await admin
    .from('quizzes_standalone_official' as any)
    .upsert({
      id: quizId,
      title: quizData.title,
      description: quizData.description,
      questions: quizData.questions as Json,
      created_by: userId,
      is_public: quizData.is_public,
      status: 'published',
      curriculum_id: quizData.curriculum_id,
      difficulty: quizData.difficulty,
      time_limit_minutes: quizData.time_limit_minutes,
      created_at: quizData.created_at,
      updated_at: quizData.updated_at,
      review_status: 'pending_review',
      reviewed_by: null,
      reviewed_at: null,
    } as any, { onConflict: 'id' });

  if (upsertError) return { success: false, error: upsertError.message };

  revalidatePath('/quizzes');
  return { success: true };
}

export async function actionApproveQuiz(quizId: string, reviewerId: string) {
  const supabase = await createClient();

  // Update the source quiz status
  const { error: quizError } = await supabase
    .from('quizzes_standalone' as any)
    .update({ status: 'published' } as any)
    .eq('id', quizId);

  if (quizError) return { success: false, error: quizError.message };

  // Update the official entry
  const admin = await createAdminClient();
  const { error } = await admin
    .from('quizzes_standalone_official' as any)
    .update({
      review_status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      is_public: true,
    } as any)
    .eq('id', quizId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/quizzes');
  revalidatePath('/library');
  return { success: true };
}

export async function actionRejectQuiz(quizId: string, reviewerId: string, reason?: string) {
  const supabase = await createClient();

  // Revert source quiz status to draft
  const { error: quizError } = await supabase
    .from('quizzes_standalone' as any)
    .update({ status: 'draft' } as any)
    .eq('id', quizId);

  if (quizError) return { success: false, error: quizError.message };

  // Update the official entry
  const admin = await createAdminClient();
  const { error } = await admin
    .from('quizzes_standalone_official' as any)
    .update({
      review_status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      is_public: false,
    } as any)
    .eq('id', quizId);

  if (error) return { success: false, error: error.message };

  // Store rejection feedback if provided (could be extended with a dedicated table)
  if (reason) {
    // Feedback could be stored in a quiz_review_feedback table in the future
  }

  revalidatePath('/quizzes');
  return { success: true };
}
