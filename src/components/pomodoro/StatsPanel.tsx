'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro StatsPanel
// PPP-owned: today's focus stats, streak display, hand-rolled SVG bar chart.
// ──────────────────────────────────────────────────────────────────────────────

import { Flame, Clock, CheckCircle } from 'lucide-react';
import type { PomodoroStatsLog } from '@/constants/pomodoro';

interface StatsPanelProps {
  stats: PomodoroStatsLog;
}

function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const CHART_WIDTH = 280;
const CHART_HEIGHT = 120;
const CHART_PADDING = { top: 8, right: 8, bottom: 20, left: 8 };
const BAR_GAP = 4;
const DAY_COUNT = 7;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayLabel(dayIndex: number): string {
  const today = new Date().getDay();
  // dayIndex 0 = 6 days ago, 6 = today
  const targetDay = (today - (DAY_COUNT - 1) + dayIndex + 7) % 7;
  return DAY_LABELS[targetDay];
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  // ── Build last 7 days data ──────────────────────────────────────────────
  const last7Days = Array.from({ length: DAY_COUNT }, (_, i) => {
    const date = daysAgoKey(DAY_COUNT - 1 - i);
    const entry = stats.entries.find((e) => e.date === date);
    return {
      label: getDayLabel(i),
      minutes: entry?.focusMinutes ?? 0,
      isToday: i === DAY_COUNT - 1,
    };
  });

  const maxMinutes = Math.max(1, ...last7Days.map((d) => d.minutes));

  const chartAreaWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const chartAreaHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const barWidth = (chartAreaWidth - BAR_GAP * (DAY_COUNT - 1)) / DAY_COUNT;

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'var(--background-card)',
        border: `1px solid var(--border)`,
      }}
    >
      <h3
        className="text-base font-semibold"
        style={{ color: 'var(--foreground)' }}
      >
        Your Stats
      </h3>

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-3">
        {/* Today's focus */}
        <div
          className="flex flex-col items-center gap-1 p-3 rounded-xl"
          style={{ background: 'var(--background-secondary)' }}
        >
          <Clock className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
            {(() => {
              const today = daysAgoKey(0);
              const entry = stats.entries.find((e) => e.date === today);
              return entry ? Math.round(entry.focusMinutes) : 0;
            })()}
          </span>
          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            min today
          </span>
        </div>

        {/* Sessions today */}
        <div
          className="flex flex-col items-center gap-1 p-3 rounded-xl"
          style={{ background: 'var(--background-secondary)' }}
        >
          <CheckCircle className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
            {(() => {
              const today = daysAgoKey(0);
              const entry = stats.entries.find((e) => e.date === today);
              return entry?.sessionsCompleted ?? 0;
            })()}
          </span>
          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            sessions
          </span>
        </div>

        {/* Streak */}
        <div
          className="flex flex-col items-center gap-1 p-3 rounded-xl"
          style={{ background: 'var(--background-secondary)' }}
        >
          <Flame className="h-5 w-5" style={{ color: 'var(--warning)' }} />
          <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
            {stats.currentStreak}
          </span>
          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            day streak
          </span>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div>
        <h4
          className="text-sm font-medium mb-3"
          style={{ color: 'var(--foreground-secondary)' }}
        >
          Last 7 Days
        </h4>
        <svg
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          aria-label="Weekly focus minutes chart"
          role="img"
        >
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = CHART_PADDING.top + chartAreaHeight * (1 - ratio);
            return (
              <line
                key={ratio}
                x1={CHART_PADDING.left}
                y1={y}
                x2={CHART_WIDTH - CHART_PADDING.right}
                y2={y}
                stroke="var(--border)"
                strokeWidth={1}
              />
            );
          })}

          {/* Bars */}
          {last7Days.map((day, i) => {
            const barHeight = maxMinutes > 0 ? (day.minutes / maxMinutes) * chartAreaHeight : 0;
            const x = CHART_PADDING.left + i * (barWidth + BAR_GAP);
            const y = CHART_PADDING.top + chartAreaHeight - barHeight;

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(1, barHeight)}
                  rx={3}
                  fill={day.isToday ? 'var(--primary)' : 'var(--primary)'}
                  opacity={day.isToday ? 1 : 0.4}
                />
                {/* Day label */}
                <text
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--foreground-muted)"
                  fontFamily="var(--font-sans)"
                >
                  {day.label}
                </text>
                {/* Minutes label if > 0 */}
                {day.minutes > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--foreground-muted)"
                    fontFamily="var(--font-sans)"
                  >
                    {Math.round(day.minutes)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* All-time total */}
      <div
        className="text-xs text-center pt-1"
        style={{ color: 'var(--foreground-muted)' }}
      >
        {stats.allTimeFocusMinutes > 0
          ? `${Math.round(stats.allTimeFocusMinutes)} total focus minutes — keep going!`
          : 'Start your first focus session above.'}
      </div>
    </div>
  );
}
