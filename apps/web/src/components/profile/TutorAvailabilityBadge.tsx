'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  parseTutorAvailability,
  type TutorAvailabilityStatus,
} from '@the-ants/shared-types';

const STATUS_META: Record<
  TutorAvailabilityStatus,
  { label: string; className: string; dotClass: string }
> = {
  available: {
    label: 'Available for tutoring',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
  limited: {
    label: 'Limited availability',
    className: 'bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400',
    dotClass: 'bg-amber-500',
  },
  unavailable: {
    label: 'Not accepting inquiries',
    className: 'bg-foreground-muted/10 text-foreground-muted border-border',
    dotClass: 'bg-foreground-muted',
  },
};

interface TutorAvailabilityBadgeProps {
  availabilitySlots?: unknown;
  className?: string;
}

export default function TutorAvailabilityBadge({
  availabilitySlots,
  className,
}: TutorAvailabilityBadgeProps) {
  const meta = parseTutorAvailability(availabilitySlots);
  const status = meta.status ?? 'available';
  const config = STATUS_META[status];

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border',
          config.className
        )}
      >
        <span className={cn('w-2 h-2 rounded-full', config.dotClass)} aria-hidden />
        {config.label}
      </div>
      {meta.note && (
        <p className="text-xs text-foreground-muted flex items-start gap-1.5">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {meta.note}
        </p>
      )}
    </div>
  );
}
