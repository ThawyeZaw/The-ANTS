'use client';

import React, { Suspense } from 'react';
import dynamic, { type DynamicOptions } from 'next/dynamic';
import { useIntersectionLoader } from './lazyUtils';

// ──────────────────────────────────────────────────────────────────────────────
// LazyComponent — Viewport-triggered code splitting.
//
// Wraps next/dynamic with IntersectionObserver so the component chunk is
// only fetched when it approaches the viewport (200px rootMargin by default).
// Until then, a lightweight skeleton placeholder is rendered.
//
// Usage:
//   <LazyComponent
//     importFn={() => import('./HeavyChart')}
//     fallback={<div className="animate-shimmer h-64 rounded-xl" />}
//     ssr={false}          // only if the child touches DOM
//     rootMargin="300px"   // start loading 300px before viewport
//   />
// ──────────────────────────────────────────────────────────────────────────────

interface LazyComponentProps {
  /** Dynamic import function, e.g. `() => import('./MyComponent')` */
  importFn: () => Promise<{ default: React.ComponentType<unknown> }>;
  /** Skeleton shown while the chunk loads */
  fallback: React.ReactNode;
  /** Placeholder shown before the element enters the viewport zone (optional) */
  preplaceholder?: React.ReactNode;
  /** Set to true if the component touches window/DOM APIs (canvas, etc.) */
  ssr?: boolean;
  /** CSS margin for preloading (default '200px 0px') */
  rootMargin?: string;
  /** Additional CSS class for the wrapper */
  className?: string;
}

export default function LazyComponent({
  importFn,
  fallback,
  preplaceholder,
  ssr = true,
  rootMargin = '200px 0px',
  className = '',
}: LazyComponentProps) {
  const { ref, isIntersecting } = useIntersectionLoader({
    rootMargin,
    once: true,
  });

  // Lazy component — only created once (dynamic caches the factory)
  const DynamicComponent = React.useMemo(
    () =>
      dynamic(importFn, {
        loading: () => <>{fallback}</>,
        ssr,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className} aria-live="polite">
      {isIntersecting ? (
        <Suspense fallback={fallback}>
          <DynamicComponent />
        </Suspense>
      ) : (
        preplaceholder ?? fallback
      )}
    </div>
  );
}
