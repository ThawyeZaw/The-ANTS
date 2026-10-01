'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Clock, Sparkles } from 'lucide-react';
import { FOCUS_DURATION_OPTIONS } from '@/constants/pomodoro';
import { cn } from '@/lib/utils';

interface FocusDurationDropdownProps {
  value: number;
  onChange: (minutes: number) => void;
  surface?: 'theme' | 'stage';
  variant?: 'inline' | 'drawer';
  className?: string;
  disabled?: boolean;
}

export default function FocusDurationDropdown({
  value,
  onChange,
  surface = 'theme',
  variant = 'inline',
  className,
  disabled = false,
}: FocusDurationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const onStage = surface === 'stage';

  // Find active option
  const activeOption =
    FOCUS_DURATION_OPTIONS.find((opt) => opt.minutes === value) ?? {
      minutes: value,
      label: `${value} min`,
      tag: 'Custom',
    };

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isDrawer = variant === 'drawer';

  return (
    <div ref={containerRef} className={cn('relative inline-block', isDrawer && 'w-full', className)}>
      {/* Trigger Button */}
      {isDrawer ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-sm font-medium transition focus-ring',
            isOpen ? 'border-primary ring-2 ring-primary/20' : '',
            onStage
              ? 'border-white/20 bg-stone-900/90 text-white hover:bg-stone-800'
              : 'border-border bg-background-secondary text-foreground hover:bg-background',
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="font-mono font-bold">{activeOption.minutes}m</span>
            <span className="text-xs text-foreground-muted truncate">({activeOption.tag})</span>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 opacity-60 transition-transform duration-200',
              isOpen && 'rotate-180 opacity-100',
            )}
          />
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'group flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-mono font-bold transition-all focus-ring',
            isOpen
              ? onStage
                ? 'bg-amber-400/30 text-amber-200 ring-1 ring-amber-400/60 shadow-sm'
                : 'bg-amber-500/25 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/40'
              : onStage
                ? 'text-amber-200/90 hover:text-white hover:bg-white/10'
                : 'text-amber-600/90 dark:text-amber-400/90 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-300',
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          title="Change focus block duration"
        >
          <span>{activeOption.minutes}m</span>
          <ChevronDown
            className={cn(
              'h-3 w-3 shrink-0 opacity-70 transition-transform duration-200 group-hover:opacity-100',
              isOpen && 'rotate-180 opacity-100',
            )}
          />
        </button>
      )}

      {/* Glassmorphic Popover Menu */}
      {isOpen && (
        <>
          {/* Mobile backdrop to easily tap outside */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            role="listbox"
            aria-label="Select focus duration"
            className={cn(
              'z-50 rounded-2xl border p-2.5 shadow-2xl backdrop-blur-2xl transition-all',
              'animate-in fade-in-0 zoom-in-95 duration-150',
              isDrawer
                ? 'mt-2 w-full border-border bg-background-secondary shadow-lg'
                : [
                    // Mobile: fixed centered near top (underneath mode tabs) with safe gutters
                    'fixed left-1/2 top-24 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-[310px]',
                    // Desktop: absolute below trigger with slight overlap protection
                    'sm:absolute sm:fixed-none sm:top-full sm:left-1/2 sm:-translate-x-1/2 sm:mt-2.5 sm:w-[320px]',
                    onStage
                      ? 'border-white/20 bg-stone-950/95 text-white shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10'
                      : 'border-border bg-card/95 text-card-foreground shadow-[0_20px_60px_rgba(0,0,0,0.3)]',
                  ],
            )}
          >
            {/* Header info bar */}
            <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-border/40">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                  Focus Duration
                </span>
              </div>
              <span className="text-[10px] font-mono text-foreground-muted">
                {activeOption.minutes}m selected
              </span>
            </div>

            {/* Curated 2-column duration preset grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {FOCUS_DURATION_OPTIONS.map((opt) => {
                const isSelected = opt.minutes === value;
                return (
                  <button
                    key={opt.minutes}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.minutes);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'group relative flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all',
                      isSelected
                        ? onStage
                          ? 'bg-amber-500/25 border border-amber-400/60 text-white shadow-sm ring-1 ring-amber-400/40'
                          : 'bg-amber-500/15 border border-amber-500/50 text-amber-600 dark:text-amber-400 font-semibold ring-1 ring-amber-500/20'
                        : onStage
                          ? 'border border-white/5 hover:border-white/20 hover:bg-white/10 text-white/80 hover:text-white'
                          : 'border border-transparent hover:border-border hover:bg-foreground/5 text-foreground-secondary hover:text-foreground',
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="font-mono text-sm font-bold tracking-tight">
                        {opt.minutes}m
                      </span>
                      <span
                        className={cn(
                          'text-[10px] truncate mt-0.5',
                          isSelected ? 'text-amber-300 font-medium' : 'text-foreground-muted',
                        )}
                      >
                        {opt.tag}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
