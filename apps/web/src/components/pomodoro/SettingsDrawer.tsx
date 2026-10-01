'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro SettingsDrawer
// PPP-owned: duration sliders, sound picker, volume, auto-start toggle.
// ──────────────────────────────────────────────────────────────────────────────

import { Settings, X, Volume2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { PomodoroSettings, PomodoroStatsLog, ChimeSoundId } from '@/constants/pomodoro';
import { DURATION_BOUNDS, POMODORO_DEFAULTS } from '@/constants/pomodoro';
import StatsPanel from '@/components/pomodoro/StatsPanel';
import FocusDurationDropdown from '@/components/pomodoro/FocusDurationDropdown';
import { playChime } from '@/lib/pomodoro/audio-engine';
import { cn } from '@/lib/utils';

const CHIME_OPTIONS: { id: ChimeSoundId; label: string; desc: string }[] = [
  { id: 'bowl', label: 'Zen Bowl', desc: 'Tibetan 528Hz singing bowl' },
  { id: 'bell', label: 'Cambridge Bell', desc: 'Collegiate tower bell' },
  { id: 'marimba', label: 'Marimba', desc: 'Ascending crystal arpeggio' },
  { id: 'minimal', label: 'Minimal', desc: 'Discreet two-tone cue' },
];

interface SettingsDrawerProps {
  settings: PomodoroSettings;
  onUpdate: (partial: Partial<PomodoroSettings>) => void;
  stats: PomodoroStatsLog;
  surface?: 'theme' | 'stage';
}

function todayFocusMinutes(stats: PomodoroStatsLog): number {
  const d = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return stats.entries.find((e) => e.date === key)?.focusMinutes ?? 0;
}

function todaySessions(stats: PomodoroStatsLog): number {
  const d = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return stats.entries.find((e) => e.date === key)?.sessionsCompleted ?? 0;
}

interface DurationSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

function DurationSlider({ label, value, min, max, step = 1, onChange }: DurationSliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" style={{ color: 'var(--foreground-secondary)' }}>
          {label}
        </label>
        <span
          className="text-sm font-semibold tabular-nums min-w-[3ch] text-right"
          style={{ color: 'var(--foreground)' }}
        >
          {value}m
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer focus-ring"
        style={{
          background: `var(--border)`,
          accentColor: 'var(--primary)',
        }}
        aria-label={`${label}: ${value} minutes`}
      />
      <div className="flex justify-between text-xs" style={{ color: 'var(--foreground-muted)' }}>
        <span>{min}m</span>
        <span>{max}m</span>
      </div>
    </div>
  );
}

