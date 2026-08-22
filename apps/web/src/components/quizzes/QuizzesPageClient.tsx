'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Quizzes Page Client Component
// Fetches the current user's quizzes and renders QuizListView + QuizCreator.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import QuizListView from './QuizListView';
import QuizCreator from './QuizCreator';
import BackButton from '@/components/ui/BackButton';
import {
  actionGetQuizzes,
  actionDeleteQuiz,
  actionShareQuiz,
} from '@/actions/quizzes';
import type { QuizStandaloneUser } from '@/types/quiz';

export default function QuizzesPageClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizStandaloneUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await actionGetQuizzes(user.id);
    if (result.success) {
      setQuizzes(result.data as unknown as QuizStandaloneUser[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  if (!user) return null;

  if (showCreator) {
    return (
      <div className="space-y-6">
        <BackButton href="/quizzes" label="Back to Quizzes" />
        <QuizCreator
          onCancel={() => setShowCreator(false)}
          onCreated={() => {
            setShowCreator(false);
            fetchQuizzes();
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Back to Dashboard" />
      <QuizListView
        quizzes={quizzes}
        onCreateNew={() => setShowCreator(true)}
        onEdit={(quizId) => router.push(`/quizzes/${quizId}`)}
        onDelete={async (quizId) => {
          const result = await actionDeleteQuiz(quizId, user.id);
          if (result.success) fetchQuizzes();
        }}
        onShare={async (quizId) => {
          await actionShareQuiz(quizId);
          // Share action complete — UI feedback could be added
        }}
        onHostLive={(quizId) => router.push(`/quizzes/${quizId}/host`)}
        onTakeQuiz={(quizId) => router.push(`/quizzes/${quizId}/take`)}
      />
    </div>
  );
}
