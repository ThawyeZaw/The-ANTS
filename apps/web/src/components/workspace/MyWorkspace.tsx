'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — MyWorkspace
// Personal hub focused on exam countdowns (notes/decks/quizzes retired).
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Clock,
  ExternalLink, Briefcase,
  ArrowRight, BookMarked,
  AlertTriangle, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';
import WorkspaceErrorBoundary from './WorkspaceErrorBoundary';
import { useWorkspaceToast } from './WorkspaceToast';
import { TabContentSkeleton } from './WorkspaceSkeleton';

function formatTimeLeft(daysLeft: number): string {
  if (daysLeft < 0) return 'Past';
  if (daysLeft === 0) return 'Today';
  if (daysLeft === 1) return 'Tomorrow';
  if (daysLeft <= 7) return `${daysLeft} days`;
  if (daysLeft <= 30) return `${Math.ceil(daysLeft / 7)} weeks`;
  return `${Math.ceil(daysLeft / 30)} months`;
}

function WorkspaceErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 mb-4">
      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-600">Error loading content</p>
        <p className="text-xs text-red-600 mt-0.5">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-xs text-red-500 underline hover:no-underline cursor-pointer shrink-0"
      >
        Dismiss
      </button>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, cta, ctaHref }: {
  icon: React.ElementType; title: string; description: string;
  cta: string; ctaHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--background-card)] p-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
        <Icon size={28} />
      </div>
      <h3 className="mb-1 text-base font-bold text-[var(--foreground)]">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-[var(--foreground-secondary)]">{description}</p>
      <Link
        href={ctaHref}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all"
      >
        {cta}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function ExamsTab({
  countdowns,
  isLoading,
}: {
  countdowns: ReturnType<typeof useCountdown>['groupedCountdowns'];
  isLoading: boolean;
}) {
  const router = useRouter();
  const { showToast } = useWorkspaceToast();
  const allCountdowns = Object.values(countdowns).flat();

  const handleOpenCountdown = useCallback(() => {
    try {
      router.push(`/countdown`);
    } catch {
      showToast('Failed to open countdown. Please try again.', 'error');
    }
  }, [router, showToast]);

  if (isLoading) return <TabContentSkeleton tab="exams" />;

  if (allCountdowns.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No exam countdowns yet"
        description="Add official exam dates or create custom countdowns. Track days remaining and study with purpose."
        cta="Browse Exams"
        ctaHref="/library?tab=exams"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--foreground-secondary)]">
          {allCountdowns.length} countdown{allCountdowns.length !== 1 ? 's' : ''}
        </p>
        <Link
          href="/countdown"
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
        >
          <ExternalLink size={12} /> Manage All
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allCountdowns.map(c => {
          const daysLeft = c.timeLeft.days;
          const isPast = c.timeLeft.isPast;
          const isCritical = daysLeft <= 7 && !isPast;
          const isWarning = daysLeft <= 30 && !isPast && !isCritical;

          return (
            <div
              key={c.id}
              onClick={handleOpenCountdown}
              className={cn(
                'rounded-2xl border p-4 transition-all cursor-pointer group',
                isPast
                  ? 'border-[var(--border)] bg-[var(--background-secondary)] opacity-60 hover:opacity-80'
                  : isCritical
                    ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50 shadow-sm'
                    : isWarning
                      ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 shadow-sm'
                      : 'border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--primary)]/30 hover:shadow-sm'
              )}
              role="article"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') handleOpenCountdown(); }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                  c.priority_indicator === 'high'
                    ? 'bg-red-500/15 text-red-700'
                    : c.priority_indicator === 'medium'
                      ? 'bg-amber-500/15 text-amber-700'
                      : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
                )}>
                  {c.priority_indicator ?? 'medium'}
                </span>
                <span className="text-[10px] text-[var(--foreground-muted)] font-medium">
                  {c.qualification_group}
                </span>
              </div>

              <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                {c.custom_title}
              </h3>

              {isPast ? (
                <p className="text-xs text-[var(--foreground-muted)] italic">
                  Exam has passed — {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''} ago
                </p>
              ) : (
                <>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-[var(--foreground-muted)]">Time remaining</span>
                      <span className={cn(
                        'font-bold',
                        isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-[var(--foreground)]'
                      )}>
                        {formatTimeLeft(daysLeft)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[var(--primary)]'
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, 100 - (daysLeft / 365) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { value: c.timeLeft.days, label: 'Days' },
                      { value: c.timeLeft.hours, label: 'Hours' },
                      { value: c.timeLeft.minutes, label: 'Mins' },
                    ].map(({ value, label }) => (
                      <div key={label} className="text-center bg-[var(--background)] rounded-lg py-2 group-hover:bg-[var(--primary)]/5 transition-colors">
                        <p className={cn(
                          'text-base font-black tabular-nums',
                          isCritical ? 'text-red-600' : 'text-[var(--foreground)]'
                        )}>
                          {String(Math.max(0, value)).padStart(2, '0')}
                        </p>
                        <p className="text-[9px] text-[var(--foreground-muted)]">{label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MyWorkspace() {
  const { user } = useAuth();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const { groupedCountdowns } = useCountdown(user?.id);
  const examCount = Object.values(groupedCountdowns).flat().length;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Loader2 className="h-6 w-6 text-[var(--primary)] animate-spin" />
        <p className="text-sm text-[var(--foreground-muted)]">Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[var(--primary)]" />
            <h1 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
              My Workspace
            </h1>
          </div>
          <p className="text-sm text-[var(--foreground-secondary)]">
            Your personal study hub — exam countdowns and enrolled courses in one place.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/library?tab=courses"
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all"
          >
            <BookMarked size={13} /> Library
          </Link>
          <Link
            href="/countdown"
            className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--primary-hover)] transition-all"
          >
            <Clock size={13} /> Exam Countdown
          </Link>
        </div>
      </div>

      {globalError && (
        <WorkspaceErrorBanner message={globalError} onDismiss={() => setGlobalError(null)} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-2.5">
          <Clock className="h-4 w-4 mb-1 text-[var(--primary)]" />
          <span className="text-lg font-black text-[var(--foreground)] tabular-nums">{examCount}</span>
          <span className="text-[10px] text-[var(--foreground-muted)] mt-0.5">Exams</span>
        </div>
        <Link
          href="/library?tab=courses"
          className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-2.5 hover:border-[var(--primary)]/20 transition-all"
        >
          <BookOpen className="h-4 w-4 mb-1 text-emerald-500" />
          <span className="text-lg font-black text-[var(--foreground)] tabular-nums">→</span>
          <span className="text-[10px] text-[var(--foreground-muted)] mt-0.5">Courses</span>
        </Link>
      </div>

      <WorkspaceErrorBoundary>
        <ExamsTab countdowns={groupedCountdowns} isLoading={false} />
      </WorkspaceErrorBoundary>
    </div>
  );
}
