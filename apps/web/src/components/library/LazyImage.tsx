'use client';

import { useState, useCallback } from 'react';
import { supportsNativeLazyLoading, getPlaceholderColor, useIntersectionLoader } from './lazyUtils';

// ──────────────────────────────────────────────────────────────────────────────
// LazyImage — Universal lazy-loaded image with LQIP placeholder, native
// loading="lazy", and IntersectionObserver fallback for older browsers.
//
// Drop-in replacement for <img> that:
//   • Sets loading="lazy" natively when supported
//   • Falls back to IntersectionObserver when not supported
//   • Renders a solid-color LQIP placeholder (deterministic per alt/src)
//   • Blur-up transitions on load via CSS
//   • Shows gradient initials on error (mirrors AvatarImage pattern)
// ──────────────────────────────────────────────────────────────────────────────

interface LazyImageProps {
  src: string;
  alt: string;
  /** CSS classes applied to the wrapper <div> */
  className?: string;
  /** Aspect ratio, e.g. '16/9' or '1/1'. Defaults to '1/1'. */
  aspectRatio?: string;
  /** If true, the image is above-the-fold and gets priority loading */
  priority?: boolean;
  /** Pixel width for explicit sizing (prevents CLS) */
  width?: number;
  /** Pixel height for explicit sizing (prevents CLS) */
  height?: number;
  /** Fired when the image fails to load */
  onError?: () => void;
  /** Fired when the image successfully loads */
  onLoad?: () => void;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  aspectRatio = '1/1',
  priority = false,
  width,
  height,
  onError,
  onLoad,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // IntersectionObserver fallback for browsers without native lazy loading.
  // rootMargin=200px preloads 200px before the image enters the viewport.
  const { ref, isIntersecting } = useIntersectionLoader({
    rootMargin: priority ? '0px' : '200px 0px',
    once: true,
  });

  const nativeLazy = supportsNativeLazyLoading();
  const shouldLoad = priority || isIntersecting;
  const placeholderColor = getPlaceholderColor(alt || src);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setErrored(true);
    onError?.();
  }, [onError]);

  // Error state — gradient initials fallback
  if (errored) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ aspectRatio, width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
        aria-label={alt}
        role="img"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center">
          <span className="text-white/80 font-bold text-sm select-none">
            {alt ? alt.charAt(0).toUpperCase() : '?'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio, width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
    >
      {/* LQIP placeholder — shown until image loads */}
      {!loaded && (
        <div
          className="absolute inset-0 animate-shimmer"
          style={{ backgroundColor: placeholderColor }}
          aria-hidden="true"
        />
      )}

      {/* The actual image — only rendered once in the viewport zone */}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          loading={nativeLazy && !priority ? 'lazy' : undefined}
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          // data-src kept for the polyfill (lazyUtils.ts) when native lazy is unsupported
          {...(!nativeLazy && !priority ? { 'data-src': src } : {})}
        />
      )}
    </div>
  );
}
