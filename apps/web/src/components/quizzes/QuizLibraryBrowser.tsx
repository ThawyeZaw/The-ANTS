'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — QuizLibraryBrowser
// Fetches approved official quizzes and renders the QuizLibraryView grid.
// Used by the Library page (quizzes tab) and the /library/quizzes route.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { actionGetPublicQuizzes } from '@/actions/quizzes';
import QuizLibraryView from './QuizLibraryView';
import type { QuizStandaloneOfficial } from '@/types/quiz';

import { slugify } from '@/lib/utils';

export default function QuizLibraryBrowser() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizStandaloneOfficial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    const result = await actionGetPublicQuizzes();
    if (result.success) {
      setQuizzes(result.data as unknown as QuizStandaloneOfficial[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleTakeQuiz = (quizId: string) => {
    const q = quizzes.find((item) => item.id === quizId);
    const slug = slugify(q?.title) || quizId;
    router.push(`/quizzes/${slug}/take`);
  };

  if (loading) {
    return (
      <div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />
    );
  }

  return <QuizLibraryView quizzes={quizzes} onTakeQuiz={handleTakeQuiz} />;
}
