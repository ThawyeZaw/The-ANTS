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
    ? 'rgba(255,255,255,0.18)'
    : 'color-mix(in srgb, var(--foreground) 12%, transparent)';

  return (
    <div className={cn('relative flex w-full max-w-[min(100%,18rem,36dvh)] flex-col items-center sm:max-w-[min(100%,19rem,40dvh)]', className)}>
      <div
        className={cn(
          'relative flex aspect-square w-full items-center justify-center',
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
            'relative z-10 flex min-w-0 items-baseline justify-center gap-0.5 tabular-nums leading-none select-none sm:gap-1',
            onStage && 'pomo-read',
          )}
          style={{
            fontFamily: "var(--hp-font-mono, 'JetBrains Mono', ui-monospace, monospace)",
            opacity: isPaused ? 0.8 : 1,
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          <span
            className="text-[clamp(2.35rem,11vh,4.75rem)] font-semibold tracking-tight"
            style={{ color: digitColor }}
          >
            {mm}
          </span>
          <span
            className={cn(
              'pb-1 text-[clamp(1.5rem,7vh,3rem)] font-light',
              isRunning && !isPaused && 'pomo-colon-blink',
            )}
            style={{ color: accent }}
          >
            :
          </span>
          <span
            className="text-[clamp(2.35rem,11vh,4.75rem)] font-semibold tracking-tight"
            style={{ color: digitColor }}
          >
            {ss}
          </span>
        </div>
      </div>

      {isPaused && (
        <p
          className={cn(
            'mt-2 text-[11px] font-semibold uppercase tracking-[0.18em]',
            onStage ? 'pomo-read text-white/70' : 'text-foreground-muted',
          )}
        >
          Paused
        </p>
      )}
    </div>
  );
}
