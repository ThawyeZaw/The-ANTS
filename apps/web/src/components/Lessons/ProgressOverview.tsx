'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — ProgressOverview
// Ring percentage + subject breakdown bars + dash-stat-pill streak badge.
// Uses mock facade via useLessonStats hook.
// Gradient progress fill matches DashboardLayout welcome card treatment.
// ──────────────────────────────────────────────────────────────────────────────

import { Flame, ClipboardCheck } from 'lucide-react';
import { useLessonStats } from '@/hooks/useLessons';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProgressOverviewProps {
  curriculumId: string | null;
}

// ── Progress Ring with gradient ───────────────────────────────────────────────

function ProgressRing({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashLength = (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="h-20 w-20 -rotate-90"
        viewBox="0 0 64 64"
        role="img"
        aria-label={`${clamped}% of curriculum complete`}
      >
        {/* Track */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="5"
        />
        {/* Gradient-filled progress */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dashLength} ${circumference}`}
          style={{
            transition: 'stroke-dasharray 0.8s ease-out',
          }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[var(--foreground)]">
        {clamped}%
      </span>
    </div>
  );
}

// ── Subject Bar with gradient ─────────────────────────────────────────────────

function SubjectBar({ name, percent }: { name: string; percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs font-medium text-[var(--foreground-secondary)] truncate">
        {name}
      </span>
      <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-br from-primary to-accent transition-all duration-500"
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
        <div className="h-12 w-32 rounded-full bg-[var(--border)]" />
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

// ── Dash Stat Pill ────────────────────────────────────────────────────────────

function DashStatPill({
  icon,
  iconBg,
  iconColor,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
}) {
  return (
    <div className="dash-stat-pill">
      <div
        className="dash-stat-pill__icon"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <div className="dash-stat-pill__value">{value}</div>
        <div className="dash-stat-pill__label">{label}</div>
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
      {/* Top row: ring + stats as dash-stat-pill */}
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

        {/* Stats as pills using dash-stat-pill pattern */}
        <div className="flex flex-wrap items-center gap-3">
          <DashStatPill
            icon={<ClipboardCheck className="h-5 w-5" />}
            iconBg="var(--primary-light)"
            iconColor="var(--primary)"
            value={data.subjectBreakdown.reduce((sum, s) => sum + Math.round(s.percent), 0) > 0 ? 'Active' : 'Start'}
            label="Topics this week"
          />
          <DashStatPill
            icon={<Flame className="h-5 w-5" />}
            iconBg="rgba(242,184,75,0.15)"
            iconColor="var(--warning)"
            value={data.currentStreak}
            label="Day streak"
          />
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
