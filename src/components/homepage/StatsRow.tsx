'use client';

// ──────────────────────────────────────────────────────────────────────────────
// StatsRow — High-impact metric blocks
// Oversized numbers with spaced labels — acts as a "proof of growth" divider
// between the Hero and Features sections.
// Collapses to 2×2 grid on mobile (≤640px).
// ──────────────────────────────────────────────────────────────────────────────

import { HOMEPAGE_STATS } from '@/constants/homepage';
import RevealSection from './RevealSection';

export default function StatsRow() {
  return (
    <RevealSection>
      <div
        style={{
          maxWidth: 'var(--hp-maxw)',
          margin: '0 auto',
          padding: '50px 28px 70px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
        }}
        className="hp-stats-grid"
      >
        <style>{`
          @media (max-width: 640px) {
            .hp-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 28px 0 !important; }
          }
        `}</style>

        {HOMEPAGE_STATS.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              textAlign: 'center',
              padding: '0 12px',
              position: 'relative',
            }}
          >
            {/* Vertical divider (hidden on mobile) */}
            {i < HOMEPAGE_STATS.length - 1 && (
              <div
                className="hp-stats-divider"
                style={{
                  position: 'absolute',
                  top: '10%',
                  right: 0,
                  width: 1,
                  height: '80%',
                  background: 'var(--hp-border)',
                }}
              />
            )}
            <style>{`
              @media (max-width: 640px) {
                .hp-stats-divider { display: none !important; }
              }
            `}</style>

            {/* Oversized value */}
            <div
              className="hp-stats-value"
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
              {stat.value}
            </div>

            {/* Spaced label */}
            <div
              className="hp-spaced"
              style={{
                fontFamily: 'var(--hp-font-mono)',
                fontSize: 10.5,
                letterSpacing: '0.18em',
                color: 'var(--hp-ink-faint)',
                fontWeight: 500,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </RevealSection>
  );
}