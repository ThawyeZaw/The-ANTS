'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — ConfidenceTrend
// Horizontal bar list showing topics with weakest confidence.
// Color + text label paired — never color alone.
// ──────────────────────────────────────────────────────────────────────────────

import { AlertTriangle } from 'lucide-react';
import { useLessonStats } from '@/hooks/useLessons';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConfidenceTrendProps {
  curriculumId: string | null;
}

// ── Confidence label & color ──────────────────────────────────────────────────

function confidenceMeta(level: number): { label: string; color: string } {
  if (level <= 1) return { label: 'Weak', color: 'var(--error)' };
  if (level <= 2) return { label: 'Developing', color: 'var(--warning)' };
  if (level <= 3) return { label: 'Building', color: 'var(--warning)' };
  if (level <= 4) return { label: 'Confident', color: 'var(--accent)' };
  return { label: 'Strong', color: 'var(--success)' };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function ConfidenceTrendSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 animate-pulse space-y-4">
      <div className="h-4 w-32 rounded bg-[var(--border)]" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 flex-1 rounded bg-[var(--border)]" />
          <div className="h-3 w-16 rounded bg-[var(--border)]" />
          <div className="h-5 w-16 rounded bg-[var(--border)]" />
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ConfidenceTrend({ curriculumId }: ConfidenceTrendProps) {
  const { data, loading } = useLessonStats(curriculumId);

  if (loading) return <ConfidenceTrendSkeleton />;
  if (!data || data.confidenceTrend.length === 0) return null;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
        <p className="text-sm font-semibold text-[var(--foreground)]">
          Topics to Review
        </p>
      </div>

      <div className="space-y-3">
        {data.confidenceTrend.map((item) => {
          const meta = confidenceMeta(item.confidence);
          return (
            <div
              key={item.topicId}
              className="flex items-center gap-3 text-sm"
            >
              <span className="flex-1 font-medium text-[var(--foreground)] truncate">
                {item.name}
              </span>
              <span
                className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  color: meta.color,
                  backgroundColor: `${meta.color}15`,
                }}
              >
                {meta.label}
              </span>
              <span className="shrink-0 text-xs text-[var(--foreground-muted)]">
                {item.confidence}/5
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
