'use client';

import type { TimerPhase } from '@/constants/pomodoro';
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
  /** Overlay sits on a vibe photo (Focus Mode + stage) */
  surface?: 'theme' | 'stage';
}

const PHASE_COLOR: Record<TimerPhase, string> = {
  focus: '#f59e0b',
  short_break: '#10b981',
  long_break: '#818cf8',
};

function formatParts(ms: number): { mm: string; ss: string } {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    mm: String(minutes).padStart(2, '0'),
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
  surface = 'theme',
}: DigitalClockProps) {
  const accent = accentColor ?? PHASE_COLOR[phase];
  const progress = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 1;
  const circumference = 2 * Math.PI * 122;
  const dashOffset = circumference * (1 - progress);
  const { mm, ss } = formatParts(remainingMs);
  const onStage = surface === 'stage';
  const digitColor = onStage ? '#fff' : 'var(--foreground)';
  const trackStroke = onStage
    ? 'rgba(255,255,255,0.22)'
    : 'color-mix(in srgb, var(--foreground) 14%, transparent)';

  return (
    <div className={cn('flex min-h-0 w-full flex-col items-center justify-center', className)}>
      <div
        className={cn(
          'pomo-clock flex items-center justify-center',
          isRunning && !isPaused && 'pomo-clock-breathe',
        )}
      >
        <svg
          viewBox="0 0 280 280"
          className="absolute inset-0 h-full w-full -rotate-90"
          aria-hidden
        >
          <circle
            cx={140}
            cy={140}
            r={122}
            fill="none"
            stroke={trackStroke}
            strokeWidth={4}
          />
          <circle
            cx={140}
            cy={140}
            r={122}
            fill="none"
            stroke={accent}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-300 ease-linear"
            style={{
              filter: isRunning && !isPaused ? `drop-shadow(0 0 8px ${accent})` : undefined,
            }}
          />
        </svg>

        <div
          className={cn(
            'pomo-clock-digits relative z-10 flex min-w-0 items-baseline justify-center gap-0.5 tabular-nums leading-none select-none sm:gap-1',
            onStage && 'pomo-read',
          )}
          style={{
            fontFamily: "var(--hp-font-mono, 'JetBrains Mono', ui-monospace, monospace)",
            opacity: isPaused ? 0.8 : 1,
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="pomo-digit font-semibold tracking-tight" style={{ color: digitColor }}>
            {mm}
          </span>
          <span
            className={cn(
              'pomo-colon pb-1 font-light',
              isRunning && !isPaused && 'pomo-colon-blink',
            )}
            style={{ color: accent }}
          >
            :
          </span>
          <span className="pomo-digit font-semibold tracking-tight" style={{ color: digitColor }}>
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
