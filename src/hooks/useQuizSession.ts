'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Realtime Quiz Session Hook (Player View)
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { actionSubmitAnswer } from '@/actions/quizzes';
import type { QuizSession, QuizSessionParticipant } from '@/types/quiz';

interface UseQuizSessionResult {
  session: QuizSession | null;
  participants: QuizSessionParticipant[];
  currentQuestionIndex: number;
  isConnected: boolean;
  submitAnswer: (questionId: string, answer: string) => Promise<void>;
}

// These tables don't exist in generated types yet (PM will create them),
// so we cast through `any` to avoid deep type instantiation errors.

export function useQuizSession(
  sessionId: string | undefined,
  userId: string | undefined
): UseQuizSessionResult {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [participants, setParticipants] = useState<QuizSessionParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();
    const db = supabase as any;

    // Fetch initial session data
    db
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
      .then(({ data }: { data: QuizSession | null }) => {
        if (data) setSession(data);
      });

    // Fetch initial participants
    db
      .from('quiz_session_participants')
      .select('*')
      .eq('session_id', sessionId)
      .then(({ data }: { data: QuizSessionParticipant[] | null }) => {
        if (data) setParticipants(data);
      });

    // Subscribe to session changes
    const sessionChannel = supabase
      .channel(`quiz-session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_sessions',
          filter: `id=eq.${sessionId}`,
        } as any,
        (payload: any) => {
          setSession(payload.new as QuizSession);
        }
      )
      .subscribe();

    // Subscribe to participant changes
    const participantsChannel = supabase
      .channel(`quiz-participants-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_session_participants',
          filter: `session_id=eq.${sessionId}`,
        } as any,
        (payload: any) => {
          const p = payload.new as QuizSessionParticipant;
          if (payload.eventType === 'INSERT') {
            setParticipants((prev) => [...prev, p]);
          } else if (payload.eventType === 'UPDATE') {
            setParticipants((prev) =>
              prev.map((part) => (part.id === p.id ? p : part))
            );
          } else if (payload.eventType === 'DELETE') {
            setParticipants((prev) =>
              prev.filter(
                (part) => part.id !== (payload.old as any)?.id
              )
            );
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
      });

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [sessionId]);

  // Submit answer via server action (triggers DB update → Realtime syncs to host)
  const submitAnswerFn = useCallback(
    async (questionId: string, answer: string) => {
      if (!sessionId || !userId) return;
      await actionSubmitAnswer(sessionId, userId, questionId, answer);
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
