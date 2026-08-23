'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Quiz Session Hook (Player View)
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';
import { actionSubmitAnswer } from '@/actions/quizzes';
import type { QuizSession, QuizSessionParticipant } from '@/types/quiz';

interface UseQuizSessionResult {
  session: QuizSession | null;
  participants: QuizSessionParticipant[];
  currentQuestionIndex: number;
  isConnected: boolean;
  submitAnswer: (questionIndex: number, answer: any, timeTakenMs?: number) => Promise<void>;
}

export function useQuizSession(
  sessionId: string | undefined,
  userId: string | undefined
): UseQuizSessionResult {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [participants, setParticipants] = useState<QuizSessionParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    setIsConnected(true);
  }, [sessionId]);

  const submitAnswerFn = useCallback(
    async (questionIndex: number, answer: any, timeTakenMs = 1000) => {
      if (!sessionId || !userId) return;
      await actionSubmitAnswer(sessionId, userId, questionIndex, answer, timeTakenMs);
    },
    [sessionId, userId]
  );

  return {
    session,
    participants,
    currentQuestionIndex: session?.current_question_index ?? 0,
    isConnected,
    submitAnswer: submitAnswerFn,
  };
}
