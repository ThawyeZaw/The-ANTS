'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro SettingsDrawer
// PPP-owned: duration sliders, sound picker, volume, auto-start toggle.
// ──────────────────────────────────────────────────────────────────────────────

import { Settings, X, Volume2 } from 'lucide-react';
import { useState } from 'react';
import type { PomodoroSettings } from '@/constants/pomodoro';
import { DURATION_BOUNDS, POMODORO_DEFAULTS } from '@/constants/pomodoro';
import Button from '@/components/ui/Button';
import { playChime } from '@/lib/pomodoro/audio-engine';

interface SettingsDrawerProps {
  settings: PomodoroSettings;
  onUpdate: (partial: Partial<PomodoroSettings>) => void;
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

export default function SettingsDrawer({ settings, onUpdate }: SettingsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <Button
        variant="secondary"
        size="sm"
        icon={<Settings className="h-4 w-4" />}
        onClick={() => setIsOpen(true)}
        aria-label="Open timer settings"
        aria-expanded={isOpen}
      >
        Settings
      </Button>

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
          {/* Focus duration */}
          <DurationSlider
            label="Focus Duration"
            value={settings.focusMinutes}
            min={DURATION_BOUNDS.focus.min}
            max={DURATION_BOUNDS.focus.max}
            step={5}
            onChange={(v) => onUpdate({ focusMinutes: v })}
          />

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

          {/* Completion chime toggle + test */}
          <div className="flex items-center justify-between py-1">
            <label
              className="text-sm font-medium cursor-pointer"
              style={{ color: 'var(--foreground-secondary)' }}
              htmlFor="chime-toggle"
            >
              Completion sound
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  playChime();
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
                volume: POMODORO_DEFAULTS.volume,
                autoStartNext: POMODORO_DEFAULTS.autoStartNext,
                notifyChime: POMODORO_DEFAULTS.notifyChime,
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
