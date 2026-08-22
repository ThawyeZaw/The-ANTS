'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Realtime Quiz Session Hook (Host View)
// ──────────────────────────────────────────────────────────────────────────────

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { actionAdvanceQuestion, actionEndSession } from '@/actions/quizzes';
import { queryKeys } from '@/lib/queryKeys';
import { useQuizSession } from './useQuizSession';

interface UseQuizSessionHostResult {
  session: ReturnType<typeof useQuizSession>['session'];
  participants: ReturnType<typeof useQuizSession>['participants'];
  currentQuestionIndex: number;
  isConnected: boolean;
  advanceToQuestion: (index: number) => Promise<void>;
  endSession: () => Promise<void>;
}

export function useQuizSessionHost(
  sessionId: string,
  hostId: string
): UseQuizSessionHostResult {
  const queryClient = useQueryClient();
  const base = useQuizSession(sessionId, hostId);

  const advanceToQuestion = useCallback(
    async (index: number) => {
      if (!sessionId) return;
      await actionAdvanceQuestion(sessionId, hostId, index);
      queryClient.invalidateQueries({
        queryKey: queryKeys.quizzes.session(sessionId),
      });
    },
    [sessionId, hostId, queryClient]
  );

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    await actionEndSession(sessionId, hostId);
    queryClient.invalidateQueries({
      queryKey: queryKeys.quizzes.session(sessionId),
    });
  }, [sessionId, hostId, queryClient]);

  return {
    ...base,
    advanceToQuestion,
    endSession,
  };
}