export default function SettingsDrawer({
  settings,
  onUpdate,
  stats,
  surface = 'theme',
}: SettingsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const onStage = surface === 'stage';
  const todayMinutes = todayFocusMinutes(stats);
  const todaySessionCount = todaySessions(stats);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full transition focus-ring',
          onStage
            ? 'text-white/90 hover:bg-white/10'
            : 'text-foreground-secondary hover:bg-background-secondary',
        )}
        aria-label="Open timer settings"
        aria-expanded={isOpen}
      >
        <Settings className={cn('h-5 w-5', onStage && 'pomo-icon-read')} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'var(--background-card)',
          borderLeft: `1px solid var(--border)`,
          boxShadow: 'var(--shadow-xl)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Timer settings"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: `1px solid var(--border)` }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--foreground)' }}
          >
            Timer Settings
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg focus-ring transition-colors hover:bg-background-secondary"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" style={{ color: 'var(--foreground-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <section
            className="rounded-xl border p-4"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--background-secondary)',
            }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Your stats
            </h3>
            <p
              className="mt-1 text-xs tabular-nums"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {todayMinutes}m today
              <span className="mx-2 opacity-40">·</span>
              {todaySessionCount} sessions
              <span className="mx-2 opacity-40">·</span>
              {stats.allTimeFocusMinutes}m all time
            </p>
            {stats.currentStreak > 0 && (
              <p className="mt-1 text-xs font-semibold text-warning">
                {stats.currentStreak}-day streak
              </p>
            )}
            <div className="mt-4">
              <StatsPanel stats={stats} surface="theme" />
            </div>
          </section>

          {/* Focus duration (dropdown only) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                Focus Duration
              </label>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: 'var(--foreground)' }}
              >
                {settings.focusMinutes}m
              </span>
            </div>
            <FocusDurationDropdown
              value={settings.focusMinutes}
              onChange={(m) => onUpdate({ focusMinutes: m })}
              surface={surface}
              variant="drawer"
            />
          </div>

          {/* Short break duration */}
          <DurationSlider
            label="Short Break"
            value={settings.shortBreakMinutes}
            min={DURATION_BOUNDS.shortBreak.min}
            max={DURATION_BOUNDS.shortBreak.max}
            step={1}
            onChange={(v) => onUpdate({ shortBreakMinutes: v })}
          />

          {/* Long break duration */}
          <DurationSlider
            label="Long Break"
            value={settings.longBreakMinutes}
            min={DURATION_BOUNDS.longBreak.min}
            max={DURATION_BOUNDS.longBreak.max}
            step={5}
            onChange={(v) => onUpdate({ longBreakMinutes: v })}
          />

          {/* Cycles before long break */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground-secondary)' }}>
                Sessions before long break
              </label>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: 'var(--foreground)' }}
              >
                {settings.cyclesBeforeLongBreak}
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={8}
              step={1}
              value={settings.cyclesBeforeLongBreak}
              onChange={(e) => onUpdate({ cyclesBeforeLongBreak: Number(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer focus-ring"
              style={{
                background: 'var(--border)',
                accentColor: 'var(--primary)',
              }}
              aria-label={`Sessions before long break: ${settings.cyclesBeforeLongBreak}`}
            />
          </div>

          {/* Auto-start toggle */}
          <div className="flex items-center justify-between py-1">
            <label
              className="text-sm font-medium cursor-pointer"
              style={{ color: 'var(--foreground-secondary)' }}
              htmlFor="auto-start-toggle"
            >
              Auto-start next session
            </label>
            <button
              id="auto-start-toggle"
              role="switch"
              aria-checked={settings.autoStartNext}
              onClick={() => onUpdate({ autoStartNext: !settings.autoStartNext })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-ring ${
                settings.autoStartNext ? 'bg-primary' : ''
              }`}
              style={{
                background: settings.autoStartNext ? 'var(--primary)' : 'var(--border)',
              }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  settings.autoStartNext ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Completion chime toggle + test + picker */}
          <div className="space-y-3 py-1">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium cursor-pointer"
                style={{ color: 'var(--foreground-secondary)' }}
                htmlFor="chime-toggle"
              >
                Completion sound
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    playChime(settings.chimeSound);
                  }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-background-secondary focus-ring"
                  title="Test notification sound"
                  aria-label="Test notification sound"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  <Volume2 size={14} />
                </button>
                <button
                  id="chime-toggle"
                  type="button"
                  role="switch"
                  aria-checked={settings.notifyChime}
                  onClick={() => onUpdate({ notifyChime: !settings.notifyChime })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-ring ${
                    settings.notifyChime ? 'bg-primary' : ''
                  }`}
                  style={{
                    background: settings.notifyChime ? 'var(--primary)' : 'var(--border)',
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      settings.notifyChime ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Chime tone picker */}
            {settings.notifyChime && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {CHIME_OPTIONS.map((opt) => {
                  const isSelected = (settings.chimeSound ?? 'bowl') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onUpdate({ chimeSound: opt.id });
                        playChime(opt.id);
                      }}
                      className={cn(
                        'flex flex-col items-start px-2.5 py-2 rounded-xl text-left transition-all border text-xs',
                        isSelected
                          ? 'border-primary/60 bg-primary/10 text-foreground font-semibold shadow-sm'
                          : 'border-border/60 bg-background/50 hover:bg-background-secondary text-foreground-secondary',
                      )}
                      title={opt.desc}
                    >
                      <span className="flex items-center gap-1.5 w-full">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full shrink-0',
                            isSelected ? 'bg-primary' : 'bg-transparent',
                          )}
                        />
                        <span className="truncate">{opt.label}</span>
                      </span>
                      <span className="text-[10px] text-foreground-muted truncate w-full mt-0.5">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>



          {/* Volume slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground-secondary)' }}>
                Volume
              </label>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: 'var(--foreground)' }}
              >
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer focus-ring"
              style={{
                background: 'var(--border)',
                accentColor: 'var(--primary)',
              }}
              aria-label={`Volume: ${Math.round(settings.volume * 100)}%`}
            />
          </div>

          {/* Reset to defaults */}
          <button
            onClick={() =>
              onUpdate({
                focusMinutes: POMODORO_DEFAULTS.focusMinutes,
                shortBreakMinutes: POMODORO_DEFAULTS.shortBreakMinutes,
                longBreakMinutes: POMODORO_DEFAULTS.longBreakMinutes,
                cyclesBeforeLongBreak: POMODORO_DEFAULTS.cyclesBeforeLongBreak,
                vibeId: POMODORO_DEFAULTS.vibeId,
                volume: POMODORO_DEFAULTS.volume,
                autoStartNext: POMODORO_DEFAULTS.autoStartNext,
                notifyChime: POMODORO_DEFAULTS.notifyChime,
                chimeSound: POMODORO_DEFAULTS.chimeSound,
                examAlertChime: POMODORO_DEFAULTS.examAlertChime,
                voiceAlerts: POMODORO_DEFAULTS.voiceAlerts,
              })
            }
            className="w-full py-2.5 text-sm font-medium rounded-xl transition-colors duration-200 focus-ring"
            style={{
              color: 'var(--foreground-muted)',
              border: `1px solid var(--border)`,
            }}
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </>
  );
}
