'use client';

import { useEffect, useState } from 'react';
import { Maximize2, Flame, BarChart3 } from 'lucide-react';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useAuth } from '@/hooks/useAuth';
import DigitalClock from '@/components/pomodoro/DigitalClock';
import TimerControls from '@/components/pomodoro/TimerControls';
import SettingsDrawer from '@/components/pomodoro/SettingsDrawer';
import VibePicker from '@/components/pomodoro/VibePicker';
import { StatsModal } from '@/components/pomodoro/StatsPanel';
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

function todayFocusMinutes(stats: ReturnType<typeof usePomodoro>['stats']): number {
  const d = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return stats.entries.find((e) => e.date === key)?.focusMinutes ?? 0;
}

function todaySessions(stats: ReturnType<typeof usePomodoro>['stats']): number {
  const d = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return stats.entries.find((e) => e.date === key)?.sessionsCompleted ?? 0;
}

export default function PomodoroPage() {
  const { isAuthenticated } = useAuth();
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
  } = usePomodoro();

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const vibe = getVibe(settings.vibeId);
  const onStage = Boolean(vibe);
  const surface = onStage ? 'stage' : 'theme';
  const accent = vibe?.accent ?? PHASE_ACCENT[phase];
  const hasStarted = isRunning || remainingMs < totalMs;
  const todayMinutes = todayFocusMinutes(stats);
  const todaySessionCount = todaySessions(stats);

  useEffect(() => {
    document.title = isRunning
      ? formatTimerTitle(remainingMs, phase)
      : DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [isRunning, remainingMs, phase]);

  const muted = onStage ? 'pomo-read text-white/70' : 'text-foreground-muted';
  const fg = onStage ? 'pomo-read text-white' : 'text-foreground';

  return (
    <>
      <div
        className={cn(
          'pomo-fit-viewport relative',
          isAuthenticated ? 'pomo-fit-auth' : 'pomo-fit-guest',
        )}
      >
        <VibeStage vibe={vibe} phase={phase} isRunning={isRunning && !isPaused} />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8">
            <div className="min-w-0">
              <p className={cn('text-[10px] font-bold uppercase tracking-[0.2em]', muted)}>
                The ANTs
              </p>
              <h1 className={cn('truncate text-base font-extrabold tracking-tight sm:text-lg', fg)}>
                Focus
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
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
              <SettingsDrawer settings={settings} onUpdate={updateSettings} surface={surface} />
              <button
                type="button"
                onClick={() => setIsFocusMode(true)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition focus-ring',
                  onStage ? 'text-white/90 hover:bg-white/10' : 'text-foreground-secondary hover:bg-background-secondary',
                )}
                aria-label="Enter Focus Mode"
                title="Focus Mode (F)"
              >
                <Maximize2 className={cn('h-5 w-5', onStage && 'pomo-icon-read')} />
              </button>
            </div>
          </header>

          <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-2">
            <ModeTabs
              phase={phase}
              settings={settings}
              onSwitch={switchPhase}
              surface={surface}
              className="mb-2 shrink-0 sm:mb-3"
            />

            <SessionProgress
              completed={cyclesCompletedToday}
              total={settings.cyclesBeforeLongBreak}
              accent={accent}
              surface={surface}
              className="mb-3 shrink-0 justify-center sm:mb-4"
            />

            <label className="mb-2 block w-full max-w-sm shrink-0 sm:mb-3">
              <span className="sr-only">Current task</span>
              <input
                type="text"
                value={sessionLabel ?? ''}
                onChange={(e) => setSessionLabel(e.target.value || null)}
                placeholder="What are you working on?"
                maxLength={80}
                className={cn(
                  'w-full border-0 border-b bg-transparent px-2 py-1.5 text-center text-sm font-medium transition focus:outline-none focus-ring',
                  onStage
                    ? 'pomo-read border-white/30 text-white placeholder:text-white/45 focus:border-white/70'
                    : 'border-border text-foreground placeholder:text-foreground-muted focus:border-primary/50',
                )}
              />
            </label>

            <DigitalClock
              remainingMs={remainingMs}
              totalMs={totalMs}
              phase={phase}
              isPaused={isPaused}
              isRunning={isRunning}
              accentColor={accent}
              surface={surface}
              className="mx-auto mb-3 shrink sm:mb-4"
            />

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

            <p className={cn('mt-3 shrink-0 text-center text-[11px] tabular-nums sm:mt-4 sm:text-xs', muted)}>
              {todayMinutes}m today
              <span className="mx-2 opacity-40">·</span>
              {todaySessionCount} sessions
              <span className="mx-2 opacity-40">·</span>
              {stats.allTimeFocusMinutes}m all time
            </p>
          </div>

          <div
            className={cn(
              'mx-auto w-full max-w-lg shrink-0 px-4 pt-1',
              isAuthenticated
                ? 'pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+0.5rem)] md:pb-5'
                : 'pb-4',
            )}
          >
            <VibePicker settings={settings} onUpdate={updateSettings} surface={surface} />

            <button
              type="button"
              onClick={() => setStatsOpen(true)}
              className={cn(
                'mx-auto mt-2 flex w-fit items-center gap-1.5 text-[11px] font-semibold transition focus-ring',
                muted,
                onStage ? 'hover:text-white' : 'hover:text-foreground',
              )}
            >
              <BarChart3 className={cn('h-3.5 w-3.5', onStage && 'pomo-icon-read')} />
              Weekly stats
            </button>
          </div>
        </div>
      </div>

      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} stats={stats} />

      <FocusMode
        isActive={isFocusMode}
        onToggle={() => setIsFocusMode((v) => !v)}
        settings={settings}
        onUpdateSettings={updateSettings}
        taskLabel={sessionLabel}
        phase={phase}
        isRunning={isRunning && !isPaused}
      >
        <DigitalClock
          remainingMs={remainingMs}
          totalMs={totalMs}
          phase={phase}
          isPaused={isPaused}
          isRunning={isRunning}
          accentColor={accent}
          surface="stage"
          className="mb-4"
        />
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
      </FocusMode>
    </>
  );
}
