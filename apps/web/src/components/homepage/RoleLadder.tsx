'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — RoleLadder (Ecosystem Ladder)
// Four numbered role cards. No clubs/classrooms copy.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { Shield } from 'lucide-react';
import RevealSection from './RevealSection';

const ROLES = [
  {
    n: '01',
    tag: 'ENTRY',
    title: 'Student',
    description:
      'Everyone starts here. Get access to smart timetables, lesson progress trackers, and past paper mark scheme indices.',
    footer: 'FREE FOREVER',
    footerAccent: true,
  },
  {
    n: '02',
    tag: 'UPGRADE',
    title: 'Teacher',
    description:
      'Everything students get, plus guide learners, assign weekly homework mocks, and track progress in real time.',
    footer: 'Requires Mentor Verification',
    footerAccent: false,
  },
  {
    n: '03',
    tag: 'COMMUNITY',
    title: 'Contributor',
    description:
      'Build the national curriculum library. Share study packs, submit syllabus notes, and earn verified public profile credentials.',
    footer: 'Reviewed by Main Gatekeepers',
    footerAccent: false,
  },
  {
    n: '04',
    tag: 'GATEKEEPER',
    title: 'Main Contributor',
    description:
      'The custodians of academic quality. Review curriculum before release and approve community role upgrade petitions.',
    footer: 'Supreme Editorial Board',
    footerAccent: true,
    highlight: true,
  },
];

export default function RoleLadder() {
  return (
    <RevealSection>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}
        className="hp-role-grid"
      >
        <style>{`
          @media (max-width: 960px) {
            .hp-role-grid { grid-template-columns: 1fr 1fr !important; }
          }
          @media (max-width: 640px) {
            .hp-role-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {ROLES.map((role) => (
          <div
            key={role.title}
            className="hp-card-elevated"
            style={{
              background: role.highlight
                ? 'linear-gradient(160deg, var(--hp-surface) 55%, color-mix(in srgb, var(--hp-violet) 10%, transparent))'
                : 'var(--hp-surface)',
              border: role.highlight
                ? '1px solid color-mix(in srgb, var(--hp-violet) 40%, transparent)'
                : '1px solid var(--hp-border)',
              borderRadius: 'var(--hp-radius-lg)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 240,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--hp-bg-soft)',
                    border: '1px solid var(--hp-border)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--hp-font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: role.highlight ? 'var(--hp-violet)' : 'var(--hp-brand)',
                  }}
                >
                  {role.n}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--hp-font-mono)',
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    padding: '4px 9px',
                    borderRadius: 999,
                    background: role.highlight
                      ? 'color-mix(in srgb, var(--hp-violet) 14%, transparent)'
                      : 'var(--hp-bg-soft)',
                    color: role.highlight ? 'var(--hp-violet)' : 'var(--hp-ink-muted)',
                    border: '1px solid var(--hp-border)',
                  }}
                >
                  {role.tag}
                </span>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--hp-font-display)',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--hp-ink)',
                  margin: '16px 0 8px',
                }}
              >
                {role.title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--hp-font-body)',
                  fontSize: 13.5,
                  color: 'var(--hp-ink-muted)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {role.description}
              </p>
            </div>

            <div style={{ marginTop: 18, paddingTop: 12 }}>
              <span
                style={{
                  fontFamily: 'var(--hp-font-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: role.footerAccent
                    ? role.highlight
                      ? 'var(--hp-violet)'
                      : 'var(--hp-brand)'
                    : 'var(--hp-ink-faint)',
                }}
              >
                {role.footer}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 24,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--hp-surface)',
          border: '1px solid var(--hp-border)',
          borderRadius: 'var(--hp-radius-lg)',
          padding: '18px 22px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'color-mix(in srgb, var(--hp-brand) 16%, transparent)',
              color: 'var(--hp-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Shield size={18} strokeWidth={2} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--hp-font-display)',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--hp-ink)',
              }}
            >
              Zero Downgrades. Zero Shortcuts.
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--hp-font-body)',
                fontSize: 13,
                color: 'var(--hp-ink-muted)',
                lineHeight: 1.5,
              }}
            >
              Every upgrade is vetted by Myanmar international students with proven A* credentials.
            </p>
          </div>
        </div>
        <Link
          href="/about"
          style={{
            fontFamily: 'var(--hp-font-body)',
            fontSize: 13.5,
            fontWeight: 700,
            color: 'var(--hp-brand)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Read Role Guidelines
        </Link>
      </div>
    </RevealSection>
  );
}
