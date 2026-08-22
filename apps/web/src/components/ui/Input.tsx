'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Input Component
// Styled text input with label, error display, and optional icon.
// ──────────────────────────────────────────────────────────────────────────────

import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconRight, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            suppressHydrationWarning
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              'w-full rounded-xl border bg-background-card px-4 py-2.5 text-sm text-foreground',
              'placeholder:text-foreground-muted',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
              error
                ? 'border-error focus:ring-error/50 focus:border-error'
                : 'border-border hover:border-border-hover',
              icon ? 'pl-10' : undefined,
              iconRight ? 'pr-10' : undefined,
              className
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {iconRight}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-error mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
