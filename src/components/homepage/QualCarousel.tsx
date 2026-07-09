'use client';

// ──────────────────────────────────────────────────────────────────────────────
// QualCarousel — Qualification board auto-advancing showcase
//
// Cycles through 6 exam boards (CAIE, Edexcel, OSSD, IELTS, SAT, Duolingo)
// with a continuous auto-advance animation. Non-interactive: no chevrons,
// no clickable dots, no keyboard or mouse input. Dots serve as purely
// decorative progress indicators.
//
// Each slide transition uses a subtle fade + scale animation tied to the
// current slide index, replaying via React key remounting.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { QUALIFICATION_BOARDS } from '@/constants/homepage';
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
        {/* Slide card — keyed on current index for animation replay */}
        <div
          key={current}
          className="hp-carousel-slide"
          style={{
            animation: 'carouselSlideIn 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) both',
            background: 'var(--hp-surface)',
            border: '1px solid var(--hp-border)',
            borderRadius: 'var(--hp-radius-lg)',
            padding: '48px 56px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <style>{`
            @keyframes carouselSlideIn {
              from { opacity: 0; transform: translateY(12px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0)    scale(1); }
            }
          `}</style>

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
      </div>
    </RevealSection>
  );
}
