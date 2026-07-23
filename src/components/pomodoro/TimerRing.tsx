'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro TimerRing
// PPP-owned: SVG circular progress ring with MM:SS display.
// Color driven by phase; animation via stroke-dashoffset (GPU-friendly).
// Respects prefers-reduced-motion.
// ──────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import type { TimerPhase } from '@/constants/pomodoro';

interface TimerRingProps {
  phase: TimerPhase;
  remainingMs: number;
  totalMs: number;
  isPaused: boolean;
  /** Additional CSS classes */
  className?: string;
}

const RING_RADIUS = 140;
const STROKE_WIDTH = 8;
const SVG_SIZE = (RING_RADIUS + STROKE_WIDTH) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const CENTER = SVG_SIZE / 2;

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function TimerRing({ phase, remainingMs, totalMs, isPaused, className = '' }: TimerRingProps) {
  const progress = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 1;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const strokeColor = phase === 'focus' ? 'var(--primary)' : 'var(--accent)';
  const trackColor = 'var(--border)';

  const timeDisplay = formatTime(remainingMs);

  const phaseLabel = useMemo(() => {
    switch (phase) {
      case 'focus':
        return 'Focus';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
    }
  }, [phase]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Phase label above the ring */}
      <span
        className="text-sm font-medium mb-3 tracking-wide uppercase"
        style={{ color: `var(--foreground-muted)` }}
      >
        {phaseLabel}
      </span>

      {/* Ring + time overlay — relative wrapper so text centers inside the SVG */}
      <div className="relative" style={{ width: SVG_SIZE, height: SVG_SIZE }}>
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="transform -rotate-90"
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke={trackColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none"
            style={{
              filter: `drop-shadow(0 0 6px ${strokeColor === 'var(--primary)' ? 'rgba(51,97,160,0.3)' : 'rgba(40,191,127,0.3)'})`,
            }}
          />
        </svg>

        {/* Time display — now centered inside the ring, not the parent */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-5xl font-bold tabular-nums tracking-tight"
            style={{ color: 'var(--foreground)' }}
            aria-live="polite"
            aria-label={`${timeDisplay} remaining`}
          >
            {timeDisplay}
          </span>
          {isPaused && (
            <span
              className="text-xs mt-1 font-medium tracking-wide uppercase"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Paused
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
