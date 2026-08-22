'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro TimerControls
// PPP-owned: start/pause/reset buttons using the existing Button component.
// Keyboard shortcuts: Space (start/pause), R (reset)
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  hasStarted: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export default function TimerControls({
  isRunning,
  isPaused,
  hasStarted,
  onStart,
  onPause,
  onResume,
  onReset,
}: TimerControlsProps) {
  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when focus is in an input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning && !isPaused) {
          onPause();
        } else {
          hasStarted ? onResume() : onStart();
        }
      }

      if (e.code === 'KeyR') {
        e.preventDefault();
        onReset();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, isPaused, hasStarted, onStart, onPause, onResume, onReset]);

  const mainAction = isRunning && !isPaused ? onPause : (hasStarted ? onResume : onStart);
  const mainIcon = isRunning && !isPaused ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />;
  const mainLabel = isRunning && !isPaused ? 'Pause' : (hasStarted ? 'Resume' : 'Start');

  return (
    <div className="flex items-center gap-3">
      {/* Main toggle button */}
      <Button
        variant="primary"
        size="lg"
        icon={mainIcon}
        onClick={mainAction}
        aria-label={mainLabel}
        className="min-w-[140px]"
      >
        {mainLabel}
      </Button>

      {/* Reset button */}
      <Button
        variant="secondary"
        size="lg"
        icon={<RotateCcw className="h-5 w-5" />}
        onClick={onReset}
        aria-label="Reset timer"
      >
        Reset
      </Button>
    </div>
  );
}
