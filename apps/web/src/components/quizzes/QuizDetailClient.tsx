'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Quiz Detail Client Component
// Displays a single quiz with questions and action buttons.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Clock, Play, Eye, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { actionGetQuizById, actionDeleteQuiz } from '@/actions/quizzes';
import { cn, formatDate } from '@/lib/utils';
import type { QuizStandaloneUser } from '@/types/quiz';

interface QuizDetailClientProps {
  quizId: string;
}

export default function QuizDetailClient({ quizId }: QuizDetailClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizStandaloneUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    actionGetQuizById(quizId).then((result) => {
      if (result.success) {
        setQuiz(result.data as unknown as QuizStandaloneUser);
      } else {
        setError(result.error ?? 'Quiz not found');
      }
      setLoading(false);
    });
  }, [quizId]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="space-y-6">
        <BackButton href="/quizzes" label="Back to Quizzes" />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
          <Brain className="h-14 w-14 text-[var(--foreground-muted)] mb-4" />
          <p className="text-sm font-medium text-[var(--foreground-secondary)]">
            {error || 'Quiz not found'}
          </p>
        </div>
      </div>
    );
  }

  const isOwner = quiz.created_by === user.id;
  const qCount = quiz.questions.length;
  const totalPts = quiz.questions.reduce((s, q) => s + q.points, 0);

  async function handleDelete() {
    if (!isOwner || !user) return;
    const result = await actionDeleteQuiz(quizId, user.id);
    if (result.success) router.push('/quizzes');
  }

  return (
    <div className="space-y-6">
      <BackButton href="/quizzes" label="Back to Quizzes" />

      {/* Header */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-[var(--accent)]" />
              <h1 className="text-xl font-bold text-[var(--foreground)] truncate">
                {quiz.title}
              </h1>
            </div>
            {quiz.description && (
              <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                {quiz.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwner && quiz.status === 'draft' && (
              <Button size="sm" variant="secondary" onClick={() => router.push(`/quizzes/${quizId}/edit`)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {isOwner && (
              <Button size="sm" variant="ghost" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-muted)] mt-4">
          <span>{qCount} question{qCount !== 1 ? 's' : ''}</span>
          <span className="text-[var(--border)]">·</span>
          <span>{totalPts} point{totalPts !== 1 ? 's' : ''}</span>
          {quiz.time_limit_minutes && (
            <>
              <span className="text-[var(--border)]">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {quiz.time_limit_minutes} min
              </span>
            </>
          )}
          <span className="text-[var(--border)]">·</span>
          <span>{formatDate(quiz.created_at)}</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant={quiz.status === 'published' ? 'success' : 'default'}>
            {quiz.status}
          </Badge>
          {quiz.difficulty && (
            <span className="rounded-full bg-[var(--background-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground-secondary)]">
              {quiz.difficulty}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {quiz.status === 'published' && (
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--border)]">
            <Button onClick={() => router.push(`/quizzes/${quizId}/take`)}>
              <Eye className="h-4 w-4" /> Take Quiz
            </Button>
            {isOwner && (
              <Button variant="secondary" onClick={() => router.push(`/quizzes/${quizId}/host`)}>
                <Play className="h-4 w-4" /> Host Live
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Questions */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Questions ({qCount})
        </h2>
        <div className="space-y-3">
          {quiz.questions.map((q, i) => (
            <div
              key={q.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-bold text-[var(--primary)]">
                  {i + 1}
                </span>
                <Badge variant="default">
                  {q.type === 'multiple_choice' ? 'MC' : q.type === 'true_false' ? 'T/F' : 'SA'}
                </Badge>
                <span className="text-xs text-[var(--foreground-muted)]">{q.points} pt</span>
              </div>
              <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                {q.question_text}
              </p>
              {q.options && (
                <div className="flex flex-wrap gap-1.5">
                  {q.options.map((opt, oi) => (
                    <span
                      key={oi}
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs',
                        opt === q.correct_answer
                          ? 'bg-[var(--success-light)] text-[var(--success)] font-medium'
                          : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
                      )}
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1.5 text-xs text-[var(--success)]">
                Answer: {q.correct_answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
