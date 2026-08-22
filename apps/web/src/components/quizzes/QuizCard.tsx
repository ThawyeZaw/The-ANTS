'use client';

import { Brain, Clock, Pencil, Trash2, Share2, Play, Eye, Globe, Lock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { cn, formatDate } from '@/lib/utils';
import type { QuizStandaloneUser, QuizStandaloneOfficial, QuizStatus } from '@/types/quiz';

interface QuizCardProps {
  quiz: QuizStandaloneUser | QuizStandaloneOfficial;
  onEdit?: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
  onShare?: (quizId: string) => void;
  onHostLive?: (quizId: string) => void;
  onTakeQuiz?: (quizId: string) => void;
  showActions?: boolean;
}

function isOfficial(q: QuizStandaloneUser | QuizStandaloneOfficial): q is QuizStandaloneOfficial {
  return 'review_status' in q;
}

const statusBadgeStyles: Record<QuizStatus, string> = {
  draft: 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]',
  published: 'bg-[var(--success-light)] text-[var(--success)]',
  archived: 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] line-through',
};

export default function QuizCard({
  quiz,
  onEdit,
  onDelete,
  onShare,
  onHostLive,
  onTakeQuiz,
  showActions = true,
}: QuizCardProps) {
  const qCount = quiz.questions.length;
  const totalPts = quiz.questions.reduce((s, q) => s + q.points, 0);

  return (
    <div className="group rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-5 transition-all duration-200 hover:border-[var(--primary)]/30 hover:-translate-y-0.5 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
            <h3 className="font-semibold text-[var(--foreground)] truncate">{quiz.title}</h3>
          </div>
          {quiz.description && (
            <p className="text-sm text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
              {quiz.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {quiz.status === 'draft' && onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(quiz.id); }}
                className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--accent)]"
                title="Edit quiz"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onShare && (
              <button
                onClick={(e) => { e.stopPropagation(); onShare(quiz.id); }}
                className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--primary)]"
                title="Share quiz"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            )}
            {quiz.status === 'published' && onHostLive && (
              <button
                onClick={(e) => { e.stopPropagation(); onHostLive(quiz.id); }}
                className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--warning)]"
                title="Host live session"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(quiz.id); }}
                className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--error)]"
                title="Delete quiz"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-muted)] mb-3">
        <span>{qCount} question{qCount !== 1 ? 's' : ''}</span>
        <span className="text-[var(--border)]">·</span>
        <span>{totalPts} point{totalPts !== 1 ? 's' : ''}</span>
        {quiz.time_limit_minutes && (
          <>
            <span className="text-[var(--border)]">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />{quiz.time_limit_minutes} min
            </span>
          </>
        )}
        <span className="text-[var(--border)]">·</span>
        <span>{formatDate(quiz.created_at)}</span>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status badge */}
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
          statusBadgeStyles[quiz.status]
        )}>
          {quiz.status}
        </span>

        {/* Privacy badge */}
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
          quiz.is_public
            ? 'bg-[var(--primary-light)] text-[var(--primary)]'
            : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
        )}>
          {quiz.is_public ? (
            <><Globe className="h-3 w-3" /> Public</>
          ) : (
            <><Lock className="h-3 w-3" /> Private</>
          )}
        </span>

        {/* Difficulty badge (if applicable) */}
        {quiz.difficulty && (
          <span className="rounded-full bg-[var(--background-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground-secondary)]">
            {quiz.difficulty}
          </span>
        )}

        {/* Review status for official quizzes */}
        {isOfficial(quiz) && quiz.review_status === 'approved' && (
          <Badge variant="success">Approved</Badge>
        )}
        {isOfficial(quiz) && quiz.review_status === 'pending_review' && (
          <Badge variant="warning">Pending Review</Badge>
        )}
        {isOfficial(quiz) && quiz.review_status === 'rejected' && (
          <Badge variant="error">Rejected</Badge>
        )}
      </div>

      {/* Action buttons (bottom) */}
      {showActions && (
        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-2">
          {quiz.status === 'draft' && onEdit && (
            <Button size="sm" variant="secondary" onClick={() => onEdit(quiz.id)}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          )}
          {quiz.status === 'published' && onTakeQuiz && (
            <Button size="sm" onClick={() => onTakeQuiz(quiz.id)}>
              <Eye className="h-3 w-3" /> Take Quiz
            </Button>
          )}
          {quiz.status === 'published' && onHostLive && (
            <Button size="sm" variant="secondary" onClick={() => onHostLive(quiz.id)}>
              <Play className="h-3 w-3" /> Host Live
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
