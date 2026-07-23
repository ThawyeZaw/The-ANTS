'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro Zen Mode
// PPP-owned: page-scoped fixed-position fullscreen overlay showing just the
// timer ring, controls, and a rotating encouragement quote.
// Toggle: button + Z key. Exit: Esc, close button, or Z again.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';
import { Maximize, Minimize, X } from 'lucide-react';
import { FOCUS_QUOTES } from '@/constants/pomodoro';

interface ZenModeProps {
  isActive: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function ZenMode({ isActive, onToggle, children }: ZenModeProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Pick a random quote when entering zen mode
  useEffect(() => {
    if (isActive) {
      setQuoteIndex(Math.floor(Math.random() * FOCUS_QUOTES.length));
    }
  }, [isActive]);

  // ── Keyboard: Z to toggle, Esc to exit ──────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'KeyZ' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onToggle();
      }

      if (e.code === 'Escape' && isActive) {
        e.preventDefault();
        onToggle();
      }
    },
    [isActive, onToggle],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Zen Mode toggle button (visible when not in zen mode) */}
      {!isActive && (
        <button
          onClick={onToggle}
          className="p-2 rounded-xl focus-ring transition-colors hover:bg-background-secondary"
          aria-label="Enter Zen Mode"
          title="Zen Mode (Z)"
        >
          <Maximize className="h-5 w-5" style={{ color: 'var(--foreground-muted)' }} />
        </button>
      )}

      {/* Zen Mode Overlay */}
      {isActive && (
        <div
          className="pomo-zen-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 animate-fade-in"
          style={{
            background: 'var(--background)',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Zen Mode — distraction-free focus"
        >
          {/* Close button */}
          <button
            onClick={onToggle}
            className="absolute top-6 right-6 p-2 rounded-xl focus-ring transition-colors hover:bg-background-secondary"
            aria-label="Exit Zen Mode"
          >
            <X className="h-5 w-5" style={{ color: 'var(--foreground-muted)' }} />
          </button>

          {/* Timer content */}
          <div className="flex flex-col items-center gap-6">
            {children}
          </div>

          {/* Rotating quote */}
          <p
            className="text-sm italic text-center max-w-xs px-4 animate-fade-in"
            style={{ color: 'var(--foreground-muted)' }}
            key={quoteIndex}
          >
            {FOCUS_QUOTES[quoteIndex]}
          </p>

          {/* Exit hint */}
          <p
            className="text-xs"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Press <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}>Esc</kbd> or <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}>Z</kbd> to exit Zen Mode
          </p>
        </div>
      )}
    </>
  );
}
