'use client';

import { useState } from 'react';
import { Clock, Brain, Award, Plus, Pencil, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';
import type { Quiz, QuizAttempt, QuizQuestion } from '@/types';
import QuizCreator from './QuizCreator';
import QuizTakeModal from './QuizTakeModal';

interface QuizzesPanelProps {
  classroomId: string;
  quizzes: Quiz[];
  currentUserId: string;
  isTeacher: boolean;
  curriculumIds: string[];
  getQuizAttempt: (quizId: string, studentId: string) => QuizAttempt | undefined;
  onPublish: (quizId: string) => void;
  onSubmit: (quizId: string, answers: { question_id: string; answer: string }[]) => void;
  onCreate: (data: {
    classroom_id: string;
    title: string;
    description?: string;
    time_limit_minutes?: number;
    due_date?: string;
    questions: QuizQuestion[];
    created_by: string;
  }) => void;
  onEdit?: (quizId: string, data: {
    title: string;
    description?: string;
    time_limit_minutes?: number;
    due_date?: string;
    questions: QuizQuestion[];
  }) => void;
  onDelete?: (quizId: string) => void;
}

export default function QuizzesPanel({
  classroomId,
  quizzes,
  currentUserId,
  isTeacher,
  curriculumIds,
  getQuizAttempt,
  onPublish,
  onSubmit,
  onCreate,
  onEdit,
  onDelete,
}: QuizzesPanelProps) {
  const [creating, setCreating] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [viewingQuizId, setViewingQuizId] = useState<string | null>(null);
  const [takingQuizId, setTakingQuizId] = useState<string | null>(null);
  const [viewingResultId, setViewingResultId] = useState<string | null>(null);
  const [, forceRender] = useState(0);

  const classroomQuizzes = quizzes.filter((q) => q.classroom_id === classroomId);
  const viewingQuiz = viewingQuizId ? quizzes.find((q) => q.id === viewingQuizId) : null;
  const takingQuiz = takingQuizId ? quizzes.find((q) => q.id === takingQuizId) : null;
  const resultQuiz = viewingResultId ? quizzes.find((q) => q.id === viewingResultId) : null;
  const resultAttempt = viewingResultId ? getQuizAttempt(viewingResultId, currentUserId) : null;
  const editingQuiz = editingQuizId ? quizzes.find((q) => q.id === editingQuizId) : null;

  // ── Modal: Taking Quiz ────────────────────────────────────────────────────
  if (takingQuiz) {
    return (
      <>
        <QuizTakeModal
          quiz={takingQuiz}
          onClose={() => { setTakingQuizId(null); setViewingQuizId(null); }}
          onSubmit={(quizId, answers) => {
            onSubmit(quizId, answers);
            setTakingQuizId(null);
            setViewingQuizId(null);
            setTimeout(() => {
              setViewingResultId(quizId);
              forceRender((k) => k + 1);
            }, 100);
          }}
        />
        {renderList()}
      </>
    );
  }

  // ── Modal: Viewing Results ────────────────────────────────────────────────
  if (resultQuiz && resultAttempt) {
    return (
      <>
        <QuizTakeModal
          quiz={resultQuiz}
          existingAttempt={resultAttempt}
          onClose={() => setViewingResultId(null)}
          onSubmit={() => {}}
        />
        {renderList()}
      </>
    );
  }

  // ── Modal: Viewing Quiz Preview ───────────────────────────────────────────
  if (viewingQuiz) {
    const totalPts = viewingQuiz.questions.reduce((s, q) => s + q.points, 0);
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
          <div className="w-full max-w-3xl my-8 rounded-2xl border border-[var(--border)] bg-[var(--background-card)] shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-2xl border-b border-[var(--border)] bg-[var(--background-card)] px-6 py-4">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="font-semibold text-[var(--foreground)]">{viewingQuiz.title}</h2>
                <span className={cn('text-xs font-medium rounded-full px-2.5 py-0.5',
                  viewingQuiz.status === 'draft' ? 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]' : 'bg-[var(--success-light)] text-[var(--success)]')}>
                  {viewingQuiz.status}
                </span>
              </div>
              <button
                onClick={() => setViewingQuizId(null)}
                className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {viewingQuiz.description && <p className="text-sm text-[var(--foreground-secondary)]">{viewingQuiz.description}</p>}

              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)]">
                <span>{viewingQuiz.questions.length} questions</span>
                <span>{totalPts} points</span>
                {viewingQuiz.time_limit_minutes && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{viewingQuiz.time_limit_minutes} min</span>}
                {viewingQuiz.due_date && <span>Due {formatDate(viewingQuiz.due_date)}</span>}
              </div>

              <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto">
                {viewingQuiz.questions.sort((a, b) => a.order - b.order).map((q, idx) => (
                  <div key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-4">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[var(--primary-light)] text-xs font-bold text-[var(--primary)] mr-2">{idx + 1}</span>
                      {q.question_text}
                      <span className="ml-1 text-xs text-[var(--foreground-muted)]">({q.points} pt{q.points !== 1 ? 's' : ''})</span>
                    </p>
                    <div className="mt-2 ml-7 text-xs text-[var(--foreground-muted)]">
                      {q.type === 'multiple_choice' && <span>Multiple Choice</span>}
                      {q.type === 'true_false' && <span>True / False</span>}
                      {q.type === 'short_answer' && <span>Short Answer</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                {viewingQuiz.status === 'draft' && isTeacher && (
                  <Button onClick={() => { onPublish(viewingQuiz.id); setViewingQuizId(null); }}>
                    Publish Quiz
                  </Button>
                )}
                {viewingQuiz.status === 'published' && (
                  <Button onClick={() => { setTakingQuizId(viewingQuiz.id); setViewingQuizId(null); }}>
                    {getQuizAttempt(viewingQuiz.id, currentUserId) ? 'Retake Quiz' : 'Take Quiz'}
                  </Button>
                )}
                {getQuizAttempt(viewingQuiz.id, currentUserId) && (
                  <Button variant="secondary" onClick={() => { setViewingResultId(viewingQuiz.id); setViewingQuizId(null); }}>
                    View Results
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setViewingQuizId(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
        {renderList()}
      </>
    );
  }

  // ── Editing Quiz (inline) ─────────────────────────────────────────────────
  if (editingQuiz) {
    return (
      <QuizCreator
        curriculumIds={curriculumIds}
        classroomId={classroomId}
        currentUserId={currentUserId}
        initialQuiz={editingQuiz}
        onSaveEdit={(quizId, data) => {
          onEdit?.(quizId, data);
          setEditingQuizId(null);
        }}
        onCancel={() => setEditingQuizId(null)}
      />
    );
  }

  // ── Creating Quiz (inline) ────────────────────────────────────────────────
  if (creating) {
    return (
      <QuizCreator
        curriculumIds={curriculumIds}
        classroomId={classroomId}
        currentUserId={currentUserId}
        onCreate={(data) => {
          onCreate(data);
          setCreating(false);
        }}
        onCancel={() => setCreating(false)}
      />
    );
  }

  // ── List View (default) ───────────────────────────────────────────────────
  return renderList();

  function renderList() {
    return (
      <div className="space-y-4">
        {isTeacher && (
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--foreground-secondary)]">
              {classroomQuizzes.length} quiz{classroomQuizzes.length !== 1 ? 'zes' : ''}
            </h3>
            <Button size="sm" onClick={() => setCreating(true)} icon={<Plus className="h-3.5 w-3.5" />}>
              Create Quiz
            </Button>
          </div>
        )}

        {classroomQuizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-16 text-center">
            <Brain className="h-12 w-12 text-[var(--foreground-muted)] mb-3" />
            <p className="text-sm text-[var(--foreground-secondary)]">No quizzes yet.</p>
            {isTeacher && (
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Create a quiz manually or generate one with AI.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {classroomQuizzes.map((quiz) => {
              const attempt = getQuizAttempt(quiz.id, currentUserId);
              const totalPts = quiz.questions.reduce((s, q) => s + q.points, 0);
              const isOwner = quiz.created_by === currentUserId;
              return (
                <div
                  key={quiz.id}
                  onClick={() => setViewingQuizId(quiz.id)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-4 transition-all duration-200 hover:border-[var(--primary)]/30 hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
                        <h4 className="font-medium text-[var(--foreground)]">{quiz.title}</h4>
                        <span className={cn('text-xs font-medium rounded-full px-2.5 py-0.5',
                          quiz.status === 'draft' ? 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]' : 'bg-[var(--success-light)] text-[var(--success)]')}>
                          {quiz.status}
                        </span>
                      </div>
                      {quiz.description && <p className="mt-1 text-sm text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">{quiz.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)]">
                        <span>{quiz.questions.length} questions</span>
                        <span>{totalPts} points</span>
                        {quiz.time_limit_minutes && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{quiz.time_limit_minutes} min</span>}
                        {quiz.due_date && <span>Due {formatDate(quiz.due_date)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {attempt && (
                        <button onClick={() => setViewingResultId(quiz.id)}
                          className="inline-flex items-center gap-1 rounded-full bg-[var(--success-light)] px-3 py-1 text-xs font-medium text-[var(--success)] hover:bg-[var(--success)]/20">
                          <Award className="h-3 w-3" />{attempt.score}/{attempt.total_points}
                        </button>
                      )}
                      {isOwner && quiz.status === 'draft' && (
                        <>
                          <button onClick={() => { setEditingQuizId(quiz.id); }} className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--accent)]" title="Edit quiz">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {onDelete && (
                            <button onClick={() => onDelete(quiz.id)} className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--error)]" title="Delete quiz">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                      {isOwner && quiz.status !== 'draft' && onDelete && (
                        <button onClick={() => onDelete(quiz.id)} className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--error)]" title="Delete quiz">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {quiz.status === 'draft' && isTeacher ? (
                        <Button variant="secondary" onClick={() => onPublish(quiz.id)}>Publish</Button>
                      ) : quiz.status === 'published' ? (
                        <Button onClick={() => setTakingQuizId(quiz.id)}>{attempt ? 'Retake' : 'Take Quiz'}</Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}
