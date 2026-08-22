'use client';

import { useState } from 'react';
import {
  X,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Award,
  Brain,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Quiz, QuizAttempt } from '@/types';

interface QuizTakeModalProps {
  quiz: Quiz;
  existingAttempt?: QuizAttempt | null;
  onClose: () => void;
  onSubmit: (quizId: string, answers: { question_id: string; answer: string }[]) => void;
}

export default function QuizTakeModal({ quiz, existingAttempt, onClose, onSubmit }: QuizTakeModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizAttempt | null>(existingAttempt || null);

  // If there's an existing attempt, show results
  if (result) {
    return <QuizResultView quiz={quiz} attempt={result} onClose={onClose} />;
  }

  // After submission
  if (submitted) {
    // The parent will need to update. For now show a loading state
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-8 text-center">
          <Brain className="mx-auto h-12 w-12 text-[var(--primary)] mb-3" />
          <p className="text-lg font-semibold text-[var(--foreground)]">Submitting your quiz...</p>
        </div>
      </div>
    );
  }

  const totalPts = quiz.questions.reduce((s, q) => s + q.points, 0);

  function handleSubmit() {
    const answerList = quiz.questions.map((q) => ({ question_id: q.id, answer: answers[q.id] || '' }));
    onSubmit(quiz.id, answerList);
    setSubmitted(true);
  }

  const allAnswered = quiz.questions.every((q) => (answers[q.id] || '').trim().length > 0);

  // ── Taking Quiz ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="w-full max-w-3xl my-8 rounded-2xl border border-[var(--border)] bg-[var(--background-card)] shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-[var(--border)] bg-[var(--background-card)] px-6 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[var(--accent)] flex-shrink-0" />
              <h2 className="font-semibold text-[var(--foreground)] truncate">{quiz.title}</h2>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
              <span>{quiz.questions.length} questions</span>
              <span>{totalPts} points</span>
              {quiz.time_limit_minutes && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />{quiz.time_limit_minutes} min
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Questions */}
        <div className="space-y-6 px-6 py-5 max-h-[calc(100vh-240px)] overflow-y-auto">
          {quiz.description && (
            <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{quiz.description}</p>
          )}

          {quiz.questions.sort((a, b) => a.order - b.order).map((q, idx) => (
            <div key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-sm font-medium text-[var(--foreground)] leading-relaxed">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[var(--primary-light)] text-xs font-bold text-[var(--primary)] mr-2">{idx + 1}</span>
                  {q.question_text}
                </p>
                <span className="flex-shrink-0 text-xs text-[var(--foreground-muted)] whitespace-nowrap">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
              </div>

              {/* Multiple choice */}
              {q.type === 'multiple_choice' && q.options && (
                <div className="space-y-2 ml-7">
                  {q.options.map((option, oi) => (
                    <label
                      key={oi}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-all',
                        answers[q.id] === option
                          ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                          : 'border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground-secondary)] hover:border-[var(--primary)]/30 hover:bg-[var(--background-secondary)]'
                      )}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={option}
                        checked={answers[q.id] === option}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="hidden"
                      />
                      <span className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                        answers[q.id] === option
                          ? 'border-[var(--primary)] bg-[var(--primary)]'
                          : 'border-[var(--border)] bg-transparent'
                      )}>
                        {answers[q.id] === option && <CheckCircle className="h-3 w-3 text-white" />}
                      </span>
                      <span className="tracking-wide">{String.fromCharCode(65 + oi)}.</span>
                      {option}
                    </label>
                  ))}
                </div>
              )}

              {/* True/False */}
              {q.type === 'true_false' && (
                <div className="flex gap-3 ml-7">
                  {['true', 'false'].map((val) => (
                    <label
                      key={val}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border px-5 py-2.5 text-sm font-medium transition-all',
                        answers[q.id] === val
                          ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground-secondary)] hover:border-[var(--primary)]/30 hover:bg-[var(--background-secondary)]'
                      )}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={val}
                        checked={answers[q.id] === val}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="hidden"
                      />
                      <span className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                        answers[q.id] === val
                          ? 'border-[var(--primary)] bg-[var(--primary)]'
                          : 'border-[var(--border)] bg-transparent'
                      )}>
                        {answers[q.id] === val && <CheckCircle className="h-3 w-3 text-white" />}
                      </span>
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </label>
                  ))}
                </div>
              )}

              {/* Short Answer */}
              {q.type === 'short_answer' && (
                <div className="ml-7">
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    rows={3}
                    placeholder="Type your answer..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] resize-none"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between rounded-b-2xl border-t border-[var(--border)] bg-[var(--background-card)] px-6 py-4">
          <span className="text-xs text-[var(--foreground-muted)]">
            {Object.keys(answers).length} of {quiz.questions.length} answered
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!allAnswered}>
              Submit Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quiz Result View ─────────────────────────────────────────────────────────

function QuizResultView({ quiz, attempt, onClose }: { quiz: Quiz; attempt: QuizAttempt; onClose: () => void }) {
  const correctCount = attempt.answers.filter((a) => a.is_correct === true).length;
  const incorrectCount = attempt.answers.filter((a) => a.is_correct === false).length;
  const unansweredCount = attempt.answers.filter((a) => a.is_correct === null).length;
  const percentage = attempt.total_points > 0 ? Math.round(((attempt.score || 0) / attempt.total_points) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="w-full max-w-3xl my-8 rounded-2xl border border-[var(--border)] bg-[var(--background-card)] shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-[var(--border)] bg-[var(--background-card)] px-6 py-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold text-[var(--foreground)]">Results: {quiz.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Score Card */}
          <div className="rounded-xl border border-[var(--success)]/20 bg-[var(--success-light)] p-6 text-center mb-6">
            <p className="text-4xl font-bold text-[var(--success)]">{attempt.score}/{attempt.total_points}</p>
            <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
              {percentage}% &middot; {correctCount} correct{incorrectCount > 0 ? `, ${incorrectCount} incorrect` : ''}{unansweredCount > 0 ? `, ${unansweredCount} unanswered` : ''}
            </p>
          </div>

          {/* Question Review */}
          <div className="space-y-3">
            {quiz.questions.sort((a, b) => a.order - b.order).map((q, idx) => {
              const answer = attempt.answers.find((a) => a.question_id === q.id);
              const isCorrect = answer?.is_correct;
              return (
                <div key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-4">
                  <div className="flex items-start gap-3">
                    {isCorrect === true ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--success)]" />
                    ) : isCorrect === false ? (
                      <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--error)]" />
                    ) : (
                      <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--warning)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">{idx + 1}. {q.question_text}</p>
                      <div className="mt-2 space-y-1 text-xs">
                        <p className="text-[var(--foreground-muted)]">
                          Your answer:{' '}
                          <span className={cn(
                            'font-medium',
                            isCorrect === true ? 'text-[var(--success)]' : isCorrect === false ? 'text-[var(--error)]' : 'text-[var(--warning)]'
                          )}>
                            {answer?.answer || '(no answer)'}
                          </span>
                        </p>
                        {isCorrect === false && (
                          <p className="text-[var(--success)] font-medium">
                            Correct answer: {q.correct_answer}
                          </p>
                        )}
                        {isCorrect === null && (
                          <p className="text-[var(--foreground-muted)]">
                            Expected: {q.correct_answer}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end rounded-b-2xl border-t border-[var(--border)] bg-[var(--background-card)] px-6 py-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
