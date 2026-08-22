'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — HeroVisual
// Illustrative widget panel shown below the hero CTAs.
// Contains a live-ticking exam countdown demo and a mini weekly timetable grid.
// All data is purely decorative — not connected to real user data.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import RevealSection from './RevealSection';

// Target: 18 days + 4 hours from first render (frozen at mount, not re-created)
function makeTarget() {
  const t = new Date();
  t.setDate(t.getDate() + 18);
  t.setHours(t.getHours() + 4);
  return t;
}

interface CountdownState {
  d: string;
  h: string;
  m: string;
  s: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// Mini timetable static data (Mon–Fri, colour-coded blocks)
const TT_COLS = [
  { day: 'Mon', blocks: ['b1', 'b2'] },
  { day: 'Tue', blocks: ['b3'] },
  { day: 'Wed', blocks: ['b1', 'b2', 'b3'] },
  { day: 'Thu', blocks: ['b2'] },
  { day: 'Fri', blocks: ['b1', 'b3'] },
];

const BLOCK_STYLES: Record<string, React.CSSProperties> = {
  b1: { background: 'var(--hp-brand)', height: 26, opacity: 0.88 },
  b2: { background: 'var(--hp-violet)', height: 16, opacity: 0.80 },
  b3: { background: 'var(--hp-amber)', height: 20, opacity: 0.88 },
};

export default function HeroVisual() {
  const [target] = useState<Date>(makeTarget);
  const [cd, setCd] = useState<CountdownState>({ d: '--', h: '--', m: '--', s: '--' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function tick() {
      const now = new Date();
      let diff = Math.max(0, target.getTime() - now.getTime());
      const d = Math.floor(diff / 86_400_000); diff -= d * 86_400_000;
      const h = Math.floor(diff / 3_600_000);  diff -= h * 3_600_000;
      const m = Math.floor(diff / 60_000);      diff -= m * 60_000;
      const s = Math.floor(diff / 1_000);
      setCd({ d: pad(d), h: pad(h), m: pad(m), s: pad(s) });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!mounted) return null; // avoid hydration mismatch for countdown

  return (
    <RevealSection
      className="mx-auto mt-16 w-full max-w-3xl"
      delayMs={400}
    >
      {/* Browser chrome */}
      <div
        style={{
          borderRadius: 'var(--hp-radius-lg)',
          border: '1px solid var(--hp-border)',
          background: 'linear-gradient(180deg, var(--hp-surface) 0%, var(--hp-bg-soft) 100%)',
          padding: 22,
          boxShadow: '0 40px 90px -40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Traffic-light dots */}
        <div style={{ display: 'flex', gap: 6, padding: '2px 6px 16px' }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 9, height: 9, borderRadius: '50%',
                background: 'var(--hp-border-strong)',
                display: 'inline-block',
              }}
            />
          ))}
        </div>

        {/* Two-column grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1.6fr',
            gap: 16,
          }}
          className="max-[720px]:[grid-template-columns:1fr]"
        >
          {/* ── Mini countdown ── */}
          <div
            className="hp-panel-float"
            style={{
              background: 'var(--hp-bg-soft)',
              border: '1px solid var(--hp-border)',
              borderRadius: 'var(--hp-radius-md)',
              padding: 20,
              textAlign: 'left',
              boxShadow:
                '0 1px 3px rgba(0,0,0,0.06), ' +
                '0 6px 18px rgba(0,0,0,0.05), ' +
                '0 14px 40px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.35s var(--hp-ease-out), transform 0.35s var(--hp-ease-out)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--hp-font-mono)',
                fontSize: 11,
                color: 'var(--hp-ink-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Exam countdown
            </div>
            <div
              style={{
                fontFamily: 'var(--hp-font-display)',
                fontSize: 18,
                color: 'var(--hp-ink)',
                margin: '6px 0 16px',
                lineHeight: 1.2,
              }}
            >
              IGCSE Physics · Paper 1
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ val: cd.d, label: 'DAYS' }, { val: cd.h, label: 'HRS' }, { val: cd.m, label: 'MIN' }, { val: cd.s, label: 'SEC' }].map(({ val, label }) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    background: 'var(--hp-surface-2)',
                    border: '1px solid var(--hp-border)',
                    borderRadius: 10,
                    padding: '10px 4px',
                    textAlign: 'center',
                  }}
                >
                  <b
                    style={{
                      display: 'block',
                      fontFamily: 'var(--hp-font-mono)',
                      fontSize: 19,
                      color: 'var(--hp-amber)',
                      fontWeight: 600,
                    }}
                  >
                    {val}
                  </b>
                  <span style={{ fontSize: 9, color: 'var(--hp-ink-faint)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Mini timetable ── */}
          <div
            className="hp-panel-float"
            style={{
              background: 'var(--hp-bg-soft)',
              border: '1px solid var(--hp-border)',
              borderRadius: 'var(--hp-radius-md)',
              padding: 20,
              textAlign: 'left',
              boxShadow:
                '0 1px 3px rgba(0,0,0,0.06), ' +
                '0 6px 18px rgba(0,0,0,0.05), ' +
                '0 14px 40px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.35s var(--hp-ease-out), transform 0.35s var(--hp-ease-out)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--hp-font-mono)',
                fontSize: 11,
                color: 'var(--hp-ink-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 14,
              }}
            >
              This week
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {TT_COLS.map(({ day, blocks }) => (
                <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div
                    style={{
                      fontFamily: 'var(--hp-font-mono)',
                      fontSize: 10,
                      color: 'var(--hp-ink-faint)',
                      textAlign: 'center',
                      marginBottom: 2,
                    }}
                  >
                    {day}
                  </div>
                  {blocks.map((b, bi) => (
                    <div
                      key={bi}
                      style={{
                        ...BLOCK_STYLES[b],
                        borderRadius: 5,
                        width: '100%',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
