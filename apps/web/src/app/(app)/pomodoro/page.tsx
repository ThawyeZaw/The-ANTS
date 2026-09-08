'use client';

import { useEffect, useState } from 'react';
import { Maximize2, Flame } from 'lucide-react';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useAuth } from '@/hooks/useAuth';
import DigitalClock from '@/components/pomodoro/DigitalClock';
import TimerControls from '@/components/pomodoro/TimerControls';
import SettingsDrawer from '@/components/pomodoro/SettingsDrawer';
import VibePicker from '@/components/pomodoro/VibePicker';
import FocusMode from '@/components/pomodoro/FocusMode';
import ModeTabs from '@/components/pomodoro/ModeTabs';
import VibeStage from '@/components/pomodoro/VibeStage';
import SessionProgress from '@/components/pomodoro/SessionProgress';
import { getVibe } from '@/constants/pomodoro-vibes';
import { cn } from '@/lib/utils';
import type { TimerPhase } from '@/constants/pomodoro';

const DEFAULT_TITLE = 'The ANTS \u2014 Study Realm';

const PHASE_ACCENT: Record<TimerPhase, string> = {
  focus: '#f59e0b',
  short_break: '#10b981',
  long_break: '#818cf8',
};

function formatTimerTitle(remainingMs: number, phase: string): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const label = phase === 'focus' ? 'Focus' : 'Break';
  return `(${time}) ${label} | The ANTs`;
}

export default function PomodoroPage() {
  const { user, isAuthenticated } = useAuth();
  const {
    phase,
    remainingMs,
    totalMs,
    isPaused,
    isRunning,
    cyclesCompletedToday,
    sessionLabel,
    settings,
    stats,
    start,
    pause,
    resume,
    reset,
    switchPhase,
    updateSettings,
    setSessionLabel,
  } = usePomodoro(user?.id);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const vibe = getVibe(settings.vibeId);
  const onStage = Boolean(vibe);
  const surface = onStage ? 'stage' : 'theme';
  const accent = vibe?.accent ?? PHASE_ACCENT[phase];
  const hasStarted = isRunning || remainingMs < totalMs;

  useEffect(() => {
    document.title = isRunning
      ? formatTimerTitle(remainingMs, phase)
      : DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [isRunning, remainingMs, phase]);

  const muted = onStage ? 'pomo-read text-white/75' : 'text-foreground-muted';
  const fg = onStage ? 'pomo-read text-white' : 'text-foreground';
  const pausedLabel = onStage ? 'pomo-read text-white/75' : 'text-foreground-muted';

  return (
    <>
      <div
        className={cn(
          'pomo-fit-viewport relative',
          isAuthenticated ? 'pomo-fit-auth' : 'pomo-fit-guest',
        )}
      >
        <VibeStage vibe={vibe} phase={phase} isRunning={isRunning && !isPaused} />

        <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8">
          <div className="min-w-0">
            <p className={cn('text-[10px] font-bold uppercase tracking-[0.2em]', muted)}>
              The ANTs
            </p>
            <h1 className={cn('truncate text-base font-extrabold tracking-tight sm:text-lg', fg)}>
              Focus
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {stats.currentStreak > 0 && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 text-xs font-bold',
                  onStage ? 'pomo-read text-amber-300' : 'text-warning',
                )}
              >
                <Flame className={cn('h-3.5 w-3.5 shrink-0', onStage && 'pomo-icon-read')} />
                {stats.currentStreak}d
              </span>
            )}
            <SettingsDrawer
              settings={settings}
              onUpdate={updateSettings}
              stats={stats}
              surface={surface}
            />
            <button
              type="button"
              onClick={() => setIsFocusMode(true)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition focus-ring',
                onStage
                  ? 'text-white/90 hover:bg-white/10'
                  : 'text-foreground-secondary hover:bg-background-secondary',
              )}
              aria-label="Enter Focus Mode"
              title="Focus Mode (F)"
            >
              <Maximize2 className={cn('h-5 w-5', onStage && 'pomo-icon-read')} />
            </button>
          </div>
        </header>

        <div className="pomo-fit-main relative z-10 mx-auto w-full max-w-lg md:pb-4">
          <div className="pomo-fit-meta w-full">
            <ModeTabs
              phase={phase}
              settings={settings}
              onSwitch={switchPhase}
              surface={surface}
              className="w-full shrink-0"
            />

            <SessionProgress
              completed={cyclesCompletedToday}
              total={settings.cyclesBeforeLongBreak}
              accent={accent}
              surface={surface}
              className="shrink-0 justify-center"
            />

            <label className="block w-full max-w-sm shrink-0">
              <span className="sr-only">Current task</span>
              <input
                type="text"
                value={sessionLabel ?? ''}
                onChange={(e) => setSessionLabel(e.target.value || null)}
                placeholder="What are you working on?"
                maxLength={80}
                className={cn(
                  'w-full border-0 border-b bg-transparent px-2 py-2 text-center text-sm font-medium transition focus:outline-none focus-ring',
                  onStage
                    ? 'pomo-read border-white/30 text-white placeholder:text-white/45 focus:border-white/70'
                    : 'border-border text-foreground placeholder:text-foreground-muted focus:border-primary/50',
                )}
              />
            </label>
          </div>

          <div className="pomo-fit-clock w-full">
            <DigitalClock
              remainingMs={remainingMs}
              totalMs={totalMs}
              phase={phase}
              isPaused={isPaused}
              isRunning={isRunning}
              accentColor={accent}
              surface={surface}
              showPausedLabel={false}
            />
          </div>

          <div className="pomo-fit-bottom w-full">
            <p
              className={cn(
                'min-h-[1.125rem] shrink-0 text-center text-[11px] font-semibold uppercase tracking-[0.18em]',
                pausedLabel,
                !isPaused && 'invisible',
              )}
              aria-hidden={!isPaused}
            >
              Paused
            </p>

            <TimerControls
              isRunning={isRunning}
              isPaused={isPaused}
              hasStarted={hasStarted}
              onStart={start}
              onPause={pause}
              onResume={resume}
              onReset={reset}
              accentColor={accent}
              surface={surface}
            />

            <VibePicker settings={settings} onUpdate={updateSettings} surface={surface} />
          </div>
        </div>
      </div>

      <FocusMode
        isActive={isFocusMode}
        onToggle={() => setIsFocusMode((v) => !v)}
        settings={settings}
        onUpdateSettings={updateSettings}
        taskLabel={sessionLabel}
        phase={phase}
        isRunning={isRunning && !isPaused}
        isPaused={isPaused}
        controls={
          <TimerControls
            isRunning={isRunning}
            isPaused={isPaused}
            hasStarted={hasStarted}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onReset={reset}
            accentColor={accent}
            surface="stage"
          />
        }
      >
        <DigitalClock
          remainingMs={remainingMs}
          totalMs={totalMs}
          phase={phase}
          isPaused={isPaused}
          isRunning={isRunning}
          accentColor={accent}
          surface="stage"
          showPausedLabel={false}
        />
      </FocusMode>
    </>
  );
}
