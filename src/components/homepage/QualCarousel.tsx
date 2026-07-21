'use client';

// ──────────────────────────────────────────────────────────────────────────────
// QualCarousel — Qualification board auto-advancing showcase
//
// Cycles through 3 active exam boards (CAIE, Edexcel, IELTS) with
// continuous auto-advance. Boards switch instantaneously — no slide
// animation. Upcoming boards (OSSD, SAT, Duolingo) appear as
// "Coming Soon" chips below.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { QUALIFICATION_BOARDS, UPCOMING_BOARDS } from '@/constants/homepage';
import RevealSection from './RevealSection';

const AUTO_ADVANCE_MS = 4500;

export default function QualCarousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = QUALIFICATION_BOARDS.length;

  const advance = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  // Continuous auto-advance — no pause on hover
  useEffect(() => {
    timerRef.current = setInterval(advance, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advance]);

  const board = QUALIFICATION_BOARDS[current];

  return (
    <RevealSection>
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* Slide card — content switches instantaneously */}
        <div
          style={{
            background: 'var(--hp-surface)',
            border: '1px solid var(--hp-border)',
            borderRadius: 'var(--hp-radius-lg)',
            padding: '48px 56px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >

          {/* Colored accent bar at top */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: board.color,
              opacity: 0.6,
            }}
          />

          {/* Emoji */}
          <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 16 }}>
            {board.emoji}
          </div>

          {/* Board name */}
          <h3
            style={{
              fontFamily: 'var(--hp-font-display)',
              fontSize: 'clamp(1.4rem, 2.8vw, 1.9rem)',
              fontWeight: 600,
              color: 'var(--hp-ink)',
              margin: '0 0 8px',
              letterSpacing: '-0.01em',
            }}
          >
            {board.name}
          </h3>

          {/* Qualifications */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: 14,
            }}
          >
            {board.qualifications.map((q) => (
              <span
                key={q}
                style={{
                  fontFamily: 'var(--hp-font-mono)',
                  fontSize: 11.5,
                  padding: '4px 12px',
                  borderRadius: 999,
                  background: 'var(--hp-surface-2)',
                  border: '1px solid var(--hp-border)',
                  color: 'var(--hp-ink-muted)',
                  letterSpacing: '0.04em',
                }}
              >
                {q}
              </span>
            ))}
          </div>

          {/* Description */}
          <p
            style={{
              fontFamily: 'var(--hp-font-body)',
              fontSize: 14.5,
              color: 'var(--hp-ink-muted)',
              lineHeight: 1.65,
              maxWidth: 480,
              margin: '0 auto',
            }}
          >
            {board.description}
          </p>
        </div>

        {/* Decorative dot indicators — purely visual, non-interactive */}
        <div
          aria-hidden="true"
          role="presentation"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginTop: 24,
          }}
        >
          {QUALIFICATION_BOARDS.map((_, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 999,
                background: i === current ? 'var(--hp-brand)' : 'var(--hp-border-strong)',
                transition: 'width 0.35s ease, background 0.35s ease',
              }}
            />
          ))}
        </div>

        {/* Coming Soon boards */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: 32,
          }}
        >
          {UPCOMING_BOARDS.map((board) => (
            <div
              key={board.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--hp-surface)',
                border: '1px dashed var(--hp-border-strong)',
                borderRadius: 999,
                padding: '8px 18px 8px 14px',
                opacity: 0.7,
                transition: 'opacity 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.opacity = '1';
                el.style.borderColor = 'var(--hp-amber)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.opacity = '0.7';
                el.style.borderColor = 'var(--hp-border-strong)';
              }}
            >
              <span style={{ fontSize: 18 }}>{board.emoji}</span>
              <span
                style={{
                  fontFamily: 'var(--hp-font-display)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--hp-ink)',
                }}
              >
                {board.name}
              </span>
              <span
                style={{
                  fontFamily: 'var(--hp-font-mono)',
                  fontSize: 10.5,
                  padding: '2px 9px',
                  borderRadius: 999,
                  background: 'var(--hp-amber)',
                  color: 'var(--hp-bg)',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                COMING SOON
              </span>
            </div>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}
