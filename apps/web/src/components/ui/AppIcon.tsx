'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — AppIcon
// Shared Lucide icon primitive: clean outline glyphs, semantic tokens only.
// No neon, gradient, rainbow, or glow treatments.
// ──────────────────────────────────────────────────────────────────────────────

import type { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppIconSize = 'sm' | 'md' | 'lg' | 'xl';

export type AppIconTone =
  | 'default'
  | 'muted'
  | 'secondary'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive';

export type AppIconFrame = 'none' | 'soft' | 'empty';

const SIZE_PX: Record<AppIconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
};

const SIZE_CLASS: Record<AppIconSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
};

const TONE_CLASS: Record<AppIconTone, string> = {
  default: 'text-foreground',
  muted: 'text-foreground-muted',
  secondary: 'text-foreground-secondary',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

const FRAME_CLASS: Record<Exclude<AppIconFrame, 'none'>, string> = {
  soft: 'inline-flex items-center justify-center rounded-xl bg-background-secondary text-foreground-muted',
  empty:
    'inline-flex items-center justify-center rounded-xl border border-dashed border-border bg-background-secondary text-foreground-muted',
};

const FRAME_PAD: Record<AppIconSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-14 h-14',
};

export interface AppIconProps extends Omit<LucideProps, 'ref' | 'size'> {
  icon: LucideIcon;
  size?: AppIconSize;
  tone?: AppIconTone;
  frame?: AppIconFrame;
  className?: string;
  iconClassName?: string;
}

/**
 * Clean Lucide outline icon with optional quiet frame.
 * Prefer frame="none" (plain glyph) for nav/list items.
 * Use frame="soft" for feature anchors; frame="empty" for empty states.
 */
export default function AppIcon({
  icon: Icon,
  size = 'sm',
  tone = 'secondary',
  frame = 'none',
  className,
  iconClassName,
  strokeWidth = 2,
  'aria-hidden': ariaHidden = true,
  ...rest
}: AppIconProps) {
  const glyph = (
    <Icon
      size={SIZE_PX[size]}
      strokeWidth={strokeWidth}
      aria-hidden={ariaHidden}
      className={cn(SIZE_CLASS[size], 'shrink-0', TONE_CLASS[tone], iconClassName)}
      {...rest}
    />
  );

  if (frame === 'none') {
    return className ? <span className={cn('inline-flex', className)}>{glyph}</span> : glyph;
  }

  return (
    <span className={cn(FRAME_CLASS[frame], FRAME_PAD[size], className)} aria-hidden={ariaHidden}>
      {glyph}
    </span>
  );
}
