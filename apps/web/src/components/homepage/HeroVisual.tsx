'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — HeroVisual
// Floating study-session mockup (right column of the hero).
// Decorative only — pomodoro ticks for presence; not wired to real user data.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { Timer, AudioLines, Medal } from 'lucide-react';
import RevealSection from './RevealSection';

const POMO_START = 24 * 60 + 15; // 24:15

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function HeroVisual() {
  const [seconds, setSeconds] = useState(POMO_START);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || paused) return;
    const id = setInterval(() => {
      setSeconds((s) => (s <= 0 ? POMO_START : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [mounted, paused]);

  const mm = pad(Math.floor(seconds / 60));
  const ss = pad(seconds % 60);

  if (!mounted) return null;

  return (
    <RevealSection className="hp-hero-visual" delayMs={280}>
      <div
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
        {/* Soft glows behind mockup */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -24,
            top: -28,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--hp-brand) 18%, transparent)',
            filter: 'blur(48px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -20,
            bottom: -20,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--hp-violet) 16%, transparent)',
            filter: 'blur(44px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Main workspace card */}
        <div
          className="hp-panel-float"
          style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: 'var(--hp-radius-lg)',
            border: '1px solid var(--hp-border)',
            background: 'var(--hp-surface)',
            padding: 22,
            boxShadow:
              '0 1px 3px rgba(0,0,0,0.06), 0 18px 48px rgba(0,0,0,0.10)',
            textAlign: 'left',
          }}
        >
          {/* Chrome strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {['#ef4444', 'var(--hp-amber)', 'var(--hp-brand)'].map((c) => (
                <span
                  key={c}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: c,
                    display: 'inline-block',
                  }}
                />
              ))}
              <span
                style={{
                  marginLeft: 6,
                  fontFamily: 'var(--hp-font-mono)',
                  fontSize: 11,
                  color: 'var(--hp-ink-faint)',
                }}
              >
                ants_workspace_v2.5
              </span>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'color-mix(in srgb, var(--hp-violet) 12%, transparent)',
                color: 'var(--hp-violet)',
                fontFamily: 'var(--hp-font-mono)',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--hp-violet)',
                  display: 'inline-block',
                  animation: 'hpPulseDot 1.6s ease-in-out infinite',
                }}
              />
              3 squads active
            </span>
          </div>

          {/* Subject progress */}
          <div
            style={{
              background: 'var(--hp-bg-soft)',
              border: '1px solid var(--hp-border)',
              borderRadius: 'var(--hp-radius-md)',
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--hp-font-mono)',
                    fontSize: 10.5,
                    color: 'var(--hp-ink-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Cambridge CAIE 0625
                </div>
                <div
                  style={{
                    fontFamily: 'var(--hp-font-display)',
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--hp-ink)',
                    marginTop: 4,
                    lineHeight: 1.25,
                  }}
                >
                  IGCSE Physics: Nuclear Decay
                </div>
              </div>
              <span
                style={{
                  flexShrink: 0,
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: 'color-mix(in srgb, var(--hp-brand) 14%, transparent)',
                  color: 'var(--hp-brand-deep)',
                  fontFamily: 'var(--hp-font-body)',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                94% Done
              </span>
            </div>

            <div
              style={{
                marginTop: 12,
                width: '100%',
                height: 8,
                borderRadius: 999,
                background: 'var(--hp-surface-2)',
                border: '1px solid var(--hp-border)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '94%',
                  height: '100%',
                  borderRadius: 999,
                  background:
                    'linear-gradient(90deg, var(--hp-brand) 0%, var(--hp-amber) 100%)',
                }}
              />
            </div>
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--hp-font-body)',
                fontSize: 12.5,
                color: 'var(--hp-ink-muted)',
              }}
            >
              <span>8 / 9 Topic Sub-units</span>
              <span style={{ color: 'var(--hp-brand)', fontWeight: 600 }}>
                Predicted A* / 9
              </span>
            </div>
          </div>

          {/* Pomodoro + Lo-Fi */}
          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
            className="max-[420px]:[grid-template-columns:1fr]"
          >
            <div
              style={{
                background: 'var(--hp-bg)',
                border: '1px solid var(--hp-border)',
                borderRadius: 'var(--hp-radius-md)',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 10,
                minHeight: 132,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: 'var(--hp-font-mono)',
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: 'var(--hp-ink-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Pomodoro
                </span>
                <Timer size={16} style={{ color: 'var(--hp-brand)' }} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--hp-font-mono)',
                    fontSize: 28,
                    fontWeight: 700,
                    color: 'var(--hp-ink)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  {mm}:{ss}
                </div>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--hp-brand-deep)',
                  }}
                >
                  Deep Work Mode
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--hp-brand)',
                    color: 'var(--hp-btn-text)',
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {paused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSeconds(POMO_START);
                    setPaused(false);
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--hp-border)',
                    background: 'var(--hp-surface)',
                    color: 'var(--hp-ink-muted)',
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            <div
              style={{
                background: 'var(--hp-bg)',
                border: '1px solid var(--hp-border)',
                borderRadius: 'var(--hp-radius-md)',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 10,
                minHeight: 132,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: 'var(--hp-font-mono)',
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: 'var(--hp-ink-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Lo-Fi Stream
                </span>
                <AudioLines size={16} style={{ color: 'var(--hp-violet)' }} />
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--hp-ink)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Yangon Monsoon Rain
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 12.5,
                    color: 'var(--hp-ink-muted)',
                  }}
                >
                  BPM 72 · Study Chill
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  aria-hidden
                  style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16 }}
                >
                  {[12, 16, 8, 14].map((h, i) => (
                    <span
                      key={i}
                      style={{
                        width: 3,
                        height: h,
                        borderRadius: 2,
                        background: i % 2 === 0 ? 'var(--hp-brand)' : 'var(--hp-violet)',
                        opacity: 0.85,
                        animation: `hpEqBar ${0.7 + i * 0.15}s ease-in-out infinite alternate`,
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 12.5,
                    color: 'var(--hp-ink-muted)',
                  }}
                >
                  Playing
                </span>
              </div>
            </div>
          </div>

          {/* Peer achievement */}
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: 'color-mix(in srgb, var(--hp-bg-soft) 80%, transparent)',
              border: '1px solid var(--hp-border)',
              borderRadius: 'var(--hp-radius-md)',
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--hp-violet)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--hp-font-body)',
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                SZ
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: 'var(--hp-ink)',
                  }}
                >
                  Su Zar Ni
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 12,
                    color: 'var(--hp-ink-muted)',
                  }}
                >
                  Cambridge CAIE Math
                </p>
              </div>
            </div>
            <span
              style={{
                flexShrink: 0,
                padding: '5px 10px',
                borderRadius: 999,
                background: 'color-mix(in srgb, var(--hp-amber) 18%, transparent)',
                color: 'var(--hp-amber-deep)',
                fontFamily: 'var(--hp-font-mono)',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              A* Grade Achieved
            </span>
          </div>
        </div>

        {/* Floating IELTS badge */}
        <div
          className="hp-hero-float-badge"
          style={{
            position: 'absolute',
            zIndex: 2,
            left: -12,
            bottom: -22,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 'var(--hp-radius-md)',
            background: 'var(--hp-surface)',
            border: '1px solid var(--hp-border)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'color-mix(in srgb, var(--hp-violet) 16%, transparent)',
              color: 'var(--hp-violet)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Medal size={15} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--hp-font-body)',
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--hp-ink)',
              }}
            >
              IELTS Band 8.5 Flex
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--hp-font-body)',
                fontSize: 11.5,
                color: 'var(--hp-ink-muted)',
              }}
            >
              Aung Khant · ILBC Alumni
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hpPulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes hpEqBar {
          from { transform: scaleY(0.55); }
          to { transform: scaleY(1); }
        }
        @media (max-width: 640px) {
          .hp-hero-float-badge { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hp-hero-visual * { animation: none !important; }
        }
      `}</style>
    </RevealSection>
  );
}
