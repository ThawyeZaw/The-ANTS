'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — RoleLadder
// Four-step ascending ladder: Student → Teacher → Contributor → Main Contributor.
// All rungs sit at the same baseline. Arrows between rungs show upward flow;
// a "gatekeeper" visual ties every upgrade back to Main Contributor approval.
// Collapses to a vertical stack with a rotated connector on mobile (≤900px).
// ──────────────────────────────────────────────────────────────────────────────

import { ArrowUp, Lock, ShieldCheck } from 'lucide-react';
import RevealSection from './RevealSection';

const ROLES = [
  {
    stepTag: 'Everyone starts here',
    title: 'Student',
    description:
      'Access all study tools — timetables, flashcards, grade calculators, and more. Join classrooms and clubs.',
  },
  {
    stepTag: 'Upgrade  ·  requires approval',
    title: 'Teacher',
    description:
      'Everything students get, plus create classrooms, issue assignments, and track student progress.',
  },
  {
    stepTag: 'Upgrade  ·  requires approval',
    title: 'Contributor',
    description:
      'Build curriculum resources, create notes, lead clubs, and get a public contributor profile.',
  },
  {
    stepTag: 'Gatekeeper  ·  approves every upgrade',
    title: 'Main Contributor',
    description:
      'Review and approve submissions before they go live, and approve every role upgrade request.',
    highlight: true,
  },
];

export default function RoleLadder() {
  return (
    <RevealSection>
      {/* Ladder */}
      <div className="hp-ladder" style={{ gap: 0 }}>
        <style>{`
          @media (max-width: 900px) {
            .hp-ladder { flex-direction: column; align-items: stretch; }
            .hp-rung   { margin-bottom: 0 !important; }
            .hp-connector { width: auto !important; height: 34px; transform: rotate(90deg); margin: 0 auto; }
          }
        `}</style>

        {ROLES.map((role, i) => (
          <div key={role.title} style={{ display: 'contents' }}>
            {/* Rung card — all at the same baseline */}
            <div
              className="hp-rung hp-card-elevated"
              style={{
                flex: 1,
                background: role.highlight
                  ? 'linear-gradient(160deg, var(--hp-surface) 60%, rgba(153,41,234,0.10))'
                  : 'var(--hp-surface)',
                border: role.highlight
                  ? '1px solid rgba(153,41,234,0.40)'
                  : '1px solid var(--hp-border)',
                borderRadius: 'var(--hp-radius-md)',
                padding: '26px 22px',
                marginBottom: 0,
                transition: 'border-color 0.2s ease, transform 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = role.highlight
                  ? 'rgba(153,41,234,0.65)'
                  : 'var(--hp-border-strong)';
                el.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = role.highlight
                  ? 'rgba(153,41,234,0.40)'
                  : 'var(--hp-border)';
                el.style.transform = 'translateY(0)';
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--hp-font-mono)',
                  fontSize: 10.5,
                  color: role.highlight ? 'var(--hp-amber)' : 'var(--hp-ink-faint)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  display: 'block',
                }}
              >
                {role.stepTag}
              </span>
              <h3
                style={{
                  fontFamily: 'var(--hp-font-display)',
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--hp-ink)',
                  margin: '0 0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {role.title}
                {role.highlight && (
                  <ShieldCheck
                    size={18}
                    style={{ color: 'var(--hp-amber)', flexShrink: 0 }}
                    strokeWidth={1.8}
                  />
                )}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--hp-font-body)',
                  fontSize: 13,
                  color: 'var(--hp-ink-muted)',
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {role.description}
              </p>

              {/* Colony-size indicator — tiny ant dots growing at each tier */}
              <div
                style={{
                  display: 'flex',
                  gap: 5,
                  justifyContent: 'center',
                  marginTop: 'auto',
                  paddingTop: 14,
                }}
                aria-hidden="true"
              >
                {Array.from({ length: i + 1 }).map((_, j) => (
                  <span
                    key={j}
                    style={{
                      width: j === i && role.highlight ? 5.5 : 4.5,
                      height: j === i && role.highlight ? 5.5 : 4.5,
                      borderRadius: '50%',
                      background: role.highlight ? 'var(--hp-amber)' : 'var(--hp-brand)',
                      opacity: j === i && role.highlight ? 0.9 : 0.55,
                      boxShadow: role.highlight ? '0 0 3px var(--hp-amber)' : 'none',
                      display: 'inline-block',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Connector — upward arrow showing approval flow */}
            {i < ROLES.length - 1 && (
              <div
                className="hp-connector"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  gap: 4,
                  flexShrink: 0,
                  userSelect: 'none',
                }}
                aria-hidden="true"
              >
                <ArrowUp size={16} strokeWidth={1.5} style={{ color: 'var(--hp-amber)', opacity: 0.7 }} />
                <Lock size={10} strokeWidth={1.5} style={{ color: 'var(--hp-ink-faint)', opacity: 0.4 }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gatekeeper flow note */}
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--hp-bg-soft)',
          border: '1px solid var(--hp-border)',
          borderRadius: 12,
          padding: '13px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(153,41,234,0.10)',
            border: '1px solid rgba(153,41,234,0.25)',
            borderRadius: 999,
            padding: '4px 12px',
          }}
        >
          <ShieldCheck size={13} style={{ color: 'var(--hp-amber)' }} strokeWidth={1.8} />
          <span
            style={{
              fontFamily: 'var(--hp-font-mono)',
              fontSize: 10.5,
              fontWeight: 600,
              color: 'var(--hp-amber)',
              letterSpacing: '0.06em',
            }}
          >
            Main Contributor
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--hp-font-body)',
            fontSize: 13,
            color: 'var(--hp-ink-muted)',
            lineHeight: 1.5,
          }}
        >
          Every upgrade must be approved by a Main Contributor.
          No downgrades. No shortcuts. One ladder, one gatekeeper.
        </span>
      </div>
    </RevealSection>
  );
}
