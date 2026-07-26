'use client';

import Link from 'next/link';
import { FileText, PenLine, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContributions } from '@/hooks/useContributions';
import type { ContributionItem } from '@/hooks/useContributions';

const TYPE_BADGE: Record<ContributionItem['type'], { label: string; color: string }> = {
  note:       { label: 'Note',       color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  flashcard:  { label: 'Flashcard',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  quiz:       { label: 'Quiz',       color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  curriculum: { label: 'Course',     color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  exam:       { label: 'Exam',       color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function MyContributions() {
  const { contributions, isLoading } = useContributions();

  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--border)]',
        'bg-[var(--background-card)] p-4'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-4 w-4 text-[var(--primary)]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          My Contributions
        </span>
        {contributions.length > 0 && (
          <span className="ml-auto text-xs text-[var(--foreground-muted)]">
            {contributions.length} item{contributions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        </div>
      ) : contributions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <PenLine className="h-8 w-8 text-[var(--foreground-muted)]" />
          <p className="text-sm text-[var(--foreground-muted)] max-w-xs">
            No contributions yet. Start creating resources to see them here.
          </p>
          <Link
            href="/contribute"
            className={cn(
              'text-sm font-medium text-[var(--primary)]',
              'hover:underline underline-offset-2',
              'transition-colors'
            )}
          >
            Go to Contribute →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {contributions.map((item) => (
            <li
              key={`${item.type}-${item.id}`}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5',
                'bg-[var(--background-secondary)]',
                'border border-transparent',
                'hover:border-[var(--border)] transition-colors'
              )}
            >
              {/* Type badge */}
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0',
                  TYPE_BADGE[item.type]?.color || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                )}
              >
                {TYPE_BADGE[item.type]?.label || item.type}
              </span>

              {/* Title & meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-[var(--foreground-muted)] capitalize">
                    {item.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-[var(--foreground-muted)]/50">·</span>
                  <span className="text-[11px] text-[var(--foreground-muted)]/50">
                    {formatDate(item.lastModified)}
                  </span>
                </div>
              </div>

              {/* Edit button */}
              <Link
                href={item.editHref}
                title="Edit"
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5',
                  'text-xs font-medium',
                  'bg-[var(--background)] border border-[var(--border)]',
                  'text-[var(--foreground-muted)]',
                  'hover:text-[var(--primary)] hover:border-[var(--primary)]/30',
                  'transition-colors shrink-0'
                )}
              >
                <Edit3 className="h-3 w-3" />
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
