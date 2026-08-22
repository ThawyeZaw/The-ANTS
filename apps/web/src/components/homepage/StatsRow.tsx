'use client';

// ──────────────────────────────────────────────────────────────────────────────
// StatsRow — High-impact metric blocks with animated count-up
// Each stat counts up from 0 when scrolled into view.
// Collapses to 2×2 grid on mobile (≤640px).
// ──────────────────────────────────────────────────────────────────────────────

import RevealSection from './RevealSection';
import AnimatedStat from '@/components/ui/AnimatedStat';

const STATS = [
  { endValue: 6, label: 'EXAM BOARDS' },
  { endValue: 4, label: 'USER ROLES' },
  { endValue: 120, label: 'ACTIVE CLUBS', suffix: '+' },
  { endValue: 100, label: 'STUDENTS', suffix: '+' },
];

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

        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              textAlign: 'center',
              padding: '0 12px',
              position: 'relative',
            }}
          >
            {/* Vertical divider (hidden on mobile) */}
            {i < STATS.length - 1 && (
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

            <AnimatedStat
              endValue={stat.endValue}
              label={stat.label}
              suffix={stat.suffix}
            />
          </div>
        ))}
      </div>
    </RevealSection>
  );
}