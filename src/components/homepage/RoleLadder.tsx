'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — RoleLadder
// Four-step ascending ladder: Student → Teacher → Contributor → Main Contributor.
// Each rung sits progressively higher (bottom-margin staircase) on desktop.
// Arrows between rungs; a lock note below describing the upgrade-only rule.
// Collapses to a vertical stack with a rotated connector on mobile (≤900px).
// ──────────────────────────────────────────────────────────────────────────────

import { Lock } from 'lucide-react';
import RevealSection from './RevealSection';

const ROLES = [
  {
    stepTag: 'Everyone starts here',
    title: 'Student',
    description:
      'Access all study tools — timetables, flashcards, grade calculators, and more. Join classrooms and clubs.',
    rungClass: 'r1',
    mbPx: 0,
  },
  {
    stepTag: 'Upgrade · paid tier',
    title: 'Teacher',
    description:
      'Everything students get, plus create classrooms, issue assignments, and track student progress.',
    rungClass: 'r2',
    mbPx: 16,
  },
  {
    stepTag: 'Upgrade · verified expert',
    title: 'Contributor',
    description:
      'Build curriculum resources, create notes, lead clubs, and get a public contributor profile.',
    rungClass: 'r3',
    mbPx: 32,
  },
  {
    stepTag: 'Upgrade · senior gatekeeper',
    title: 'Main Contributor',
    description:
      'Review and approve submissions before they go live, and approve every role upgrade request.',
    rungClass: 'r4',
    mbPx: 48,
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
            {/* Rung card */}
            <div
              className="hp-rung"
              style={{
                flex: 1,
                background: role.highlight
                  ? 'linear-gradient(160deg, var(--hp-surface) 60%, rgba(242,184,75,0.08))'
                  : 'var(--hp-surface)',
                border: role.highlight
                  ? '1px solid rgba(242,184,75,0.35)'
                  : '1px solid var(--hp-border)',
                borderRadius: 'var(--hp-radius-md)',
                padding: '26px 22px',
                marginBottom: role.mbPx,
                transition: 'border-color 0.2s ease, transform 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = role.highlight
                  ? 'rgba(242,184,75,0.6)'
                  : 'var(--hp-border-strong)';
                el.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = role.highlight
                  ? 'rgba(242,184,75,0.35)'
                  : 'var(--hp-border)';
                el.style.transform = 'translateY(0)';
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--hp-font-mono)',
                  fontSize: 10.5,
                  color: 'var(--hp-amber)',
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
                }}
              >
                {role.title}
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
            </div>

            {/* Arrow connector — not after the last card */}
            {i < ROLES.length - 1 && (
              <div
                className="hp-connector"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  fontFamily: 'var(--hp-font-mono)',
                  color: 'var(--hp-ink-faint)',
                  fontSize: 18,
                  flexShrink: 0,
                  userSelect: 'none',
                }}
                aria-hidden="true"
              >
                →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lock note */}
      <div
        style={{
          marginTop: 20,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          fontSize: 13,
          color: 'var(--hp-ink-faint)',
          background: 'var(--hp-bg-soft)',
          border: '1px solid var(--hp-border)',
          borderRadius: 12,
          padding: '14px 16px',
        }}
      >
        <Lock
          style={{ width: 16, height: 16, color: 'var(--hp-amber)', flexShrink: 0, marginTop: 2 }}
          strokeWidth={1.8}
        />
        <span>
          Roles are one-way: every account starts as a Student, and moving up always requires a
          Main Contributor&apos;s approval. There&apos;s no downgrade path — and no shortcuts.
        </span>
      </div>
    </RevealSection>
  );
}
