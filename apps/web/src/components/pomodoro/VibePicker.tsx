'use client';

import { useState } from 'react';
import { Volume2, VolumeX, Image as ImageIcon, Sparkles, X } from 'lucide-react';
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
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInput, setCustomInput] = useState(settings.customWallpaperUrl || '');

  function toggleMute() {
    if (isMuted) {
      onUpdate({
        vibeId: (settings.vibeId ?? 'library') as VibeId,
        volume: POMODORO_DEFAULTS.volume,
      });
    } else {
      onUpdate({ volume: 0 });
    }
  }

  const distinctVibes = POMODORO_VIBES.filter((v) => v.id !== 'deep-focus');

  return (
    <div className={cn('pomo-vibe-picker', compact && 'gap-3 sm:gap-3.5')}>
      <div className="pomo-vibe-row">
        {distinctVibes.map((vibe) => {
          const isActive = settings.vibeId === vibe.id && !settings.customWallpaperUrl;
          return (
            <button
              key={vibe.id}
              type="button"
              onClick={() => {
                if (isActive) {
                  onUpdate({ vibeId: null, customWallpaperUrl: null });
                  return;
                }
                onUpdate({
                  vibeId: vibe.id,
                  customWallpaperUrl: null,
                  volume: settings.volume > 0 ? settings.volume : POMODORO_DEFAULTS.volume,
                });
              }}
              className={cn(
                'group relative shrink-0 overflow-hidden rounded-xl transition-all duration-300 focus-ring',
                compact
                  ? 'h-11 w-[3.25rem] min-w-[3rem] sm:h-14 sm:w-[4.75rem]'
                  : 'h-12 w-[3.75rem] min-w-[3.5rem] sm:h-16 sm:w-[5.25rem]',
                onStage ? 'ring-1 ring-white/20' : 'ring-1 ring-border shadow-sm',
                isActive ? 'scale-105 ring-2 shadow-lg' : 'opacity-85 hover:opacity-100 hover:scale-[1.03]',
              )}
              style={{
                boxShadow: isActive ? `0 0 16px ${vibe.accent}66, 0 0 0 2px ${vibe.accent}` : undefined,
              }}
              aria-pressed={isActive}
              aria-label={`${vibe.label}: ${vibe.description}`}
            >
              <span
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{
                  backgroundImage: `url(${vibe.backgroundSrc}), ${vibe.gradient}`,
                }}
                aria-hidden
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" aria-hidden />
              <span
                className={cn(
                  'relative z-10 flex h-full items-end justify-center px-0.5 pb-1 text-[9px] font-bold text-white sm:text-[11px] sm:pb-1.5 drop-shadow-md truncate max-w-full',
                  compact && 'sm:text-[10px]',
                )}
              >
                {vibe.label}
              </span>
            </button>
          );
        })}

        {/* Custom wallpaper button */}
        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          className={cn(
            'group relative shrink-0 overflow-hidden rounded-xl border border-dashed transition-all duration-300 focus-ring flex flex-col items-center justify-center gap-0.5 sm:gap-1',
            compact
              ? 'h-11 w-[2.75rem] min-w-[2.5rem] sm:h-14 sm:w-[4rem]'
              : 'h-12 w-[3.25rem] min-w-[3rem] sm:h-16 sm:w-[4.25rem]',
            settings.customWallpaperUrl
              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md ring-2 ring-cyan-400'
              : onStage
                ? 'border-white/30 text-white/70 hover:border-white hover:text-white hover:bg-white/10'
                : 'border-border text-foreground-muted hover:border-foreground/40 hover:text-foreground hover:bg-foreground/5',
          )}
          title="Set custom wallpaper URL"
        >
          <ImageIcon className="h-4 w-4" />
          <span className="text-[9px] font-bold tracking-tight">Custom</span>
        </button>
      </div>

      {/* Volume slider & mute control */}
      <div className="pomo-vibe-volume">
        <button
          type="button"
          onClick={toggleMute}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition focus-ring',
            onStage
              ? 'text-white/90 hover:bg-white/10'
              : 'text-foreground-muted hover:bg-background-secondary',
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
            'pomo-volume-slider h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full focus-ring',
            onStage && 'pomo-volume-slider-stage',
          )}
          style={{
            background: `linear-gradient(to right, ${onStage ? '#fff' : 'var(--primary)'} ${settings.volume * 100}%, ${onStage ? 'rgba(255,255,255,0.28)' : 'var(--border)'} ${settings.volume * 100}%)`,
          }}
          aria-label={`Volume: ${Math.round(settings.volume * 100)}%`}
        />
        <span
          className={cn(
            'min-w-[3ch] shrink-0 text-right text-xs font-bold tabular-nums',
            onStage ? 'pomo-read text-white/85' : 'text-foreground-secondary',
          )}
        >
          {Math.round(settings.volume * 100)}
        </span>
      </div>

      {/* Custom Wallpaper Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCustomModal(false)}
          />
          <div
            className={cn(
              'relative z-10 w-full max-w-sm rounded-3xl border p-5 shadow-2xl transition-all',
              onStage ? 'bg-stone-900 border-white/20 text-white' : 'bg-card border-border text-card-foreground',
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold">Custom Wallpaper</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-foreground/10 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-foreground-muted mb-3">
              Enter any direct image URL (JPEG, WebP, PNG) to set as your personal study background.
            </p>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className={cn(
                'w-full rounded-xl border px-3 py-2 text-xs mb-3 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                onStage ? 'bg-stone-800 border-white/20 text-white' : 'bg-background border-border',
              )}
            />
            <div className="flex items-center justify-end gap-2">
              {settings.customWallpaperUrl && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdate({ customWallpaperUrl: null });
                    setCustomInput('');
                    setShowCustomModal(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
                >
                  Clear Custom
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onUpdate({ customWallpaperUrl: customInput.trim() || null });
                  setShowCustomModal(false);
                }}
                className="rounded-xl bg-cyan-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-cyan-400 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
