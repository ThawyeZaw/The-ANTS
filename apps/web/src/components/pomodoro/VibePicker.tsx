'use client';

import { Volume2, VolumeX } from 'lucide-react';
import type { PomodoroSettings } from '@/constants/pomodoro';
import { POMODORO_DEFAULTS } from '@/constants/pomodoro';
import { POMODORO_VIBES, type VibeId } from '@/constants/pomodoro-vibes';
import { cn } from '@/lib/utils';

interface VibePickerProps {
  settings: PomodoroSettings;
  onUpdate: (partial: Partial<PomodoroSettings>) => void;
  surface?: 'theme' | 'stage';
  compact?: boolean;
}

export default function VibePicker({ settings, onUpdate, surface = 'theme', compact = false }: VibePickerProps) {
  const isMuted = settings.volume === 0;
  const onStage = surface === 'stage';

  function toggleMute() {
    if (isMuted) {
      onUpdate({
        vibeId: (settings.vibeId ?? 'rain') as VibeId,
        volume: POMODORO_DEFAULTS.volume,
      });
    } else {
      onUpdate({ volume: 0 });
    }
  }

  return (
    <div className={cn(compact ? 'space-y-2' : 'space-y-2.5')}>
      <div className="flex items-end justify-center gap-1.5 sm:gap-2.5">
        {POMODORO_VIBES.map((vibe) => {
          const isActive = settings.vibeId === vibe.id;
          return (
            <button
              key={vibe.id}
              type="button"
              onClick={() => {
                if (isActive) {
                  onUpdate({ vibeId: null });
                  return;
                }
                onUpdate({
                  vibeId: vibe.id,
                  volume: settings.volume > 0 ? settings.volume : POMODORO_DEFAULTS.volume,
                });
              }}
              className={cn(
                'group relative overflow-hidden rounded-xl transition-transform duration-200 focus-ring',
                compact
                  ? 'h-11 w-[3.4rem] sm:h-12 sm:w-[4.5rem]'
                  : 'h-12 w-[3.85rem] sm:h-14 sm:w-[5.25rem]',
                isActive ? 'scale-105' : 'opacity-80 hover:opacity-100 hover:scale-[1.03]',
              )}
              style={{
                boxShadow: isActive ? `0 0 0 2px ${vibe.accent}` : undefined,
              }}
              aria-pressed={isActive}
              aria-label={`${vibe.label}: ${vibe.description}`}
            >
              <span
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: `url(${vibe.backgroundSrc}), ${vibe.gradient}`,
                }}
                aria-hidden
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden />
              <span className={cn(
                'relative z-10 flex h-full items-end justify-center px-1 pb-1 text-[9px] font-bold text-white sm:text-[11px]',
                compact && 'pb-1 sm:text-[10px]',
              )}>
                {vibe.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mx-auto flex max-w-xs items-center gap-2.5 px-1">
        <button
          type="button"
          onClick={toggleMute}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition focus-ring',
            onStage ? 'text-white/85 hover:bg-white/10' : 'text-foreground-muted hover:bg-background-secondary',
          )}
          aria-label={isMuted ? 'Unmute scene audio' : 'Mute scene audio'}
        >
          {isMuted ? (
            <VolumeX className={cn('h-4 w-4', onStage && 'pomo-icon-read')} />
          ) : (
            <Volume2 className={cn('h-4 w-4', onStage && 'pomo-icon-read')} />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.volume}
          onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
          className={cn(
            'pomo-volume-slider h-1.5 w-full cursor-pointer appearance-none rounded-full focus-ring',
            onStage && 'pomo-volume-slider-stage',
          )}
          style={{
            background: `linear-gradient(to right, ${onStage ? '#fff' : 'var(--primary)'} ${settings.volume * 100}%, ${onStage ? 'rgba(255,255,255,0.28)' : 'var(--border)'} ${settings.volume * 100}%)`,
          }}
          aria-label={`Volume: ${Math.round(settings.volume * 100)}%`}
        />
        <span
          className={cn(
            'min-w-[3ch] text-right text-xs font-bold tabular-nums',
            onStage ? 'pomo-read text-white/80' : 'text-foreground-secondary',
          )}
        >
          {Math.round(settings.volume * 100)}
        </span>
      </div>
    </div>
  );
}
