'use client';

// ──────────────────────────────────────────────────────────────────────────────
// MentorPreview — Verified tutor cards for the Explore section
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Send, Star } from 'lucide-react';
import { MENTOR_PREVIEWS } from '@/constants/homepage';
import RevealSection from './RevealSection';

export default function MentorPreview() {
  return (
    <RevealSection>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18,
        }}
        className="hp-mentor-grid"
      >
        <style>{`
          @media (max-width: 900px) {
            .hp-mentor-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {MENTOR_PREVIEWS.map((m) => (
          <div
            key={m.name}
            className="hp-card-elevated"
            style={{
              background: 'var(--hp-surface)',
              border: '1px solid var(--hp-border)',
              borderRadius: 'var(--hp-radius-lg)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 280,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: `color-mix(in srgb, ${m.accent} 22%, transparent)`,
                    color: m.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--hp-font-body)',
                    fontWeight: 800,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {m.initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: 'var(--hp-font-display)',
                        fontSize: 17,
                        fontWeight: 600,
                        color: 'var(--hp-ink)',
                      }}
                    >
                      {m.name}
                    </h3>
                    <BadgeCheck
                      size={16}
                      style={{ color: 'var(--hp-brand)', flexShrink: 0 }}
                      fill="color-mix(in srgb, var(--hp-brand) 20%, transparent)"
                    />
                  </div>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontFamily: 'var(--hp-font-body)',
                      fontSize: 12.5,
                      color: 'var(--hp-ink-muted)',
                    }}
                  >
                    {m.location}
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                {m.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: 'var(--hp-font-mono)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '4px 9px',
                      borderRadius: 999,
                      background: `color-mix(in srgb, ${m.accent} 12%, transparent)`,
                      color: m.accent,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p
                style={{
                  margin: '14px 0 0',
                  fontFamily: 'var(--hp-font-body)',
                  fontSize: 13.5,
                  color: 'var(--hp-ink-muted)',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}
              >
                “{m.quote}”
              </p>
            </div>

            <div
              style={{
                marginTop: 18,
                paddingTop: 14,
                borderTop: '1px solid var(--hp-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontFamily: 'var(--hp-font-body)',
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: 'var(--hp-ink)',
                }}
              >
                <Star
                  size={14}
                  style={{ color: 'var(--hp-amber)' }}
                  fill="var(--hp-amber)"
                />
                {m.rating}{' '}
                <span style={{ fontWeight: 500, color: 'var(--hp-ink-faint)' }}>
                  ({m.reviews} reviews)
                </span>
              </span>
              <Link
                href="/explore?tab=tutors"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: 'var(--hp-bg-soft)',
                  border: '1px solid var(--hp-border)',
                  color: 'var(--hp-ink)',
                  fontFamily: 'var(--hp-font-body)',
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <Send size={13} style={{ color: 'var(--hp-violet)' }} />
                Telegram
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 28, textAlign: 'center' }}>
        <Link
          href="/explore?tab=tutors"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--hp-font-body)',
            fontSize: 14.5,
            fontWeight: 700,
            color: 'var(--hp-brand)',
            textDecoration: 'none',
          }}
        >
          View all 48+ verified tutors
          <ArrowRight size={16} />
        </Link>
      </div>
    </RevealSection>
  );
}
