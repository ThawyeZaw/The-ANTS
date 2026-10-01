'use client';

import { useState } from 'react';
import type { PomodoroVibe } from '@/constants/pomodoro-vibes';
import type { TimerPhase } from '@/constants/pomodoro';
import VibeParticles from '@/components/pomodoro/VibeParticles';
import { cn } from '@/lib/utils';

interface VibeStageProps {
  vibe: PomodoroVibe | null;
  phase?: TimerPhase;
  isRunning?: boolean;
  /** Focus Mode uses a slightly stronger dim so the timer stays primary */
  cinematic?: boolean;
  customWallpaperUrl?: string | null;
  className?: string;
}

export default function VibeStage({
  vibe,
  cinematic = false,
  customWallpaperUrl,
  className,
}: VibeStageProps) {
  const [imageOk, setImageOk] = useState(true);
  const activeBackground = customWallpaperUrl || vibe?.backgroundSrc;
  const showPhoto = Boolean(activeBackground) && imageOk;

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
      {/* Fallback gradient */}
      <div
        className="absolute inset-0 bg-background transition-[background] duration-700 ease-out"
        style={{ background: vibe && !showPhoto ? vibe.gradient : undefined }}
      />

      {/* Atmospheric Photo Layer */}
      {showPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={activeBackground}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 scale-[1.01]"
          onError={() => setImageOk(false)}
        />
      )}

      {/* Dynamic Particle Weather / Light Layer */}
      {vibe && (
        <VibeParticles
          particleType={vibe.particleType}
          isActive={true}
        />
      )}

      {/* Cinematic Vignette & Readability Gradient */}
      {(vibe || customWallpaperUrl) && (
        <div
          className={cn(
            'absolute inset-0 transition-all duration-700 pointer-events-none',
            cinematic
              ? 'bg-gradient-to-t from-black/85 via-black/60 to-black/75 backdrop-blur-[1.5px]'
              : 'bg-gradient-to-t from-black/75 via-black/45 to-black/65 backdrop-blur-[0.5px]',
          )}
        />
      )}
    </div>
  );
}
