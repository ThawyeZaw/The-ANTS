'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — WeeklyActivityChart
// Hand-rolled SVG 7-day bar chart. Two series: topics completed + cards reviewed.
// Follows Pomodoro StatsPanel pattern — zero charting library dependency.
// ──────────────────────────────────────────────────────────────────────────────

import { useWeeklyActivity } from '@/hooks/useLessons';

// ── Day label helper ──────────────────────────────────────────────────────────

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function WeeklyActivityChartSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 animate-pulse space-y-4">
      <div className="h-4 w-36 rounded bg-[var(--border)]" />
      <div className="flex items-end gap-3 h-28">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-[var(--border)]"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex-1 h-3 rounded bg-[var(--border)]" />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WeeklyActivityChart() {
  const { data, loading } = useWeeklyActivity();

  if (loading) return <WeeklyActivityChartSkeleton />;

  const maxValue = Math.max(
    1,
    ...data.map((d) => d.topicsCompleted + d.cardsReviewed)
  );
  const barGap = 8;
  const totalBars = data.length;
  const chartWidth = 100;
  const chartHeight = 72;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 space-y-4 animate-fade-in">
      <p className="text-sm font-semibold text-[var(--foreground)]">
        Last 7 Days
      </p>

      {/* Chart */}
      <div className="w-full" role="img" aria-label="Weekly study activity chart">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-28"
          preserveAspectRatio="none"
          role="presentation"
        >
          {data.map((d, i) => {
            const barW = (chartWidth - barGap * (totalBars + 1)) / totalBars;
            const x = barGap + i * (barW + barGap);
            const topicsH = maxValue > 0 ? (d.topicsCompleted / maxValue) * chartHeight : 0;
            const cardsH = maxValue > 0 ? (d.cardsReviewed / maxValue) * chartHeight : 0;

            return (
              <g key={d.date}>
                {/* Topics completed bar */}
                <rect
                  x={x + barW * 0.05}
                  y={chartHeight - topicsH}
                  width={barW * 0.4}
                  height={topicsH}
                  rx="1"
                  fill="var(--primary)"
                  opacity="0.7"
                >
                  <title>
                    {d.date}: {d.topicsCompleted} topics completed, {d.cardsReviewed} cards reviewed
                  </title>
                </rect>
                {/* Cards reviewed bar */}
                <rect
                  x={x + barW * 0.55}
                  y={chartHeight - cardsH}
                  width={barW * 0.4}
                  height={cardsH}
                  rx="1"
                  fill="var(--accent)"
                  opacity="0.7"
                >
                  <title>
                    {d.date}: {d.topicsCompleted} topics completed, {d.cardsReviewed} cards reviewed
                  </title>
                </rect>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Day labels */}
      <div className="flex gap-2 justify-between">
        {data.map((d) => (
          <span
            key={d.date}
            className="flex-1 text-center text-xs text-[var(--foreground-muted)]"
          >
            {dayLabel(d.date)}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-[var(--foreground-muted)]">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-sm bg-[var(--primary)] opacity-70" />
          Topics
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)] opacity-70" />
          Cards Reviewed
        </div>
      </div>
    </section>
  );
}
