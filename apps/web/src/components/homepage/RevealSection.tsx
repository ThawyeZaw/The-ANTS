'use client';

import React, { useEffect, useRef } from 'react';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — RevealSection
// Shared scroll-reveal wrapper. Uses IntersectionObserver to add the
// hp-visible class once the element enters the viewport. CSS handles
// the opacity/transform/filter transition (including prefers-reduced-motion).
//
// When `asStagger` is true, the wrapper also applies a cascade to its direct
// children that have class `hp-reveal`, staggering them with an 80ms interval.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Thin hook — returns a ref and attaches an IntersectionObserver that
 * toggles the `hp-visible` CSS class on the element.
 */
export function useHpReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      el.classList.add('hp-visible');
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('hp-visible');
        } else {
          entry.target.classList.remove('hp-visible');
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
 * When `stagger` is true, the wrapper assigns --hp-stagger-index to each direct
 * child that has class "hp-reveal", so they cascade in sequence.
 */
export default function RevealSection({
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
  const ref = useHpReveal();
  const isStaggered = stagger && React.Children.count(children) > 1;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${isStaggered ? 'hp-stagger ' : ''}hp-reveal ${className}`}
      style={delayMs ? ({ '--hp-delay': `${delayMs}ms` } as React.CSSProperties) : undefined}
    >
      {isStaggered
        ? React.Children.map(children, (child, i) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                style: {
                  ...((child.props as Record<string, unknown>).style as React.CSSProperties),
                  '--hp-stagger-index': i,
                } as React.CSSProperties,
              } as Record<string, unknown>);
            }
            return child;
          })
        : children}
    </div>
  );
}