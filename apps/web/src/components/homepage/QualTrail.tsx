'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — QualTrail
// Qualification cards with Lucide outline icons (no emoji).
// ──────────────────────────────────────────────────────────────────────────────

import { GraduationCap, BookOpen, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import RevealSection from './RevealSection';

const QUALIFICATIONS: { name: string; sub: string; Icon: LucideIcon }[] = [
  { name: 'Cambridge CAIE', sub: 'IGCSE & A Levels', Icon: GraduationCap },
  { name: 'Pearson Edexcel', sub: 'IGCSE & IAL', Icon: BookOpen },
  { name: 'IELTS', sub: 'Academic & General', Icon: Globe },
];

export default function QualTrail() {
  return (
    <RevealSection>
      <div style={{ position: 'relative', padding: '50px 0 10px' }} className="quals-track-wrap">
        <div className="hp-quals-line" />

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
            const isEven = i % 2 === 1;
            const Icon = q.Icon;
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
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    margin: '0 auto 12px',
                    background: 'var(--hp-surface-2)',
                    border: '1px solid var(--hp-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} strokeWidth={2} style={{ color: 'var(--hp-ink-muted)' }} aria-hidden />
                </div>
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
