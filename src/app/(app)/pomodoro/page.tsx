'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro Timer Page
// PPP-owned: thin shell wiring together the hook and UI components.
// All state/logic lives in usePomodoro; presentation lives in components/pomodoro/.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from 'react';
import { Pencil } from 'lucide-react';
import { usePomodoro } from '@/hooks/usePomodoro';
import TimerRing from '@/components/pomodoro/TimerRing';
import TimerControls from '@/components/pomodoro/TimerControls';
import SettingsDrawer from '@/components/pomodoro/SettingsDrawer';
import SoundscapePicker from '@/components/pomodoro/SoundscapePicker';
import StatsPanel from '@/components/pomodoro/StatsPanel';
import ZenMode from '@/components/pomodoro/ZenMode';

const DEFAULT_TITLE = 'The ANTs — Study Realm';

function formatTimerTitle(remainingMs: number, phase: string): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const label = phase === 'focus' ? 'Focus' : 'Break';
  return `${time} \u00B7 ${label}`;
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
    updateSettings,
    setSessionLabel,
  } = usePomodoro();

  const [isZen, setIsZen] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // ── document.title updates ──────────────────────────────────────────────
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

  // ── Focus label input when editing starts ───────────────────────────────
  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
    }
  }, [isEditingLabel]);

  const phaseLabel = phase === 'focus'
    ? 'Focus'
    : phase === 'short_break'
      ? 'Short Break'
      : 'Long Break';

  const hasStarted = isRunning || (!isPaused);

  return (
    <div className="min-h-[calc(100vh-var(--nav-height))]">
      {/* aria-live region for screen readers announcing phase changes */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isRunning
          ? `${phaseLabel} session in progress`
          : isPaused && hasStarted
            ? `${phaseLabel} session paused`
            : 'Ready to start'}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <ZenMode
          isActive={isZen}
          onToggle={() => setIsZen((prev) => !prev)}
        >
          {/* Zen mode: just the ring and controls */}
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
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* ── Left: Timer + Controls ─────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center gap-6 w-full">
              {/* Session label */}
              <div className="flex items-center gap-2 w-full max-w-sm">
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
                    className="w-full px-3 py-2 text-sm rounded-xl border focus-ring"
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
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-colors focus-ring"
                    style={{
                      color: sessionLabel ? 'var(--foreground)' : 'var(--foreground-muted)',
                    }}
                    aria-label={sessionLabel ? `Focus: ${sessionLabel}. Click to edit.` : 'Add a focus label'}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>{sessionLabel || 'What are you focusing on?'}</span>
                  </button>
                )}
              </div>

              {/* Cycle indicator */}
              <div
                className="text-sm font-medium px-4 py-1.5 rounded-full"
                style={{
                  background: 'var(--background-secondary)',
                  color: 'var(--foreground-secondary)',
                }}
              >
                Session {cyclesCompletedToday + 1} of {settings.cyclesBeforeLongBreak}
              </div>

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

              {/* Keyboard shortcuts hint */}
              <p
                className="text-xs text-center"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}>Space</kbd> to toggle timer &middot;{' '}
                <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}>R</kbd> to reset &middot;{' '}
                <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}>Z</kbd> for Zen Mode
              </p>
            </div>

            {/* ── Right: Panels ──────────────────────────────────────── */}
            <div className="w-full lg:w-80 flex flex-col gap-5">
              {/* Settings drawer trigger + Soundscape */}
              <div
                className="rounded-2xl p-5 space-y-4"
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
                    Settings
                  </h3>
                  <SettingsDrawer settings={settings} onUpdate={updateSettings} />
                </div>
                <SoundscapePicker settings={settings} onUpdate={updateSettings} />
              </div>

              <StatsPanel stats={stats} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
