'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Theme Toggle
// Pill switch between light (Academic System) and dark (Amber Academic Studio).
// Uses next-themes; mounted guard prevents hydration mismatch on first paint.
// Dark→light uses a View Transition veil-lift so the canvas doesn't flash white.
// ──────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

type ColorTheme = 'light' | 'dark';

function applyThemeToDocument(theme: ColorTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

function liftThemeVeil(next: ColorTheme, apply: () => void) {
  const veil = document.createElement('div');
  veil.setAttribute('aria-hidden', 'true');
  veil.style.cssText =
    'position:fixed;inset:0;z-index:2147483646;pointer-events:none;';
  veil.style.backgroundColor = getComputedStyle(document.body).backgroundColor;
  document.documentElement.appendChild(veil);
  apply();

  const duration = next === 'light' ? 550 : 320;
  const easing =
    next === 'light' ? 'cubic-bezier(0.4, 0, 1, 1)' : 'cubic-bezier(0.22, 1, 0.36, 1)';
  const animation = veil.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration,
    easing,
    fill: 'forwards',
  });
  void animation.finished.then(() => veil.remove()).catch(() => veil.remove());
}

function switchColorTheme(next: ColorTheme, setTheme: (theme: string) => void) {
  const apply = () => {
    applyThemeToDocument(next);
    flushSync(() => setTheme(next));
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    apply();
    return;
  }

  const root = document.documentElement;
  const directionClass = next === 'light' ? 'theme-to-light' : 'theme-to-dark';
  root.classList.remove('theme-to-light', 'theme-to-dark');
  root.classList.add('theme-switching', directionClass);

  const cleanup = () =>
    root.classList.remove('theme-switching', 'theme-to-light', 'theme-to-dark');

  if (typeof document.startViewTransition !== 'function') {
    liftThemeVeil(next, apply);
    cleanup();
    return;
  }

  try {
    const transition = document.startViewTransition(apply);
    void transition.finished.finally(cleanup);
  } catch {
    liftThemeVeil(next, apply);
    cleanup();
  }
}

interface ThemeToggleProps {
  className?: string;
  /** Homepage (.hp) scopes colors via CSS vars; pass true to inherit hp tokens */
  onHomepage?: boolean;
}

export default function ThemeToggle({ className, onHomepage = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  const onToggle = useCallback(() => {
    switchColorTheme(isDark ? 'light' : 'dark', setTheme);
  }, [isDark, setTheme]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-8 w-[3.25rem] shrink-0 items-center rounded-full border p-0.5 cursor-pointer',
        'lg:h-9 lg:w-[4.25rem] lg:p-1',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        onHomepage
          ? 'border-[var(--hp-border)] bg-[var(--hp-surface)] hover:border-[var(--hp-border-strong)]'
          : 'border-border bg-background-secondary hover:border-border-hover',
        className
      )}
    >
      {/* Sliding thumb */}
      <span
        aria-hidden
        className={cn(
          'absolute top-0.5 left-0.5 h-7 w-7 rounded-full shadow-sm',
          'lg:top-1 lg:left-1',
          'transition-transform duration-200 ease-out motion-reduce:transition-none',
          onHomepage ? 'bg-[var(--hp-brand)]' : 'bg-primary',
          isDark ? 'translate-x-[1.25rem] lg:translate-x-8' : 'translate-x-0'
        )}
      />

      {/* Icons sit above the thumb; active side reads on the primary thumb */}
      <span className="relative z-10 flex w-full items-center justify-between px-1 lg:px-1.5">
        <Sun
          aria-hidden
          className={cn(
            'h-3 w-3 lg:h-3.5 lg:w-3.5 transition-colors duration-200',
            isDark
              ? onHomepage
                ? 'text-[var(--hp-ink-faint)]'
                : 'text-foreground-muted'
              : onHomepage
                ? 'text-[var(--hp-btn-text)]'
                : 'text-primary-foreground'
          )}
        />
        <Moon
          aria-hidden
          className={cn(
            'h-3 w-3 lg:h-3.5 lg:w-3.5 transition-colors duration-200',
            isDark
              ? onHomepage
                ? 'text-[var(--hp-btn-text)]'
                : 'text-primary-foreground'
              : onHomepage
                ? 'text-[var(--hp-ink-faint)]'
                : 'text-foreground-muted'
          )}
        />
      </span>
    </button>
  );
}
