'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — QualTrail
// Six qualification cards in a horizontal row with alternating vertical offsets
// and a faint dashed line running behind them.
// Collapses to a vertical stack on mobile (≤900px).
// ──────────────────────────────────────────────────────────────────────────────

import RevealSection from './RevealSection';

const QUALIFICATIONS = [
  { name: 'Cambridge CAIE', sub: 'IGCSE & A Levels',      emoji: '🎓' },
  { name: 'Pearson Edexcel', sub: 'IGCSE & IAL',          emoji: '📘' },
  { name: 'IELTS',           sub: 'Academic & General',    emoji: '🌍' },
];

export default function QualTrail() {
  return (
    <RevealSection>
      <div
        style={{ position: 'relative', padding: '50px 0 10px' }}
        className="quals-track-wrap"
      >
        {/* Dashed horizontal line (desktop only, hidden via CSS media query) */}
        <div className="hp-quals-line" />

        {/* Scrollable flex row */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            position: 'relative',
            overflowX: 'auto',
            padding: '6px 4px 20px',
            scrollbarWidth: 'thin',
          }}
          className="quals-row"
        >
          <style>{`
            @media (max-width: 900px) {
              .quals-row {
                flex-direction: column !important;
                overflow-x: visible !important;
              }
              .qual-stop-even {
                transform: none !important;
              }
              .qual-stop-even:hover {
                transform: translateY(-6px) !important;
              }
              .qual-stop-odd:hover {
                transform: translateY(-6px) !important;
              }
            }
          `}</style>

          {QUALIFICATIONS.map((q, i) => {
            const isEven = i % 2 === 1; // even index (0-based), offset every other
            return (
              <div
                key={q.name}
                className={isEven ? 'qual-stop-even' : 'qual-stop-odd'}
                style={{
                  flex: 1,
                  minWidth: 150,
                  background: 'var(--hp-surface)',
                  border: '1px solid var(--hp-border)',
                  borderRadius: 'var(--hp-radius-md)',
                  padding: '20px 16px',
                  textAlign: 'center',
                  transition: 'transform 0.25s ease, border-color 0.2s ease',
                  transform: isEven ? 'translateY(-16px)' : 'translateY(0)',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = 'var(--hp-amber)';
                  el.style.transform = isEven ? 'translateY(-22px)' : 'translateY(-6px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = 'var(--hp-border)';
                  el.style.transform = isEven ? 'translateY(-16px)' : 'translateY(0)';
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 10 }}>{q.emoji}</div>
                <h4
                  style={{
                    fontFamily: 'var(--hp-font-display)',
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: 'var(--hp-ink)',
                    margin: '0 0 4px',
                  }}
                >
                  {q.name}
                </h4>
                <span
                  style={{
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 11.5,
                    color: 'var(--hp-ink-faint)',
                  }}
                >
                  {q.sub}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </RevealSection>
  );
}
