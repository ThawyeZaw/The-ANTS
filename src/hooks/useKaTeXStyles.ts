'use client';

import { useEffect } from 'react';

/**
 * Dynamically injects the KaTeX stylesheet into <head> on first call.
 * Safe to call from multiple components — only injects once.
 */
export function useKaTeXStyles() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const id = 'katex-styles';
    if (document.getElementById(id)) return;

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = '/styles/katex.css';
    document.head.appendChild(link);
  }, []);
}
