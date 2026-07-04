'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Auth Split-Screen Layout
// 50/50 split: dark branding panel (left) + light form panel (right).
// ──────────────────────────────────────────────────────────────────────────────

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      {/* ── Left: Branding Panel ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'none',
          width: '50%',
          position: 'relative',
          overflow: 'hidden',
          background: '#080B12',
          padding: '60px 56px',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
        className="auth-brand-panel"
      >
        <style>{`
          .auth-brand-panel { display: flex; }
          @media (max-width: 860px) { .auth-brand-panel { display: none !important; } }
        `}</style>

        {/* Grid pattern overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(60, 219, 167, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(60, 219, 167, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }}
        />

        {/* Radial glow — navy to teal */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 560,
            height: 560,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(60, 219, 167, 0.10) 0%, rgba(8, 11, 18, 0) 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '20%',
            right: '15%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 65%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 40,
              fontFamily: "'Fraunces', Georgia, serif",
              fontWeight: 600,
              fontSize: 20,
              color: '#F3F6FB',
            }}
          >
            <span style={{ fontSize: 24 }}>🐜</span>
            The ANTS
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 'clamp(2.2rem, 3.6vw, 3rem)',
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              color: '#F3F6FB',
              margin: 0,
            }}
          >
            Master your{' '}
            <span
              style={{
                fontStyle: 'italic',
                background: 'linear-gradient(120deg, #3CDBA7 0%, #8C7FF0 70%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              learning
            </span>{' '}
            journey.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 15,
              lineHeight: 1.65,
              color: 'rgba(154, 167, 189, 0.8)',
              margin: '18px 0 0',
            }}
          >
            Your bridge to global education — timetables, flashcards, classrooms, and a community of mentors, all in one place.
          </p>

          {/* Decorative stats */}
          <div
            style={{
              display: 'flex',
              gap: 32,
              marginTop: 48,
              paddingTop: 32,
              borderTop: '1px solid rgba(148, 163, 184, 0.12)',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#3CDBA7',
                }}
              >
                120+
              </span>
              <p
                style={{
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  fontSize: 12,
                  color: 'rgba(154, 167, 189, 0.6)',
                  margin: '4px 0 0',
                }}
              >
                Active Clubs
              </p>
            </div>
            <div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#8C7FF0',
                }}
              >
                4
              </span>
              <p
                style={{
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  fontSize: 12,
                  color: 'rgba(154, 167, 189, 0.6)',
                  margin: '4px 0 0',
                }}
              >
                Role Types
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ─────────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 28px',
          background: '#FAF9F6',
        }}
        className="auth-form-panel"
      >
        <style>{`
          @media (min-width: 861px) {
            .auth-form-panel { width: 50% !important; }
          }
        `}</style>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {children}
        </div>
      </div>
    </div>
  );
}