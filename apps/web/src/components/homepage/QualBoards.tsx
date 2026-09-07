'use client';

// ──────────────────────────────────────────────────────────────────────────────
// QualBoards — Three exam-board cards + upcoming pipeline chips
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, Mic } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { QUALIFICATION_BOARDS, UPCOMING_BOARDS } from '@/constants/homepage';
import RevealSection from './RevealSection';

const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  BookOpen,
  Mic,
};

export default function QualBoards() {
  return (
    <RevealSection>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18,
        }}
        className="hp-qual-boards"
      >
        <style>{`
          @media (max-width: 900px) {
            .hp-qual-boards { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {QUALIFICATION_BOARDS.map((board) => {
          const Icon = ICON_MAP[board.icon] || GraduationCap;
          return (
            <div
              key={board.name}
              className="hp-card-elevated"
              style={{
                background: 'var(--hp-surface)',
                border: '1px solid var(--hp-border)',
                borderRadius: 'var(--hp-radius-lg)',
                padding: 26,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 280,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--hp-font-mono)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '5px 10px',
                      borderRadius: 999,
                      background: `color-mix(in srgb, ${board.color} 14%, transparent)`,
                      color: board.color,
                    }}
                  >
                    {board.badge}
                  </span>
                  <Icon size={22} style={{ color: board.color }} strokeWidth={2} aria-hidden />
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--hp-font-display)',
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'var(--hp-ink)',
                    margin: '18px 0 8px',
                  }}
                >
                  {board.name}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 13.5,
                    color: 'var(--hp-ink-muted)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {board.description}
                </p>

                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  {board.qualifications.map((q) => (
                    <span
                      key={q}
                      style={{
                        fontFamily: 'var(--hp-font-mono)',
                        fontSize: 11,
                        padding: '5px 10px',
                        borderRadius: 8,
                        background: 'var(--hp-bg-soft)',
                        border: '1px solid var(--hp-border)',
                        color: 'var(--hp-ink-muted)',
                      }}
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                href={board.href}
                style={{
                  marginTop: 22,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--hp-font-body)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: board.color,
                  textDecoration: 'none',
                }}
              >
                {board.cta}
                <ArrowRight size={15} />
              </Link>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 28,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--hp-font-body)',
            fontSize: 13.5,
            color: 'var(--hp-ink-muted)',
          }}
        >
          In active compilation:
        </span>
        {UPCOMING_BOARDS.map((b) => (
          <span
            key={b.name}
            style={{
              fontFamily: 'var(--hp-font-body)',
              fontSize: 12.5,
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 999,
              background: 'var(--hp-surface)',
              border: '1px solid var(--hp-border)',
              color: 'var(--hp-ink)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            {b.name} · {b.status}
          </span>
        ))}
      </div>
    </RevealSection>
  );
}
