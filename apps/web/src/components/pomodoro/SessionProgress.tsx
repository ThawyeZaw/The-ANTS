'use client';

import { cn } from '@/lib/utils';

interface SessionProgressProps {
  completed: number;
  total: number;
  accent?: string;
  className?: string;
  surface?: 'theme' | 'stage';
}

export default function SessionProgress({
  completed,
  total,
  accent = '#f59e0b',
  className,
  surface = 'theme',
}: SessionProgressProps) {
  const cycleSlot = completed % total;
  const idle =
    surface === 'stage'
      ? 'rgba(255,255,255,0.45)'
      : 'color-mix(in srgb, var(--foreground) 18%, transparent)';

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      aria-label={`Session ${cycleSlot} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const filled = i < cycleSlot;
        const current = i === cycleSlot;
        return (
          <span
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              filled ? 'w-5' : current ? 'w-7' : 'w-1.5',
            )}
            style={{
              background: filled || current ? accent : idle,
              opacity: filled ? 1 : current ? 1 : 0.7,
            }}
          />
        );
      })}
    </div>
  );
}
