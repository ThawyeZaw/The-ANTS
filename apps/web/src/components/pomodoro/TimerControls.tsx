'use client';

import { useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  hasStarted: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  accentColor?: string;
  surface?: 'theme' | 'stage';
}

export default function TimerControls({
  isRunning,
  isPaused,
  hasStarted,
  onStart,
  onPause,
  onResume,
  onReset,
  accentColor = 'var(--primary)',
  surface = 'theme',
}: TimerControlsProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning && !isPaused) onPause();
        else hasStarted ? onResume() : onStart();
      }
      if (e.code === 'KeyR') {
        e.preventDefault();
        onReset();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, isPaused, hasStarted, onStart, onPause, onResume, onReset]);

  const mainAction = isRunning && !isPaused ? onPause : hasStarted ? onResume : onStart;
  const mainIcon =
    isRunning && !isPaused ? (
      <Pause className="h-5 w-5 shrink-0" />
    ) : (
      <Play className="ml-0.5 h-5 w-5 shrink-0" />
    );
  const mainLabel = isRunning && !isPaused ? 'Pause' : hasStarted ? 'Resume' : 'Start';
  const onStage = surface === 'stage';

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={mainAction}
        aria-label={mainLabel}
        className={cn(
          'inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-transform duration-200 focus-ring sm:min-w-[9rem] sm:px-8 sm:py-3 sm:text-base',
          'hover:scale-[1.03] active:scale-[0.97]',
          isRunning && !isPaused && 'pomo-btn-glow',
          onStage ? 'text-white' : 'text-primary-foreground',
        )}
        style={{
          background: onStage ? accentColor : 'var(--primary)',
          boxShadow: onStage
            ? `0 8px 28px color-mix(in srgb, ${accentColor} 45%, transparent)`
            : '0 8px 24px color-mix(in srgb, var(--primary) 35%, transparent)',
        }}
      >
        {mainIcon}
        {mainLabel}
      </button>

      <button
        type="button"
        onClick={onReset}
        aria-label="Reset timer"
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 focus-ring sm:h-12 sm:w-12',
          'hover:scale-105 active:scale-95',
            onStage
              ? 'text-white/90 hover:bg-white/10'
              : 'text-foreground-secondary hover:bg-background-secondary',
        )}
      >
        <RotateCcw className={cn('h-5 w-5', onStage && 'pomo-icon-read')} />
      </button>
    </div>
  );
}
