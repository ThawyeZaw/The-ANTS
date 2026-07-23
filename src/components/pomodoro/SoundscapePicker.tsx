'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro SoundscapePicker
// PPP-owned: selectable soundscape cards wired to the audio engine.
// ──────────────────────────────────────────────────────────────────────────────

import { Volume2, VolumeX } from 'lucide-react';
import type { PomodoroSettings } from '@/constants/pomodoro';
import { SOUND_PRESETS, POMODORO_DEFAULTS } from '@/constants/pomodoro';
import { cn } from '@/lib/utils';

interface SoundscapePickerProps {
  settings: PomodoroSettings;
  onUpdate: (partial: Partial<PomodoroSettings>) => void;
}

export default function SoundscapePicker({ settings, onUpdate }: SoundscapePickerProps) {
  const isMuted = settings.volume === 0 || settings.soundKey === null;

  return (
    <div className="space-y-3">
      {/* Header with mute toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--foreground-secondary)' }}>
          Background Sound
        </span>
        <button
          onClick={() => {
            if (isMuted) {
              onUpdate({
                soundKey: 'rain',
                volume: POMODORO_DEFAULTS.volume,
              });
            } else {
              onUpdate({ soundKey: null, volume: 0 });
            }
          }}
          className="p-1.5 rounded-lg focus-ring transition-colors hover:bg-background-secondary"
          aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" style={{ color: 'var(--foreground-muted)' }} />
          ) : (
            <Volume2 className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          )}
        </button>
      </div>

      {/* Sound cards */}
      <div className="grid grid-cols-2 gap-2">
        {SOUND_PRESETS.map((preset) => {
          const isActive = settings.soundKey === preset.key;
          return (
            <button
              key={preset.key}
              onClick={() => onUpdate({ soundKey: preset.key })}
              className={cn(
                'flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all duration-200 focus-ring',
                'border',
              )}
              style={{
                background: isActive ? 'var(--primary-light)' : 'var(--background-card)',
                borderColor: isActive ? 'var(--primary)' : 'var(--border)',
              }}
              aria-pressed={isActive}
              aria-label={`${preset.label}: ${preset.description}`}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: isActive ? 'var(--primary)' : 'var(--foreground)' }}
              >
                {preset.label}
              </span>
              <span
                className="text-xs leading-tight"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Volume slider */}
      {settings.soundKey && (
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--foreground-muted)' }} />
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
          <span
            className="text-xs font-semibold tabular-nums min-w-[3ch] text-right"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            {Math.round(settings.volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
