'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro Timer Page
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from 'react';
import { Pencil, Settings, Timer } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { usePomodoro } from '@/hooks/usePomodoro';
import TimerRing from '@/components/pomodoro/TimerRing';
import TimerControls from '@/components/pomodoro/TimerControls';
import SettingsDrawer from '@/components/pomodoro/SettingsDrawer';
import SoundscapePicker from '@/components/pomodoro/SoundscapePicker';
import StatsPanel from '@/components/pomodoro/StatsPanel';
import ZenMode from '@/components/pomodoro/ZenMode';
import ModeTabs from '@/components/pomodoro/ModeTabs';

const DEFAULT_TITLE = 'The ANTS \u2014 Study Realm';

function formatTimerTitle(remainingMs: number, phase: string): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const label = phase === 'focus' ? 'Focus' : 'Break';
  return `(${time}) ${label} | The ANTs`;
}

export default function PomodoroPage() {
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

  const [isZen, setIsZen] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // ── document.title update ──────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      document.title = formatTimerTitle(remainingMs, phase);
    } else {
      document.title = DEFAULT_TITLE;
    }
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [isRunning, remainingMs, phase]);

  // ── Focus label input auto-focus ────────────────────────────────────────
  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
    }
  }, [isEditingLabel]);

  const hasStarted = isRunning || (!isPaused);
  const cycleIndex = cyclesCompletedToday % settings.cyclesBeforeLongBreak;

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 lg:pt-12">
        {/* ── Back navigation ─────────────────────────────────────────── */}
        <div className="mb-4">
          <BackButton href="/dashboard" label="Back" />
        </div>

        {/* ── Page banner ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-r from-indigo-500/8 via-violet-500/5 to-cyan-500/10 p-5 md:p-7 mb-6 md:mb-8">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Timer className="h-3 w-3" />
                Focus &amp; Productivity
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
                Pomodoro Timer
              </h1>
              <p className="max-w-xl text-sm md:text-base text-[var(--foreground-secondary)]">
                Break your study into focused intervals with timed breaks. Stay consistent, track your streaks, and build the habit of deep work.
              </p>
            </div>
            <button
              onClick={() => setIsZen(true)}
              className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:bg-indigo-600 hover:shadow-[var(--shadow-glow)]"
            >
              <Settings className="h-4 w-4" />
              Enter Zen Mode
            </button>
          </div>
          <div className="absolute top-0 right-0 -mr-12 -mt-12 h-40 w-40 rounded-full bg-indigo-400/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-12 -mb-12 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 md:pb-8 lg:pb-12">
        <ZenMode
          isActive={isZen}
          onToggle={() => setIsZen((prev) => !prev)}
        >
          <TimerRing
            phase={phase}
            remainingMs={remainingMs}
            totalMs={totalMs}
            isPaused={isPaused}
          />
          <TimerControls
            isRunning={isRunning}
            isPaused={isPaused}
            hasStarted={hasStarted}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onReset={reset}
          />
        </ZenMode>

        {!isZen && (
          <div className="lg:grid lg:grid-cols-[1fr_384px] gap-6 lg:gap-8 items-start">
            {/* ── Main Column ────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-5 w-full">
              {/* Mode toggle tabs */}
              <ModeTabs phase={phase} settings={settings} onSwitch={switchPhase} />

              {/* Session counter */}
              {cycleIndex > 0 && (
                <p
                  className="text-xs font-medium"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  Session {cycleIndex} of {settings.cyclesBeforeLongBreak} before long break
                </p>
              )}

              {/* Focus label input */}
              <div className="w-full max-w-md">
                {isEditingLabel ? (
                  <input
                    ref={labelInputRef}
                    type="text"
                    value={sessionLabel ?? ''}
                    onChange={(e) => setSessionLabel(e.target.value || null)}
                    onBlur={() => setIsEditingLabel(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        setIsEditingLabel(false);
                      }
                    }}
                    placeholder="What are you focusing on?"
                    maxLength={80}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border focus-ring text-center transition-all"
                    style={{
                      background: 'var(--background-card)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)',
                    }}
                    aria-label="Session focus label"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingLabel(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-dashed transition-all focus-ring hover:border-solid"
                    style={{
                      color: sessionLabel ? 'var(--foreground)' : 'var(--foreground-muted)',
                      borderColor: sessionLabel ? 'var(--border)' : 'color-mix(in srgb, var(--border) 60%, transparent)',
                      backgroundColor: sessionLabel ? 'var(--background-card)' : 'transparent',
                    }}
                    aria-label={sessionLabel ? `Focus: ${sessionLabel}. Click to edit.` : 'Add a focus label'}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="truncate">{sessionLabel || 'What are you focusing on?'}</span>
                  </button>
                )}
              </div>

              {/* Timer ring */}
              <TimerRing
                phase={phase}
                remainingMs={remainingMs}
                totalMs={totalMs}
                isPaused={isPaused}
              />

              {/* Controls */}
              <TimerControls
                isRunning={isRunning}
                isPaused={isPaused}
                hasStarted={hasStarted}
                onStart={start}
                onPause={pause}
                onResume={resume}
                onReset={reset}
              />

              {/* Keyboard shortcuts hint */}
              <p
                className="text-xs text-center"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}>Space</kbd> to toggle &middot;{' '}
                <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}>R</kbd> to reset &middot;{' '}
                <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}>Z</kbd> Zen Mode
              </p>

              {/* Ambience */}
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{
                  background: 'var(--background-card)',
                  border: `1px solid var(--border)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="text-base font-semibold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Ambience
                  </h3>
                  <SettingsDrawer settings={settings} onUpdate={updateSettings} />
                </div>
                <SoundscapePicker settings={settings} onUpdate={updateSettings} />
              </div>
            </div>

            {/* ── Sidebar ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 mt-6 lg:mt-0">
              <StatsPanel stats={stats} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
