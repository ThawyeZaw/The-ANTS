'use client';

import { useState } from 'react';
import type { PomodoroVibe } from '@/constants/pomodoro-vibes';
import type { TimerPhase } from '@/constants/pomodoro';
import { cn } from '@/lib/utils';

interface VibeStageProps {
  vibe: PomodoroVibe | null;
  phase?: TimerPhase;
  isRunning?: boolean;
  /** Focus Mode uses a slightly stronger dim so the timer stays primary */
  cinematic?: boolean;
  className?: string;
}

export default function VibeStage({
  vibe,
  cinematic = false,
  className,
}: VibeStageProps) {
  const [imageOk, setImageOk] = useState(true);
  const showPhoto = Boolean(vibe) && imageOk;

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div
        className="absolute inset-0 bg-background transition-[background] duration-700 ease-out"
        style={{ background: vibe && !showPhoto ? vibe.gradient : undefined }}
      />

      {vibe && imageOk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={vibe.backgroundSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImageOk(false)}
        />
      )}

      {vibe && (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-b',
            cinematic
              ? 'from-black/50 via-black/20 to-black/60'
              : 'from-black/40 via-black/10 to-black/50',
          )}
        />
      )}
    </div>
  );
}
