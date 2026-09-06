'use client';

// ──────────────────────────────────────────────────────────────────────────────
// QualCarousel — Qualification board auto-advancing showcase
// Lucide outline icons replace structural emojis.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GraduationCap,
  BookOpen,
  Globe,
  Map,
  PenLine,
  MessageCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { QUALIFICATION_BOARDS, UPCOMING_BOARDS } from '@/constants/homepage';
import RevealSection from './RevealSection';

const AUTO_ADVANCE_MS = 4500;

const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  BookOpen,
  Globe,
  Map,
  PenLine,
  MessageCircle,
};

export default function QualCarousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = QUALIFICATION_BOARDS.length;

  const advance = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  useEffect(() => {
    timerRef.current = setInterval(advance, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advance]);

  const board = QUALIFICATION_BOARDS[current];
  const BoardIcon = ICON_MAP[board.icon] || GraduationCap;

  return (
    <RevealSection>
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          position: 'relative',
        }}
      >
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

          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              margin: '0 auto 16px',
              background: 'var(--hp-surface-2)',
              border: '1px solid var(--hp-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BoardIcon size={28} strokeWidth={2} style={{ color: 'var(--hp-ink-muted)' }} />
          </div>

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

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: 32,
          }}
        >
          {UPCOMING_BOARDS.map((upcoming) => {
            const UpcomingIcon = ICON_MAP[upcoming.icon] || BookOpen;
            return (
              <div
                key={upcoming.name}
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
                <UpcomingIcon size={16} strokeWidth={2} style={{ color: 'var(--hp-ink-muted)' }} aria-hidden />
                <span
                  style={{
                    fontFamily: 'var(--hp-font-display)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--hp-ink)',
                  }}
                >
                  {upcoming.name}
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
            );
          })}
        </div>
      </div>
    </RevealSection>
  );
}
