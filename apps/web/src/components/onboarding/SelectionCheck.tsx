'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionCheckProps {
  checked: boolean;
  className?: string;
  size?: 'md' | 'lg';
}

/** Polished selection indicator for onboarding subject rows. */
export function SelectionCheck({
  checked,
  className,
  size = 'md',
}: SelectionCheckProps) {
  const dim = size === 'lg' ? 'h-7 w-7' : 'h-6 w-6';
  const icon = size === 'lg' ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5';

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200',
        dim,
        checked
          ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_0_3px] shadow-primary/25'
          : 'border-foreground-muted/55 bg-background text-transparent shadow-sm hover:border-primary/70 hover:bg-primary/5',
        className
      )}
    >
      <Check
        className={cn(icon, 'stroke-[3]', checked ? 'opacity-100' : 'opacity-0')}
      />
    </span>
  );
}
