'use client';

// ──────────────────────────────────────────────────────────────────────────────
// DotGrid — Subtle dot-matrix background overlay
// CSS-only radial-gradient pattern. No JS, no layout shift, hardware-accelerated.
// Wrap any section with <DotGrid> to apply the texture behind its children.
// ──────────────────────────────────────────────────────────────────────────────

import { ReactNode } from 'react';

export default function DotGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      {/* Dot-matrix overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.35,
          backgroundImage:
            'radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      />
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}