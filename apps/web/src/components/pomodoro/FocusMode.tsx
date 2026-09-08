'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { FOCUS_QUOTES } from '@/constants/pomodoro';
import type { PomodoroSettings } from '@/constants/pomodoro';
import { getVibe } from '@/constants/pomodoro-vibes';
import type { TimerPhase } from '@/constants/pomodoro';
import VibeStage from '@/components/pomodoro/VibeStage';
import VibePicker from '@/components/pomodoro/VibePicker';
import { cn } from '@/lib/utils';

interface FocusModeProps {
  isActive: boolean;
  onToggle: () => void;
  settings: PomodoroSettings;
  onUpdateSettings: (partial: Partial<PomodoroSettings>) => void;
  taskLabel: string | null;
  phase: TimerPhase;
  isRunning: boolean;
  isPaused?: boolean;
  children: React.ReactNode;
  controls: React.ReactNode;
}

export default function FocusMode({
  isActive,
  onToggle,
  settings,
  onUpdateSettings,
  taskLabel,
  phase,
  isRunning,
  isPaused = false,
  children,
  controls,
}: FocusModeProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const vibe = getVibe(settings.vibeId);

  useEffect(() => {
    if (isActive) {
      setQuoteIndex(Math.floor(Math.random() * FOCUS_QUOTES.length));
    }
  }, [isActive]);

  const exitFullscreenIfNeeded = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* ignore */
      }
    }
    setIsFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      /* blocked */
    }
  }, []);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (!isActive) void exitFullscreenIfNeeded();
  }, [isActive, exitFullscreenIfNeeded]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onToggle();
      }

      if (e.code === 'Escape' && isActive) {
        e.preventDefault();
        void exitFullscreenIfNeeded();
        onToggle();
      }
    },
    [isActive, onToggle, exitFullscreenIfNeeded],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isActive) return null;

  return (
    <div
      className="pomo-focus-mode pomo-fit-viewport pomo-fit-auth fixed inset-0 z-[100] animate-fade-in motion-reduce:animate-none"
      role="dialog"
      aria-modal="true"
      aria-label="Focus Mode"
    >
      <VibeStage vibe={vibe} phase={phase} isRunning={isRunning} cinematic />

      <div className="relative z-10 flex shrink-0 items-start justify-between gap-3 px-4 pt-3 sm:px-5 sm:pt-4">
        <button
          type="button"
          onClick={() => {
            void exitFullscreenIfNeeded();
            onToggle();
          }}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-white transition hover:bg-white/10 focus-ring"
          aria-label="Exit Focus Mode"
        >
          <ArrowLeft className="h-5 w-5 pomo-icon-read" />
          <span className="pomo-read">Exit</span>
          <kbd className="pomo-read hidden rounded border border-white/25 px-1.5 py-0.5 text-[10px] font-semibold text-white/70 sm:inline">
            Esc
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="rounded-full p-2.5 text-white/90 transition hover:bg-white/10 focus-ring"
          aria-label={isFullscreen ? 'Exit browser fullscreen' : 'Enter browser fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5 pomo-icon-read" />
          ) : (
            <Maximize2 className="h-5 w-5 pomo-icon-read" />
          )}
        </button>
      </div>

      <div className="pomo-fit-main relative z-10 mx-auto w-full max-w-lg pb-[max(1rem,env(safe-area-inset-bottom))]">
        {taskLabel && (
          <div className="pomo-fit-meta w-full">
            <p className="pomo-read max-w-sm truncate text-sm font-medium text-white/90">
              {taskLabel}
            </p>
          </div>
        )}

        <div className="pomo-fit-clock w-full">
          {children}
          <p
            className="pomo-read mt-3 hidden max-w-sm shrink-0 px-4 text-center text-sm italic text-white/65 [@media(min-height:720px)]:block"
            key={quoteIndex}
          >
            {FOCUS_QUOTES[quoteIndex]}
          </p>
        </div>

        <div className="pomo-fit-bottom w-full">
          <p
            className={cn(
              'pomo-read min-h-[1.125rem] shrink-0 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75',
              !isPaused && 'invisible',
            )}
            aria-hidden={!isPaused}
          >
            Paused
          </p>
          {controls}
          <VibePicker settings={settings} onUpdate={onUpdateSettings} surface="stage" compact />
        </div>
      </div>
    </div>
  );
}
