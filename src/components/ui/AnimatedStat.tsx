'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — AnimatedStat
// Count-up animation triggered once when the element scrolls into view.
// Uses requestAnimationFrame for a smooth 60fps ease-out effect.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';

interface AnimatedStatProps {
  /** Target number to count up to */
  endValue: number;
  /** Label displayed below the number */
  label: string;
  /** Optional suffix (e.g. "+") */
  suffix?: string;
}

/**
 * Ease-out function: starts fast, decelerates towards the end.
 * @param t Normalised time (0–1)
 * @returns Eased value (0–1)
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedStat({ endValue, label, suffix = '' }: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated) return;

    // Fallback for browsers without IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      setDisplayValue(endValue);
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();

          const duration = 1200; // ms
          const startTime = performance.now();

          function animate(currentTime: number) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);

            setDisplayValue(Math.round(easedProgress * endValue));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(endValue); // ensure exact final value
            }
          }

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
    // Only run once — hasAnimated gating prevents re-trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endValue]);

  return (
    <div
      ref={ref}
      style={{
        textAlign: 'center',
        padding: '0 12px',
      }}
    >
      {/* Oversized value */}
      <div
        style={{
          fontFamily: 'var(--hp-font-display)',
          fontSize: 'clamp(2.8rem, 5vw, 4.2rem)',
          fontWeight: 560,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, var(--hp-ink) 40%, var(--hp-ink-muted) 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          marginBottom: 8,
        }}
      >
        {displayValue}
        {suffix}
      </div>

      {/* Spaced label */}
      <div
        style={{
          fontFamily: 'var(--hp-font-mono)',
          fontSize: 11.5,
          letterSpacing: '0.18em',
          color: 'var(--hp-ink-muted)',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
}