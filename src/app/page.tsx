'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Public Home / Landing Page (redesigned)
// Visual redesign based on the-ants-redesign.html mockup.
// All original copy is preserved verbatim.
// New components: HeroVisual, BentoFeatures, QualTrail, RoleLadder.
// Dark palette is scoped to the .hp class — does not affect authenticated pages.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { ArrowRight, MessageSquare, Users, Sun, Moon, Home } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLandingPath } from '@/lib/utils';
import HomepageFonts from '@/components/homepage/HomepageFonts';
import HeroVisual from '@/components/homepage/HeroVisual';
import BentoFeatures from '@/components/homepage/BentoFeatures';
import QualTrail from '@/components/homepage/QualTrail';
import QualCarousel from '@/components/homepage/QualCarousel';
import RoleLadder from '@/components/homepage/RoleLadder';
import RevealSection from '@/components/homepage/RevealSection';
import StatsRow from '@/components/homepage/StatsRow';
import AntTrailPattern from '@/components/homepage/AntTrailPattern';
import AntHeroAccent from '@/components/homepage/AntHeroAccent';
import Footer from '@/components/layout/Footer';

// ── Explore card data ─────────────────────────────────────────────────────────

const EXPLORE_CARDS = [
  {
    title: 'Clubs',
    description:
      'Discover community spaces for subjects, CCAs and projects. Browse clubs and see what members are building.',
    Icon: MessageSquare,
    href: '/explore/clubs',
      iconBg: 'rgba(var(--hp-brand-rgb), 0.12)',
      iconColor: 'var(--hp-brand)',
    stats: [
      { value: '120+', label: 'ACTIVE CLUBS' },
      { value: 'Open', label: 'JOIN MODES VARY' },
    ],
  },
  {
    title: 'Profiles',
    description:
      'Browse student portfolios, projects, CCA activities and verified educators & contributors. View achievements and credentials.',
    Icon: Users,
    href: '/explore/profiles',
    iconBg: 'rgba(var(--hp-violet-rgb), 0.14)',
    iconColor: 'var(--hp-violet)',
    stats: [
      { value: '4', label: 'ROLE TYPES' },
      { value: 'Public', label: 'SHAREABLE LINK' },
    ],
  },
];

// ── Shared section heading ────────────────────────────────────────────────────

