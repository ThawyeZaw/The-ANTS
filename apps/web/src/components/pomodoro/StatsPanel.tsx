'use client';

import { useEffect } from 'react';
import { BarChart3, Clock, X } from 'lucide-react';
import type { PomodoroStatsLog } from '@/constants/pomodoro';
import { cn } from '@/lib/utils';

interface StatsPanelProps {
  stats: PomodoroStatsLog;
  surface?: 'theme' | 'stage';
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
const CHART_HEIGHT = 90;
const CHART_PADDING = { top: 10, right: 8, bottom: 18, left: 8 };
const BAR_GAP = 6;
const DAY_COUNT = 7;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayLabel(dayIndex: number): string {
  const today = new Date().getDay();
  const targetDay = (today - (DAY_COUNT - 1) + dayIndex + 7) % 7;
  return DAY_LABELS[targetDay];
}

export default function StatsPanel({ stats, surface = 'theme' }: StatsPanelProps) {
  const onStage = surface === 'stage';
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
  const grid = onStage ? 'rgba(255,255,255,0.16)' : 'var(--border)';
  const labelFill = onStage ? 'rgba(255,255,255,0.62)' : 'var(--foreground-muted)';
  const barFill = onStage ? '#fff' : 'var(--primary)';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-1.5">
        <Clock className={cn('h-3.5 w-3.5', onStage ? 'text-white/70 pomo-icon-read' : 'text-foreground-muted')} />
        <h3
          className={cn(
            'text-xs font-semibold uppercase tracking-[0.14em]',
            onStage ? 'pomo-read text-white/80' : 'text-foreground-secondary',
          )}
        >
          Last 7 days
        </h3>
      </div>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Weekly focus minutes chart"
        role="img"
      >
        {[0, 0.5, 1].map((ratio) => {
          const y = CHART_PADDING.top + chartAreaHeight * (1 - ratio);
          return (
            <line
              key={ratio}
              x1={CHART_PADDING.left}
              y1={y}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y2={y}
              stroke={grid}
              strokeWidth={1}
            />
          );
        })}

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
                fill={barFill}
                opacity={day.isToday ? 1 : 0.4}
              />
              <text
                x={x + barWidth / 2}
                y={CHART_HEIGHT - 4}
                textAnchor="middle"
                fontSize={10}
                fill={labelFill}
                fontFamily="var(--font-sans)"
              >
                {day.label}
              </text>
              {day.minutes > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill={labelFill}
                  fontFamily="var(--font-sans)"
                >
                  {Math.round(day.minutes)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p
        className={cn(
          'text-center text-[11px]',
          onStage ? 'pomo-read text-white/55' : 'text-foreground-muted',
        )}
      >
        {stats.allTimeFocusMinutes > 0
          ? `${Math.round(stats.allTimeFocusMinutes)} total focus minutes`
          : 'Complete a focus session to start the chart.'}
      </p>
    </div>
  );
}

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
  stats: PomodoroStatsLog;
}

export function StatsModal({ open, onClose, stats }: StatsModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in motion-reduce:animate-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close weekly stats"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pomo-stats-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-background-card p-5 shadow-xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 id="pomo-stats-title" className="text-base font-bold text-foreground sm:text-lg">
              Weekly stats
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted transition hover:bg-background-secondary hover:text-foreground focus-ring"
            aria-label="Close weekly stats"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <StatsPanel stats={stats} surface="theme" />
      </div>
    </div>
  );
}
