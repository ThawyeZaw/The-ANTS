'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onStage = surface === 'stage';
  const isDrawer = variant === 'drawer';

  // Mount detection for safe client-side portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Find active option
  const activeOption =
    FOCUS_DURATION_OPTIONS.find((opt) => opt.minutes === value) ?? {
      minutes: value,
      label: `${value} min`,
      tag: 'Custom',
    };

  // Calculate dynamic floating position for inline portal
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || isDrawer) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(320, window.innerWidth - 24);

    // Center horizontally beneath the trigger button, clamped inside screen padding
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - popoverWidth - 12));

    // Position 8px below the trigger; flip upward if overflowing bottom
    let top = rect.bottom + 8;
    const estimatedHeight = 220;
    if (top + estimatedHeight > window.innerHeight && rect.top > estimatedHeight + 16) {
      top = rect.top - estimatedHeight - 8;
    }

    setCoords({ top, left, width: popoverWidth });
  }, [isDrawer]);

  // Update position on open, resize, or scroll
  useEffect(() => {
    if (!isOpen || isDrawer) return;

    updatePosition();

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, isDrawer, updatePosition]);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (isDrawer && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    if (isDrawer) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (isDrawer) {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      }
    };
  }, [isOpen, isDrawer]);

  // Popover Options Content
  const renderOptionsContent = (
    <div
      role="listbox"
      aria-label="Select focus duration"
      className={cn(
        'rounded-2xl border p-2.5 shadow-2xl backdrop-blur-2xl transition-all',
        'animate-in fade-in-0 zoom-in-95 duration-150',
        isDrawer
          ? 'mt-2 w-full border-border bg-background-secondary text-foreground shadow-lg'
          : onStage
            ? 'border-white/20 bg-stone-950/95 text-white shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10'
            : 'border-border bg-card/95 text-card-foreground shadow-[0_20px_60px_rgba(0,0,0,0.3)]',
      )}
      style={
        !isDrawer && coords
          ? {
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }
          : undefined
      }
    >
      {/* Header bar */}
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

      {/* 2-column duration preset grid */}
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
  );

  return (
    <div ref={containerRef} className={cn('relative inline-block', isDrawer && 'w-full', className)}>
      {/* Trigger Button */}
      {isDrawer ? (
        <button
          ref={triggerRef}
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
          ref={triggerRef}
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

      {/* Popover Rendering: Inline Drawer OR Portal for Header Pill */}
      {isOpen && (
        isDrawer ? (
          renderOptionsContent
        ) : mounted && coords ? (
          createPortal(
            <div>
              {/* Fullscreen transparent backdrop for outside clicks */}
              <div
                className="fixed inset-0 z-[9998] bg-black/20 sm:bg-black/5"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />
              {renderOptionsContent}
            </div>,
            document.body,
          )
        ) : null
      )}
    </div>
  );
}
