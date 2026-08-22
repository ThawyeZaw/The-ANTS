'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Take Quiz Client Component (Async Mode)
// Placeholder for the async quiz-taking experience.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Clock, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { actionGetQuizById } from '@/actions/quizzes';
import type { QuizStandaloneUser } from '@/types/quiz';

interface TakeQuizClientProps {
  quizId: string;
}

export default function TakeQuizClient({ quizId }: TakeQuizClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizStandaloneUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    actionGetQuizById(quizId).then((result) => {
      if (result.success) {
        setQuiz(result.data as unknown as QuizStandaloneUser);
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

  if (!quiz) {
    return (
      <div className="space-y-6">
        <BackButton href="/quizzes" label="Back to Quizzes" />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
          <Brain className="h-14 w-14 text-[var(--foreground-muted)] mb-4" />
          <p className="text-sm font-medium text-[var(--foreground-secondary)]">Quiz not found</p>
        </div>
      </div>
    );
  }

  const questions = quiz.questions;
  const current = questions[currentIndex];

  function handleAnswer(answer: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: answer }));
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  if (submitted) {
    const correctCount = questions.filter(
      (q) => answers[q.id]?.toLowerCase() === q.correct_answer.toLowerCase()
    ).length;
    const score = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="space-y-6">
        <BackButton href={`/quizzes/${quizId}`} label="Back to Quiz" />
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-8 text-center">
          <Brain className="h-12 w-12 text-[var(--accent)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Quiz Complete!</h2>
          <p className="text-4xl font-bold text-[var(--primary)] mb-2">{score}%</p>
          <p className="text-sm text-[var(--foreground-secondary)]">
            {correctCount} of {questions.length} correct
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="secondary" onClick={() => router.push(`/quizzes/${quizId}`)}>
              Back to Details
            </Button>
            <Button onClick={() => router.push('/quizzes')}>
              All Quizzes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <BackButton href={`/quizzes/${quizId}`} label="Back to Quiz" />

      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-[var(--foreground-secondary)]">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        {quiz.time_limit_minutes && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {quiz.time_limit_minutes} min
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-[var(--background-secondary)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-bold text-[var(--primary)]">
            {currentIndex + 1}
          </span>
          <span className="text-xs text-[var(--foreground-muted)]">{current.points} pt</span>
          <span className="text-xs text-[var(--foreground-muted)] capitalize">{current.type.replace('_', ' ')}</span>
        </div>

        <p className="text-base font-medium text-[var(--foreground)] mb-5">
          {current.question_text}
        </p>

        {/* Multiple choice options */}
        {current.type === 'multiple_choice' && current.options && (
          <div className="space-y-2">
            {current.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => handleAnswer(opt)}
                className={`w-full rounded-xl border p-3 text-left text-sm transition-all ${
                  answers[current.id] === opt
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                    : 'border-[var(--border)] bg-[var(--background-secondary)]/30 text-[var(--foreground-secondary)] hover:border-[var(--primary)]/30'
                }`}
              >
                <span className="mr-2 font-bold text-xs">{String.fromCharCode(65 + oi)}.</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* True/False */}
        {current.type === 'true_false' && (
          <div className="flex gap-3">
            {['true', 'false'].map((val) => (
              <button
                key={val}
                onClick={() => handleAnswer(val)}
                className={`flex-1 rounded-xl border p-4 text-center text-sm font-medium transition-all ${
                  answers[current.id] === val
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                    : 'border-[var(--border)] bg-[var(--background-secondary)]/30 text-[var(--foreground-secondary)] hover:border-[var(--primary)]/30'
                }`}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Short answer */}
        {current.type === 'short_answer' && (
          <textarea
            value={answers[current.id] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={3}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Previous
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button onClick={handleNext} disabled={!answers[current.id]}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!answers[current.id]}>
            Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
}
