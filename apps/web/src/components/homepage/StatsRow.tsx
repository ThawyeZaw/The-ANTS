'use client';

// ──────────────────────────────────────────────────────────────────────────────
// StatsRow — High-impact metric blocks with animated count-up
// ──────────────────────────────────────────────────────────────────────────────

import RevealSection from './RevealSection';
import AnimatedStat from '@/components/ui/AnimatedStat';
import { HOMEPAGE_STATS } from '@/constants/homepage';

export default function StatsRow() {
  return (
    <RevealSection>
      <div
        style={{
          maxWidth: 'var(--hp-maxw)',
          margin: '0 auto',
          padding: '40px 28px 56px',
          display: 'grid',
          gridTemplateColumns: `repeat(${HOMEPAGE_STATS.length}, 1fr)`,
          gap: 0,
        }}
        className="hp-stats-grid"
      >
        <style>{`
          @media (max-width: 900px) {
            .hp-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 28px 0 !important; }
          }
          @media (max-width: 640px) {
            .hp-stats-divider { display: none !important; }
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

            <AnimatedStat
              endValue={stat.endValue}
              label={stat.label}
              suffix={'suffix' in stat ? stat.suffix : undefined}
            />
          </div>
        ))}
      </div>
    </RevealSection>
  );
}
