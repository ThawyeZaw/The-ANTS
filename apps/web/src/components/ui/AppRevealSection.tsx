'use client';

import React, { useEffect, useRef } from 'react';

// ──────────────────────────────────────────────────────────────────────────────
// App — AppRevealSection
// Scroll-reveal wrapper for authenticated app pages. Mirrors the homepage
// RevealSection API (delayMs, stagger props) but scoped to app components
// using .app-reveal / .app-visible classes and app CSS tokens.
//
// Do NOT use --hp-* tokens in this scope (per 08-theming.md § "Homepage isolation").
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Thin hook — returns a ref and attaches an IntersectionObserver that
 * toggles the `app-visible` CSS class on the element.
 */
function useAppReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      el.classList.add('app-visible');
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('app-visible');
        } else {
          entry.target.classList.remove('app-visible');
        }
      },
      { threshold }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return ref;
}

/**
 * Wraps children in a <div> that fades + slides up when scrolled into view.
 * className is merged onto the wrapper; delayMs adds an animation-delay.
 *
 * When `stagger` is true, the wrapper assigns --app-stagger-index to each direct
 * child that has class "app-reveal", so they cascade in sequence.
 */
export default function AppRevealSection({
  children,
  className = '',
  delayMs = 0,
  stagger = false,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  stagger?: boolean;
}) {
  const ref = useAppReveal();
  const isStaggered = stagger && React.Children.count(children) > 1;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${isStaggered ? 'app-stagger ' : ''}app-reveal ${className}`}
      style={delayMs ? ({ '--app-delay': `${delayMs}ms` } as React.CSSProperties) : undefined}
    >
      {isStaggered
        ? React.Children.map(children, (child, i) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                style: {
                  ...((child.props as Record<string, unknown>).style as React.CSSProperties),
                  '--app-stagger-index': i,
                } as React.CSSProperties,
              } as Record<string, unknown>);
            }
            return child;
          })
        : children}
    </div>
  );
}
