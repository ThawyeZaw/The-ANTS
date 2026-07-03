'use client';

// ──────────────────────────────────────────────────────────────────────────────
// QualCarousel — Qualification board carousel
// Cycles through 6 exam boards (CAIE, Edexcel, OSSD, IELTS, SAT, Duolingo)
// with minimalist chevron navigation, auto-advance, and dot indicators.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { QUALIFICATION_BOARDS } from '@/constants/homepage';
import RevealSection from './RevealSection';

const AUTO_ADVANCE_MS = 5000;

export default function QualCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = QUALIFICATION_BOARDS.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + total) % total);
    },
    [total]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(next, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, next]);

  const board = QUALIFICATION_BOARDS[current];

  return (
    <RevealSection>
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          position: 'relative',
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Slide card */}
        <div
          style={{
            background: 'var(--hp-surface)',
            border: '1px solid var(--hp-border)',
            borderRadius: 'var(--hp-radius-lg)',
            padding: '48px 56px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.3s ease',
          }}
        >
          {/* Colored accent bar at top */}
          <div
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>{board.emoji}</div>

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

        {/* Chevron controls */}
        <button
          onClick={prev}
          aria-label="Previous qualification"
          style={{
            position: 'absolute',
            top: '50%',
            left: -20,
            transform: 'translateY(-50%)',
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '1px solid var(--hp-border-strong)',
            background: 'var(--hp-surface)',
            color: 'var(--hp-ink-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'var(--hp-surface-2)';
            el.style.color = 'var(--hp-ink)';
            el.style.borderColor = 'var(--hp-ink-faint)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'var(--hp-surface)';
            el.style.color = 'var(--hp-ink-muted)';
            el.style.borderColor = 'var(--hp-border-strong)';
          }}
        >
          <ChevronLeft size={18} strokeWidth={1.8} />
        </button>

        <button
          onClick={next}
          aria-label="Next qualification"
          style={{
            position: 'absolute',
            top: '50%',
            right: -20,
            transform: 'translateY(-50%)',
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '1px solid var(--hp-border-strong)',
            background: 'var(--hp-surface)',
            color: 'var(--hp-ink-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'var(--hp-surface-2)';
            el.style.color = 'var(--hp-ink)';
            el.style.borderColor = 'var(--hp-ink-faint)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'var(--hp-surface)';
            el.style.color = 'var(--hp-ink-muted)';
            el.style.borderColor = 'var(--hp-border-strong)';
          }}
        >
          <ChevronRight size={18} strokeWidth={1.8} />
        </button>

        {/* Dot indicators */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginTop: 24,
          }}
        >
          {QUALIFICATION_BOARDS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 999,
                border: 'none',
                background: i === current ? 'var(--hp-brand)' : 'var(--hp-border-strong)',
                cursor: 'pointer',
                transition: 'width 0.3s ease, background 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Mobile chevron repositioning */}
        <style>{`
          @media (max-width: 640px) {
            .hp-carousel-chevron-left { left: -12px !important; width: 36px !important; height: 36px !important; }
            .hp-carousel-chevron-right { right: -12px !important; width: 36px !important; height: 36px !important; }
          }
        `}</style>
      </div>
    </RevealSection>
  );
}