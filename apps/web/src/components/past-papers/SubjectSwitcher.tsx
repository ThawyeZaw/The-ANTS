'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SubjectSwitcherOption {
  value: string;
  label: string;
  code?: string;
  boardBadge?: string;
}

interface SubjectSwitcherProps {
  value: string;
  options: SubjectSwitcherOption[];
  onChange: (value: string) => void;
  emptyLabel?: string;
  className?: string;
}

export function SubjectSwitcher({
  value,
  options,
  onChange,
  emptyLabel = 'No subjects enrolled',
  className,
}: SubjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative min-w-[200px] max-w-md', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'w-full flex items-center gap-2 rounded-xl border border-border bg-background-secondary',
          'px-3 py-2 text-left transition-colors cursor-pointer',
          'hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40'
        )}
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          {selected ? (
            <>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selected.boardBadge && (
                  <span className="inline-flex items-center rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
                    {selected.boardBadge}
                  </span>
                )}
                {selected.code && (
                  <span className="font-mono text-[10px] text-foreground-muted truncate">
                    {selected.code}
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                {selected.label}
              </div>
            </>
          ) : (
            <span className="text-xs text-foreground-muted">{emptyLabel}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-foreground-muted transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-full min-w-[260px] max-h-72 overflow-y-auto rounded-xl border border-border bg-background-card p-1 shadow-lg animate-fade-in"
        >
          {options.length === 0 ? (
            <div className="px-3 py-4 text-xs text-foreground-muted text-center">{emptyLabel}</div>
          ) : (
            options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer',
                    active
                      ? 'bg-primary/10 text-foreground'
                      : 'hover:bg-background-secondary text-foreground'
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {opt.boardBadge && (
                        <span className="inline-flex items-center rounded-md border border-border/80 bg-background-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
                          {opt.boardBadge}
                        </span>
                      )}
                      {opt.code && (
                        <span className="font-mono text-[10px] text-foreground-muted truncate">
                          {opt.code}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold truncate">{opt.label}</div>
                  </div>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
