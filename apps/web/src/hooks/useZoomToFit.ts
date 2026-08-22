'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type ZoomMode = 'fit' | 'manual';

/**
 * Hook that dynamically calculates the hour slot height so the full time grid
 * fits within the available viewport without scrolling.
 *
 * Supports two modes:
 *   - 'fit': auto-calculates slot height based on container size
 *   - 'manual': uses a user-specified zoom percentage (50-200, where 100 = HOUR_SLOT_HEIGHT)
 */
export function useZoomToFit(totalHours: number, minSlotHeight = 28, defaultSlotHeight = 64) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [slotHeight, setSlotHeight] = useState(defaultSlotHeight);
  const [zoomLevel, setZoomLevel] = useState(100); // percentage
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit');

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    if (zoomMode === 'fit') {
      // Auto-fit: fill available space
      const available = el.clientHeight;
      // Reserve ~40px for day header, borders, and padding
      const gridHeight = Math.max(available - 40, totalHours * minSlotHeight);
      const computed = Math.max(minSlotHeight, Math.floor(gridHeight / totalHours));
      setSlotHeight(computed);
    }
  }, [totalHours, minSlotHeight, zoomMode]);

  // Re-measure when container resizes (only in 'fit' mode)
  useEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const setZoom = useCallback((level: number) => {
    const clamped = Math.max(50, Math.min(200, level));
    setZoomLevel(clamped);
    setZoomMode('manual');
    // Manual: slotHeight = base height * (zoom / 100)
    const baseHeight = 64; // HOUR_SLOT_HEIGHT
    setSlotHeight(Math.max(minSlotHeight, Math.round(baseHeight * (clamped / 100))));
  }, [minSlotHeight]);

  const resetToFit = useCallback(() => {
    setZoomMode('fit');
    setZoomLevel(100);
    // Trigger a re-measure on next frame
    requestAnimationFrame(() => measure());
  }, [measure]);

  return {
    containerRef,
    slotHeight,
    zoomLevel,
    zoomMode,
    setZoom,
    resetToFit,
  };
}
