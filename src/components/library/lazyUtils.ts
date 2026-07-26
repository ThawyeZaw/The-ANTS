'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ──────────────────────────────────────────────────────────────────────────────
// Lazy Loading Utility Module
// Shared across all ZLH-owned components. Provides:
//   • Feature detection for native loading="lazy" support
//   • useIntersectionLoader — IntersectionObserver hook with configurable
//     rootMargin for preloading content before it enters the viewport
//   • Deterministic placeholder color generation for LQIP
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Feature-detect native `loading="lazy"` support on <img> elements.
 * Cached after first call — only runs once per session.
 */
let _nativeLazySupported: boolean | null = null;
export function supportsNativeLazyLoading(): boolean {
  if (_nativeLazySupported !== null) return _nativeLazySupported;
  _nativeLazySupported = 'loading' in HTMLImageElement.prototype;
  return _nativeLazySupported;
}

/**
 * Generate a deterministic pastel background color from a string (alt text, src, etc.).
 * Returns a CSS hsl() value suitable as a placeholder before an image loads.
 * Ensures no two adjacent images share the exact same placeholder color.
 */
export function getPlaceholderColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit int
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 30%, 88%)`;
}

/**
 * IntersectionObserver hook with rootMargin-based preloading.
 *
 * @param options.rootMargin — CSS margin string applied to the observer root.
 *   Defaults to '200px 0px' so content begins loading 200px before entering
 *   the viewport, eliminating visible loading delays.
 * @param options.threshold — Intersection ratio threshold (default 0).
 * @param options.once — If true, disconnects after first intersection.
 *
 * @returns [ref, isIntersecting, entry] — attach `ref` to the target element;
 *   `isIntersecting` becomes true when the element enters the rootMargin zone.
 */
export function useIntersectionLoader(
  options: {
    rootMargin?: string;
    threshold?: number;
    once?: boolean;
  } = {}
) {
  const { rootMargin = '200px 0px', threshold = 0, once = true } = options;
  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver → consider everything visible immediately
    if (typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true);
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        setIsIntersecting(e.isIntersecting);
        setEntry(e);
        if (once && e.isIntersecting) {
          io.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, isIntersecting, entry };
}

/**
 * Lightweight lazy-loading polyfill for browsers that don't support
 * `loading="lazy"` on <img> elements (e.g. Safari < 15.4, older Edge).
 *
 * Pass a container ref — all <img data-src="…"> descendants will be observed
 * and their `src` swapped in when they enter the rootMargin zone.
 *
 * Images should be written as:
 *   <img data-src="real-url.jpg" src={placeholderOrEmpty} />
 * The polyfill sets `src = data-src` on intersection and removes `data-src`.
 */
export function useLazyLoadPolyfill(
  containerRef: React.RefObject<HTMLElement | null>,
  rootMargin = '200px 0px'
) {
  useEffect(() => {
    if (supportsNativeLazyLoading()) return;
    const container = containerRef.current;
    if (!container) return;

    if (typeof IntersectionObserver === 'undefined') {
      // Last-resort: load everything immediately
      container.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
        img.src = img.dataset.src ?? '';
        img.removeAttribute('data-src');
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src ?? '';
          img.removeAttribute('data-src');
          io.unobserve(img);
        });
      },
      { rootMargin }
    );

    container.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
      io.observe(img);
    });

    return () => io.disconnect();
  }, [containerRef, rootMargin]);
}
