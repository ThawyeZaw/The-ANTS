'use client';

import type { TimerPhase } from '@/constants/pomodoro';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigitalClockProps {
  remainingMs: number;
  totalMs: number;
  phase: TimerPhase;
  isPaused: boolean;
  isRunning?: boolean;
  accentColor?: string;
  className?: string;
  showPausedLabel?: boolean;
  activeExamAlert?: '15m' | '5m' | null;
  /** Overlay sits on a vibe photo (Focus Mode + stage) */
  surface?: 'theme' | 'stage';
}

const PHASE_COLOR: Record<TimerPhase, string> = {
  focus: '#f59e0b',
  short_break: '#10b981',
  long_break: '#818cf8',
  past_paper: '#06b6d4',
};

function formatParts(ms: number): { hh?: string; mm: string; ss: string } {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return {
      hh: String(hours).padStart(2, '0'),
      mm: String(minutes).padStart(2, '0'),
      ss: String(seconds).padStart(2, '0'),
    };
  }

  return {
    mm: String(Math.floor(totalSeconds / 60)).padStart(2, '0'),
    ss: String(seconds).padStart(2, '0'),
  };
}

export default function DigitalClock({
  remainingMs,
  totalMs,
  phase,
  isPaused,
  isRunning = false,
  accentColor,
  className,
  showPausedLabel = true,
  activeExamAlert,
  surface = 'theme',
}: DigitalClockProps) {
  const isPastPaper = phase === 'past_paper';
  const isFinalFive = isPastPaper && remainingMs <= 5 * 60 * 1000 && remainingMs > 0;

  const defaultAccent = isFinalFive ? '#ef4444' : PHASE_COLOR[phase];
  const accent = accentColor ?? defaultAccent;

  const progress = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 1;
  const circumference = 2 * Math.PI * 122;
  const dashOffset = circumference * (1 - progress);
  const { hh, mm, ss } = formatParts(remainingMs);
  const onStage = surface === 'stage';
  const digitColor = onStage ? '#fff' : 'var(--foreground)';
  const trackStroke = onStage
    ? 'rgba(255,255,255,0.22)'
    : 'color-mix(in srgb, var(--foreground) 14%, transparent)';

  return (
    <div className={cn('flex min-h-0 w-full flex-col items-center justify-center', className)}>
      {/* Exam Alert Banner if within 15m / 5m trigger */}
      {activeExamAlert && (
        <div
          className={cn(
            'mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide uppercase transition-all duration-300 animate-bounce',
            activeExamAlert === '5m'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md',
          )}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{activeExamAlert === '5m' ? '5 Minutes Remaining — Conclude Answers' : '15 Minutes Remaining — Final Review'}</span>
        </div>
      )}

      <div
        className={cn(
          'pomo-clock flex items-center justify-center',
          isRunning && !isPaused && 'pomo-clock-breathe',
          isFinalFive && isRunning && 'animate-pulse',
        )}
      >
        <svg
          viewBox="0 0 280 280"
          className="absolute inset-0 h-full w-full -rotate-90"
          aria-hidden
        >
          {/* Background track circle */}
          <circle
            cx={140}
            cy={140}
            r={122}
            fill="none"
            stroke={trackStroke}
            strokeWidth={4}
          />

          {/* Exam Milestone notches (75%, 50%, 25%, 10%) */}
          {isPastPaper && (
            <>
              <circle cx={140} cy={18} r={2.5} fill={trackStroke} />
              <circle cx={262} cy={140} r={2.5} fill={trackStroke} />
              <circle cx={140} cy={262} r={2.5} fill={trackStroke} />
              <circle cx={18} cy={140} r={2.5} fill={trackStroke} />
            </>
          )}

          {/* Progress stroke */}
          <circle
            cx={140}
            cy={140}
            r={122}
            fill="none"
            stroke={accent}
            strokeWidth={isFinalFive ? 5 : 4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-300 ease-linear"
            style={{
              filter: isRunning && !isPaused ? `drop-shadow(0 0 10px ${accent})` : undefined,
            }}
          />
        </svg>

        <div
          className={cn(
            'pomo-clock-digits relative z-10 flex min-w-0 items-baseline justify-center gap-0.5 tabular-nums leading-none select-none sm:gap-1',
            onStage && 'pomo-read',
          )}
          style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', ui-monospace, monospace)",
            opacity: isPaused ? 0.8 : 1,
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Optional Hours digit for long exams */}
          {hh !== undefined && (
            <>
              <span className={cn('pomo-digit font-semibold tracking-tight', hh.length > 0 && 'text-[2.2rem] sm:text-[3.2rem]')} style={{ color: digitColor }}>
                {hh}
              </span>
              <span
                className={cn(
                  'pomo-colon pb-1 font-light text-xl sm:text-2xl',
                  isRunning && !isPaused && 'pomo-colon-blink',
                )}
                style={{ color: accent }}
              >
                :
              </span>
            </>
          )}

          {/* Minutes digit */}
          <span className={cn('pomo-digit font-semibold tracking-tight', hh !== undefined ? 'text-[2.2rem] sm:text-[3.2rem]' : '')} style={{ color: digitColor }}>
            {mm}
          </span>

          {/* Colon divider */}
          <span
            className={cn(
              'pomo-colon pb-1 font-light',
              hh !== undefined && 'text-xl sm:text-2xl',
              isRunning && !isPaused && 'pomo-colon-blink',
            )}
            style={{ color: accent }}
          >
            :
          </span>

          {/* Seconds digit */}
          <span className={cn('pomo-digit font-semibold tracking-tight', hh !== undefined ? 'text-[2.2rem] sm:text-[3.2rem]' : '')} style={{ color: digitColor }}>
            {ss}
          </span>
        </div>
      </div>

      {showPausedLabel && isPaused && (
        <p
          className={cn(
            'mt-2 shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em]',
            onStage ? 'pomo-read text-white/70' : 'text-foreground-muted',
          )}
        >
          Paused
        </p>
      )}
    </div>
  );
}
