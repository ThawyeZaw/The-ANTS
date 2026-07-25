'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — ProgressOverview
// Ring percentage + subject breakdown bars + streak badge.
// Uses mock facade via useLessonStats hook.
// ──────────────────────────────────────────────────────────────────────────────

import { Flame } from 'lucide-react';
import { useLessonStats } from '@/hooks/useLessons';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProgressOverviewProps {
  curriculumId: string | null;
}

// ── Progress Ring ─────────────────────────────────────────────────────────────

function ProgressRing({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="h-20 w-20 -rotate-90"
        viewBox="0 0 64 64"
        role="img"
        aria-label={`${clamped}% of curriculum complete`}
      >
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="5"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * circumference} ${circumference}`}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dasharray 1.2s ease-out, stroke-dashoffset 1.2s ease-out',
          }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[var(--foreground)]">
        {clamped}%
      </span>
    </div>
  );
}

// ── Subject Bar ───────────────────────────────────────────────────────────────

function SubjectBar({ name, percent }: { name: string; percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs font-medium text-[var(--foreground-secondary)] truncate">
        {name}
      </span>
      <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all duration-600 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-semibold text-[var(--foreground-muted)]">
        {clamped}%
      </span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function ProgressOverviewSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 space-y-5 animate-pulse">
      <div className="flex items-center gap-6 flex-wrap">
        <div className="h-20 w-20 rounded-full bg-[var(--border)]" />
        <div className="space-y-2 flex-1 min-w-0">
          <div className="h-4 w-32 rounded bg-[var(--border)]" />
          <div className="h-3 w-48 rounded bg-[var(--border)]" />
        </div>
        <div className="h-12 w-24 rounded-xl bg-[var(--border)]" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-2 w-24 rounded bg-[var(--border)]" />
            <div className="h-2 flex-1 rounded bg-[var(--border)]" />
            <div className="h-2 w-8 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProgressOverview({ curriculumId }: ProgressOverviewProps) {
  const { data, loading } = useLessonStats(curriculumId);

  if (loading) return <ProgressOverviewSkeleton />;
  if (!data) return null;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 space-y-5 animate-fade-in">
      {/* Top row: ring + streak */}
      <div className="flex items-center gap-6 flex-wrap">
        <ProgressRing percent={data.overallPercent} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Overall Progress
          </p>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            {data.subjectBreakdown.length} subject{data.subjectBreakdown.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--primary-light)] px-4 py-2.5">
          <Flame className="h-5 w-5 text-[var(--warning)]" />
          <span className="text-sm font-bold text-[var(--foreground)]">
            {data.currentStreak}-day streak
          </span>
        </div>
      </div>

      {/* Subject breakdown bars */}
      {data.subjectBreakdown.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
          {data.subjectBreakdown.map((s) => (
            <SubjectBar key={s.subjectId} name={s.name} percent={s.percent} />
          ))}
        </div>
      )}
    </section>
  );
}