function SectionHead({
  eyebrow,
  heading,
  gradPhrase,
  subtext,
  align = 'center',
}: {
  eyebrow: string;
  heading: string;
  gradPhrase: string;
  subtext?: string;
  align?: 'center' | 'left';
}) {
  const textAlign = align === 'center' ? 'center' : 'left';
  const mx = align === 'center' ? 'auto' : '0';

  return (
    <RevealSection>
      <div
        style={{
          maxWidth: 640,
          margin: `0 ${mx} 56px`,
          textAlign,
        }}
      >
        <span className="hp-eyebrow">{eyebrow}</span>
        <h2
          style={{
            fontFamily: 'var(--hp-font-display)',
            fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)',
            fontWeight: 560,
            letterSpacing: '-0.01em',
            color: 'var(--hp-ink)',
            margin: '14px 0 0',
            lineHeight: 1.15,
          }}
        >
          {heading.replace(gradPhrase, '').trim()}{' '}
          <span className="hp-grad hp-neon-stroke">{gradPhrase}</span>
        </h2>
        {subtext && (
          <p
            style={{
              fontFamily: 'var(--hp-font-body)',
              fontSize: 16,
              color: 'var(--hp-ink-muted)',
              marginTop: 14,
              lineHeight: 1.65,
            }}
          >
            {subtext}
          </p>
        )}
      </div>
    </RevealSection>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="hp" style={{ minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      {/* Font loader (Fraunces + JetBrains Mono) */}
      <HomepageFonts />

      {/* ── Sticky Nav (theme-aware via .hp-nav class) ──────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 16,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          marginBottom: -84,
          pointerEvents: 'none',
        }}
      >
        <nav
          style={{
            pointerEvents: 'auto',
            width: 'min(94%, 980px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 12px 12px 22px',
            borderRadius: 999,
            border: '1px solid var(--hp-border-strong)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
          className="hp-nav"
        >
          {/* Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              fontWeight: 600,
              fontSize: 17,
              color: 'var(--hp-ink)',
            }}
          >
            <Home size={19} strokeWidth={1.8} style={{ color: 'var(--hp-brand)' }} />
            <span className="font-brand">The ANTs</span>
          </div>

          {/* Nav links (desktop only) */}
          <div
            className="hp-nav-links"
            style={{
              display: 'flex',
              gap: 26,
              fontSize: 14,
              color: 'var(--hp-ink-muted)',
              fontWeight: 500,
            }}
          >
            <style>{`
              .hp-nav-links { display: flex; align-items: center; }
              @media (max-width: 820px) { .hp-nav-links { display: none !important; } }

              /* ── Nav link fill-on-hover effect ── */
              .hp-nav-item {
                position: relative;
                display: inline-block;
                cursor: pointer;
                text-decoration: none;
                font-family: var(--hp-font-body);
                font-size: 14px;
                font-weight: 500;
                color: var(--hp-ink-muted);
                padding: 6px 2px;
                transition: color 0.3s ease;
              }

              .hp-nav-linktext {
                position: relative;
                z-index: 2;
                transition: color 0.3s ease;
              }

              .hp-nav-linktext::before {
                display: inline-block;
                content: attr(data-text);
                position: absolute;
                top: 0;
                left: 0;
                overflow: hidden;
                max-width: 0%;
                white-space: nowrap;
                color: var(--hp-brand);
                transition: max-width 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              }

              .hp-nav-item:hover .hp-nav-linktext {
                color: transparent;
              }

              .hp-nav-item:hover .hp-nav-linktext::before {
                max-width: 100%;
              }
            `}</style>
            <a className="hp-nav-item" href="#explore">
              <span className="hp-nav-linktext" data-text="Explore">Explore</span>
            </a>
            <a className="hp-nav-item" href="#features">
              <span className="hp-nav-linktext" data-text="Features">Features</span>
            </a>
            <a className="hp-nav-item" href="#qualifications">
              <span className="hp-nav-linktext" data-text="Boards">Boards</span>
            </a>
            <a className="hp-nav-item" href="#roles">
              <span className="hp-nav-linktext" data-text="Roles">Roles</span>
            </a>
          </div>

          {/* CTA area */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Theme toggle — keeps existing app behaviour */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: '1px solid var(--hp-border-strong)',
                borderRadius: 999,
                padding: '8px 10px',
                color: 'var(--hp-ink-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {isAuthenticated && user ? (
              <Link href={getRoleLandingPath(user.profile.role)}>
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--hp-brand)',
                    color: 'var(--hp-btn-text)',
                    border: 'none',
                    borderRadius: 999,
                    padding: '9px 18px',
                    fontFamily: 'var(--hp-font-body)',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'transform .18s ease, box-shadow .18s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px -10px rgba(var(--hp-brand-rgb), 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                >
                  Dashboard <ArrowRight size={14} />
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--hp-border-strong)',
                      borderRadius: 999,
                      padding: '9px 18px',
                      color: 'var(--hp-ink)',
                      fontFamily: 'var(--hp-font-body)',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'background .18s ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--hp-surface)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    Sign In
                  </button>
                </Link>
                <Link href="/signup">
                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'var(--hp-brand)',
                      color: 'var(--hp-btn-text)',
                      border: 'none',
                      borderRadius: 999,
                      padding: '9px 18px',
                      fontFamily: 'var(--hp-font-body)',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'transform .18s ease, box-shadow .18s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px -10px rgba(var(--hp-brand-rgb), 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                  >
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        className="hp-grid-bg"
        style={{
          paddingTop: 190,
          paddingBottom: 120,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <AntTrailPattern variant="mixed" opacity={0.05} />
        <AntHeroAccent />

        {/* ── Neon accent elements (CSS-rendered, instant load) ──── */}
        <style>{`
          .neon-accent {
            position: absolute;
            pointer-events: none;
            z-index: 0;
            border-radius: 50%;
            filter: blur(60px);
            opacity: 0.22;
            transition: opacity 0.5s ease, filter 0.5s ease;
          }
          /* Gold neon — left side: warm amber glow */
          .neon-accent-gold {
            width: clamp(200px, 22vw, 360px);
            height: clamp(200px, 22vw, 360px);
            left: -4%;
            top: 45%;
            transform: translateY(-50%);
            background: radial-gradient(
              circle at 50% 50%,
              rgba(208, 105, 43, 0.55) 0%,
              rgba(255, 180, 70, 0.25) 30%,
              rgba(208, 105, 43, 0.08) 60%,
              transparent 100%
            );
            box-shadow:
              0 0 60px rgba(208, 105, 43, 0.25),
              0 0 120px rgba(255, 160, 40, 0.12);
            animation: neonPulseGold 4s ease-in-out infinite;
          }
          /* Blue neon — right side: cool cyan glow */
          .neon-accent-blue {
            width: clamp(200px, 22vw, 360px);
            height: clamp(200px, 22vw, 360px);
            right: -4%;
            top: 40%;
            transform: translateY(-50%);
            background: radial-gradient(
              circle at 50% 50%,
              rgba(91, 158, 255, 0.55) 0%,
              rgba(91, 158, 255, 0.25) 30%,
              rgba(0, 200, 255, 0.08) 60%,
              transparent 100%
            );
            box-shadow:
              0 0 60px rgba(91, 158, 255, 0.25),
              0 0 120px rgba(0, 180, 255, 0.12);
            animation: neonPulseBlue 4.5s ease-in-out infinite;
          }
          /* Dark mode: stronger glow */
          [data-theme="dark"] .neon-accent {
            opacity: 0.32;
          }
          [data-theme="dark"] .neon-accent-gold {
            box-shadow:
              0 0 80px rgba(255, 140, 40, 0.35),
              0 0 160px rgba(255, 160, 40, 0.15);
          }
          [data-theme="dark"] .neon-accent-blue {
            box-shadow:
              0 0 80px rgba(91, 158, 255, 0.35),
              0 0 160px rgba(0, 180, 255, 0.15);
          }
          /* Keyframes: subtle breathing glow */
          @keyframes neonPulseGold {
            0%, 100% { opacity: 0.22; transform: translateY(-50%) scale(1); }
            50%      { opacity: 0.30; transform: translateY(-50%) scale(1.06); }
          }
          @keyframes neonPulseBlue {
            0%, 100% { opacity: 0.22; transform: translateY(-50%) scale(1); }
            50%      { opacity: 0.30; transform: translateY(-50%) scale(1.05); }
          }
          [data-theme="dark"] .neon-accent-gold {
            animation-name: neonPulseGoldDark;
          }
          [data-theme="dark"] .neon-accent-blue {
            animation-name: neonPulseBlueDark;
          }
          @keyframes neonPulseGoldDark {
            0%, 100% { opacity: 0.32; transform: translateY(-50%) scale(1); }
            50%      { opacity: 0.42; transform: translateY(-50%) scale(1.08); }
          }
          @keyframes neonPulseBlueDark {
            0%, 100% { opacity: 0.32; transform: translateY(-50%) scale(1); }
            50%      { opacity: 0.42; transform: translateY(-50%) scale(1.07); }
          }
          /* Responsive: smaller on tablet, hidden on mobile */
          @media (max-width: 900px) {
            .neon-accent-gold,
            .neon-accent-blue {
              width: clamp(140px, 16vw, 220px);
              height: clamp(140px, 16vw, 220px);
              opacity: 0.14;
            }
            [data-theme="dark"] .neon-accent {
              opacity: 0.20;
            }
          }
          @media (max-width: 640px) {
            .neon-accent { display: none; }
          }
          @media (prefers-reduced-motion: reduce) {
            .neon-accent-gold,
            .neon-accent-blue { animation: none; }
          }
        `}</style>

        {/* Gold neon — left side */}
        <div className="neon-accent neon-accent-gold" aria-hidden="true" />

        {/* Blue neon — right side */}
        <div className="neon-accent neon-accent-blue" aria-hidden="true" />

        <div
          style={{
            position: 'relative',
            maxWidth: 'var(--hp-maxw)',
            margin: '0 auto',
            padding: '0 28px',
          }}
        >
          {/* Hero content — all items cascade with Apple-like stagger */}
          <RevealSection stagger>
            <div className="hp-reveal">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 16px',
                  borderRadius: 999,
                  background: 'rgba(var(--hp-brand-rgb), 0.08)',
                  border: '1px solid rgba(var(--hp-brand-rgb), 0.25)',
                  fontFamily: 'var(--hp-font-mono)',
                  fontSize: 12.5,
                  color: 'var(--hp-brand)',
                  marginBottom: 28,
                }}
              >
                🐜 Built for Myanmar students
              </div>
            </div>

            <h1
              className="hp-reveal"
              style={{
                fontFamily: 'var(--hp-font-display)',
                fontSize: 'clamp(2.6rem, 5.6vw, 4.4rem)',
                fontWeight: 560,
                lineHeight: 1.06,
                letterSpacing: '-0.01em',
                maxWidth: 920,
                margin: '0 auto',
                color: 'var(--hp-ink)',
              }}
            >
              More than tutors. Your bridge to{' '}
              <span className="hp-grad hp-neon-stroke">global education.</span>
            </h1>

            {/* ── "Learn more about The ANTs" text link ────────────── */}
            <div
              className="hp-reveal"
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Link
                href="/about"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 32,
                  fontFamily: 'var(--hp-font-body)',
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--hp-ink)',
                  textDecoration: 'none',
                  borderBottom: '1.5px solid var(--hp-border)',
                  paddingBottom: 4,
                  transition: 'border-color 0.25s ease, color 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderBottomColor = 'var(--hp-brand)';
                  e.currentTarget.style.color = 'var(--hp-brand)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderBottomColor = 'var(--hp-border)';
                  e.currentTarget.style.color = 'var(--hp-ink)';
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--hp-brand)',
                    display: 'inline-block',
                    boxShadow: '0 0 5px var(--hp-brand)',
                    flexShrink: 0,
                  }}
                />
                Discover what <span className="font-brand hp-neon-stroke">The ANTs</span> is all about
                <ArrowRight size={15} style={{ flexShrink: 0, marginLeft: 2 }} />
              </Link>
            </div>

            <div
              className="hp-reveal"
              style={{
                display: 'flex',
                gap: 14,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 40,
                flexWrap: 'wrap',
              }}
            >
              <Link href="/signup">
                <button
                  className="hp-btn neon-btn-glow hp-btn-elevated"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--hp-brand)',
                    color: 'var(--hp-btn-text)',
                    border: 'none',
                    borderRadius: 999,
                    padding: '13px 26px',
                    fontFamily: 'var(--hp-font-body)',
                    fontWeight: 700,
                    fontSize: 14.5,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.transform = 'translateY(0)';
                  }}
                >
                  Get Started — It's Free →
                </button>
              </Link>
              <Link
                href="/login"
                style={{
                  fontFamily: 'var(--hp-font-body)',
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: 'var(--hp-ink-muted)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--hp-ink)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--hp-ink-muted)'; }}
              >
                Sign In
              </Link>
            </div>

            <div
              className="hp-reveal"
              style={{
                marginTop: 22,
                fontFamily: 'var(--hp-font-mono)',
                fontSize: 12,
                color: 'var(--hp-ink-faint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--hp-amber)',
                  display: 'inline-block',
                }}
              />
              No credit card · used by students across Yangon, Mandalay & beyond
            </div>
          </RevealSection>

          {/* Hero visual widget */}
          <HeroVisual />
        </div>
      </section>

      {/* ── Explore Section ──────────────────────────────────────────────── */}
      <section
        id="explore"
        className="hp-grid-card"
        style={{
          padding: '130px 28px',
          background: 'var(--hp-bg-soft)',
          position: 'relative',
        }}
      >
        <AntTrailPattern variant="brand" opacity={0.06} />
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          <SectionHead
            eyebrow="Discover"
            heading="Explore clubs & profiles"
            gradPhrase="clubs & profiles"
          />

          <RevealSection>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
              }}
              className="explore-grid-hp"
            >
              <style>{`
                @media (max-width: 760px) { .explore-grid-hp { grid-template-columns: 1fr !important; } }
                .explore-card-hp:hover { border-color: var(--hp-border-strong) !important; transform: translateY(-3px) !important; }
              `}</style>

              {EXPLORE_CARDS.map((card, i) => (
                <Link key={card.title} href={card.href} style={{ display: 'block' }}>
                  <div
                    className="explore-card-hp hp-card-elevated hp-reveal"
                    style={{
                      '--hp-delay': `${i * 120}ms`,
                      padding: 32,
                      borderRadius: 'var(--hp-radius-lg)',
                      background: 'var(--hp-surface)',
                      border: '1px solid var(--hp-border)',
                      transition: 'border-color .2s ease, transform .2s ease',
                      height: '100%',
                    } as React.CSSProperties}
                  >
                    {/* Icon */}
                    <div
                      className="hp-icon-elevated"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 13,
                        background: card.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                      }}
                    >
                      <card.Icon size={22} style={{ color: card.iconColor }} strokeWidth={1.7} />
                    </div>

                    <h3
                      style={{
                        fontFamily: 'var(--hp-font-display)',
                        fontSize: 20,
                        fontWeight: 600,
                        color: 'var(--hp-ink)',
                        margin: '0 0 10px',
                      }}
                    >
                      {card.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: 'var(--hp-font-body)',
                        fontSize: 14.5,
                        color: 'var(--hp-ink-muted)',
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {card.description}
                    </p>

                    {/* Stat chips */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 22,
                        marginTop: 22,
                        paddingTop: 22,
                        borderTop: '1px solid var(--hp-border)',
                      }}
                    >
                      {card.stats.map((stat) => (
                        <div key={stat.label}>
                          <b
                            style={{
                              display: 'block',
                              fontFamily: 'var(--hp-font-mono)',
                              color: 'var(--hp-ink)',
                              fontSize: 17,
                            }}
                          >
                            {stat.value}
                          </b>
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--hp-ink-faint)',
                              fontFamily: 'var(--hp-font-mono)',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {stat.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Stats Row (high-impact metrics divider) ──────────────────────── */}
      <section style={{ position: 'relative' }}>
        <AntTrailPattern variant="brand" opacity={0.04} />
        <StatsRow />
      </section>

      {/* ── Features Section ─────────────────────────────────────────────── */}
      <section
        id="features"
        className="hp-grid-bg-strong"
        style={{ padding: '130px 28px', position: 'relative' }}
      >
        <AntTrailPattern variant="mixed" opacity={0.06} />
        {/* Ant brand accent — small, subtle floating silhouette */}
        <svg
          className="hp-ant-float"
          width="32"
          height="26"
          viewBox="0 0 32 26"
          style={{ top: '12%', right: '4%', animationDelay: '1.5s' }}
          aria-hidden="true"
        >
          <line x1="20" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
          <line x1="20" y1="9" x2="25" y2="15" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
          <line x1="15" y1="8" x2="10" y2="14" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
          <line x1="15" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
          <line x1="10" y1="6" x2="5" y2="12" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
          <line x1="10" y1="6" x2="15" y2="12" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
          <path d="M3 5 Q1 1 0 0" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.6" />
          <path d="M3 5 Q3 0 4 -2" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.6" />
          <ellipse cx="4" cy="6" rx="2.5" ry="2" fill="currentColor" opacity="0.85" />
          <ellipse cx="9" cy="7" rx="2.2" ry="1.8" fill="currentColor" opacity="0.75" />
          <ellipse cx="14" cy="8" rx="3.2" ry="2.3" fill="currentColor" opacity="0.7" />
          <ellipse cx="18" cy="9" rx="1.5" ry="1.3" fill="currentColor" opacity="0.5" />
        </svg>
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          <SectionHead
            eyebrow="F E A T U R E S"
            heading="Everything you need to ace your exams"
            gradPhrase="ace your exams"
          />
          <BentoFeatures />
        </div>
      </section>

      {/* ── Qualifications Section ───────────────────────────────────────── */}
      <section
        id="qualifications"
        className="hp-grid-card"
        style={{
          padding: '130px 28px',
          background: 'var(--hp-bg-soft)',
          position: 'relative',
        }}
      >
        <AntTrailPattern variant="brand" opacity={0.06} />
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          <SectionHead
            eyebrow="Q U A L I F I C A T I O N S"
            heading="Wired into your exam board"
            gradPhrase="exam board"
          />
          {/* Interactive carousel replaces the static QualTrail on desktop */}
          <div className="hp-quals-carousel">
            <QualCarousel />
          </div>
          {/* Keep QualTrail as a static fallback on mobile (hidden when carousel shows) */}
          <div className="hp-quals-trail-fallback">
            <QualTrail />
          </div>
          <style>{`
            @media (min-width: 641px) {
              .hp-quals-trail-fallback { display: none !important; }
            }
            @media (max-width: 640px) {
              .hp-quals-carousel { display: none !important; }
            }
          `}</style>
        </div>
      </section>

      {/* ── Roles Section ────────────────────────────────────────────────── */}
      <section
        id="roles"
        className="hp-grid-bg"
        style={{ padding: '130px 28px', position: 'relative' }}
      >
        <AntTrailPattern variant="violet" opacity={0.05} />
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          <SectionHead
            eyebrow="F O R   E V E R Y O N E"
            heading="Choose your role"
            gradPhrase="role"
          />
          <RoleLadder />
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 28px 130px', position: 'relative' }}>
        <AntTrailPattern variant="mixed" opacity={0.08} />
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          <RevealSection>
            <div
              className="hp-grid-accent"
              style={{
                borderRadius: 'var(--hp-radius-lg)',
                background: 'var(--hp-brand-deep)',
                padding: '70px 40px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid var(--hp-border-strong)',
              }}
            >
              {/* Glow blobs */}
              <div aria-hidden="true">
                <div
                  style={{
                    position: 'absolute', top: 0, right: 0,
                    width: 180, height: 180,
                    background: 'rgba(255,255,255,0.10)', borderRadius: '50%', filter: 'blur(40px)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute', bottom: 0, left: 0,
                    width: 140, height: 140,
                    background: 'rgba(255,255,255,0.08)', borderRadius: '50%', filter: 'blur(40px)',
                  }}
                />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2
                  style={{
                    fontFamily: 'var(--hp-font-display)',
                    fontSize: 'clamp(1.8rem, 3.6vw, 2.6rem)',
                    fontWeight: 560,
                    color: 'var(--hp-btn-text)',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Ready to{' '}
                  <span className="hp-neon-stroke" style={{ color: 'var(--hp-btn-text)' }}>
                    ace your exams
                  </span>
                  ?
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--hp-font-body)',
                    color: 'var(--hp-cta-text-muted)',
                    maxWidth: 480,
                    margin: '14px auto 0',
                    fontSize: 16,
                    lineHeight: 1.6,
                  }}
                >
                  Join thousands of Myanmar students already using{' '}
                  <span className="font-brand hp-neon-stroke">
                    The ANTs
                  </span>{' '}
                  to study smarter.
                </p>
                <Link href="/signup">
                  <button
                    className="hp-btn-elevated"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 30,
                      background: 'var(--hp-btn-text)',
                      color: 'var(--hp-brand-deep)',
                      border: '1px solid var(--hp-border-strong)',
                      borderRadius: 999,
                      padding: '13px 26px',
                      fontFamily: 'var(--hp-font-body)',
                      fontWeight: 600,
                      fontSize: 14.5,
                      cursor: 'pointer',
                      transition: 'transform .18s ease, box-shadow .18s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    }}
                  >
                    Get Started — It's Free →
                  </button>
                </Link>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative' }}>
        <AntTrailPattern variant="brand" opacity={0.06} />
        <Footer />
      </section>
    </div>
  );
}