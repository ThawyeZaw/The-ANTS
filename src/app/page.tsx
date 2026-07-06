'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Public Home / Landing Page (redesigned)
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
import DotGrid from '@/components/homepage/DotGrid';

// ── Explore card data ─────────────────────────────────────────────────────────

const EXPLORE_CARDS = [
  {
    title: 'Explore Clubs',
    description:
      'Discover community spaces for subjects, CCAs and projects. Browse clubs and see what members are building.',
    Icon: MessageSquare,
    href: '/explore/clubs',
    iconBg: 'rgba(60,219,167,0.12)',
    iconColor: 'var(--hp-brand)',
    stats: [
      { value: '120+', label: 'ACTIVE CLUBS' },
      { value: 'Open', label: 'JOIN MODES VARY' },
    ],
  },
  {
    title: 'Explore Profiles',
    description:
      'Browse student portfolios, projects, CCA activities and verified educators & contributors. View achievements and credentials.',
    Icon: Users,
    href: '/explore/profiles',
    iconBg: 'rgba(140,127,240,0.14)',
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
  subtext: string;
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
          <span className="hp-grad">{gradPhrase}</span>
        </h2>
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
            The ANTS
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
              .hp-nav-links a:hover { color: var(--hp-ink); }
            `}</style>
            <a href="#explore">Explore</a>
            <a href="#features">Features</a>
            <a href="#qualifications">Boards</a>
            <a href="#roles">Roles</a>
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
                    color: '#06110D',
                    border: 'none',
                    borderRadius: 999,
                    padding: '9px 18px',
                    fontFamily: 'var(--hp-font-body)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'transform .18s ease, box-shadow .18s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px -10px rgba(60,219,167,0.55)';
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
                      color: '#06110D',
                      border: 'none',
                      borderRadius: 999,
                      padding: '9px 18px',
                      fontFamily: 'var(--hp-font-body)',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'transform .18s ease, box-shadow .18s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px -10px rgba(60,219,167,0.55)';
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
        style={{
          paddingTop: 190,
          paddingBottom: 120,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Ambient glow blobs */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '20%',
              width: 480,
              height: 480,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(60,219,167,0.07) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '15%',
              width: 380,
              height: 380,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(140,127,240,0.06) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
        </div>

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
                  background: 'rgba(60,219,167,0.09)',
                  border: '1px solid rgba(60,219,167,0.28)',
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
              <span className="hp-grad">global education.</span>
            </h1>

            <p
              className="hp-reveal"
              style={{
                fontFamily: 'var(--hp-font-body)',
                maxWidth: 620,
                margin: '26px auto 0',
                fontSize: 17,
                lineHeight: 1.65,
                color: 'var(--hp-ink-muted)',
              }}
            >
              A dynamic, student-led ecosystem of mentors from A-Levels, Polytechnics, Foundation
              programs, OSSD and top UK universities — helping IGCSE students achieve absolute
              academic excellence and navigate their future.
            </p>

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
                  gap: 6,
                  marginTop: 22,
                  fontFamily: 'var(--hp-font-body)',
                  fontSize: 13,
                  color: 'var(--hp-ink-faint)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--hp-ink-muted)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--hp-ink-faint)'; }}
              >
                Learn more about The ANTS
                <ArrowRight size={13} />
              </Link>
            </div>

            <div
              className="hp-reveal"
              style={{
                display: 'flex',
                gap: 14,
                justifyContent: 'center',
                marginTop: 40,
                flexWrap: 'wrap',
              }}
            >
              <Link href="/signup">
                <button
                  className="hp-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--hp-brand)',
                    color: '#06110D',
                    border: 'none',
                    borderRadius: 999,
                    padding: '13px 24px',
                    fontFamily: 'var(--hp-font-body)',
                    fontWeight: 600,
                    fontSize: 14.5,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px -10px rgba(60,219,167,0.55)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                >
                  Get Started — It's Free →
                </button>
              </Link>
              <Link href="/login">
                <button
                  className="hp-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'transparent',
                    border: '1px solid var(--hp-border-strong)',
                    borderRadius: 999,
                    padding: '13px 24px',
                    color: 'var(--hp-ink)',
                    fontFamily: 'var(--hp-font-body)',
                    fontWeight: 600,
                    fontSize: 14.5,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.background = 'var(--hp-surface)';
                    el.style.borderColor = 'var(--hp-ink-faint)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.background = 'transparent';
                    el.style.borderColor = 'var(--hp-border-strong)';
                  }}
                >
                  Sign In
                </button>
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
        style={{
          padding: '130px 28px',
          background: 'var(--hp-bg-soft)',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          <SectionHead
            eyebrow="Discover"
            heading="Explore clubs & profiles"
            gradPhrase="clubs & profiles"
            subtext="Browse community clubs, view student portfolios and discover verified educators — no login required."
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

              {EXPLORE_CARDS.map((card) => (
                <Link key={card.title} href={card.href} style={{ display: 'block' }}>
                  <div
                    className="explore-card-hp"
                    style={{
                      padding: 32,
                      borderRadius: 'var(--hp-radius-lg)',
                      background: 'var(--hp-surface)',
                      border: '1px solid var(--hp-border)',
                      transition: 'border-color .2s ease, transform .2s ease',
                      height: '100%',
                    }}
                  >
                    {/* Icon */}
                    <div
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
        <StatsRow />
      </section>

      {/* ── Features Section ─────────────────────────────────────────────── */}
      <DotGrid>
        <section
          id="features"
          style={{ padding: '130px 28px', position: 'relative' }}
        >
          <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
            <SectionHead
              eyebrow="F E A T U R E S"
              heading="Everything you need to ace your exams"
              gradPhrase="ace your exams"
              subtext="A complete toolkit designed specifically for students pursuing international qualifications."
            />
            <BentoFeatures />
          </div>
        </section>
      </DotGrid>

      {/* ── Qualifications Section ───────────────────────────────────────── */}
      <DotGrid>
        <section
          id="qualifications"
          style={{
            padding: '130px 28px',
            background: 'var(--hp-bg-soft)',
            position: 'relative',
          }}
        >
          <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
            <SectionHead
              eyebrow="Q U A L I F I C A T I O N S"
              heading="Wired into your exam board"
              gradPhrase="exam board"
              subtext="Our tools understand the difference between CAIE IGCSE and Edexcel IAL — so your grades are always accurate."
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
      </DotGrid>

      {/* ── Roles Section ────────────────────────────────────────────────── */}
      <DotGrid>
        <section
          id="roles"
          style={{ padding: '130px 28px', position: 'relative' }}
        >
          <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
            <SectionHead
              eyebrow="F O R   E V E R Y O N E"
              heading="Choose your role"
              gradPhrase="role"
              subtext="The ANTS adapts to who you are — student, teacher, content creator, or quality gatekeeper."
            />
            <RoleLadder />
          </div>
        </section>
      </DotGrid>

      {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 28px 130px', position: 'relative' }}>
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          <RevealSection>
            <div
              style={{
                borderRadius: 'var(--hp-radius-lg)',
                background: 'linear-gradient(120deg, var(--hp-brand-deep), var(--hp-brand) 55%, var(--hp-amber) 130%)',
                padding: '70px 40px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Glow blobs */}
              <div aria-hidden="true">
                <div
                  style={{
                    position: 'absolute', top: 0, right: 0,
                    width: 180, height: 180,
                    background: 'rgba(255,255,255,0.12)', borderRadius: '50%', filter: 'blur(30px)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute', bottom: 0, left: 0,
                    width: 140, height: 140,
                    background: 'rgba(255,255,255,0.10)', borderRadius: '50%', filter: 'blur(30px)',
                  }}
                />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2
                  style={{
                    fontFamily: 'var(--hp-font-display)',
                    fontSize: 'clamp(1.8rem, 3.6vw, 2.6rem)',
                    fontWeight: 560,
                    color: '#FFFFFF',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Ready to ace your exams?
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--hp-font-body)',
                    color: 'rgba(255,255,255,0.80)',
                    maxWidth: 480,
                    margin: '14px auto 0',
                    fontSize: 16,
                    lineHeight: 1.6,
                  }}
                >
                  Join thousands of Myanmar students already using The ANTS to study smarter.
                </p>
                <Link href="/signup">
                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 30,
                      background: '#FFFFFF',
                      color: '#0F172A',
                      border: 'none',
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
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px -10px rgba(255,255,255,0.35)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
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
      <DotGrid>
        <footer
          style={{
            borderTop: '1px solid var(--hp-border)',
            padding: '56px 28px 40px',
            background: 'var(--hp-bg-soft)',
          }}
        >
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          {/* Top row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            {/* Brand */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--hp-font-display)',
                fontWeight: 600,
                fontSize: 15,
                color: 'var(--hp-ink)',
              }}
            >
              🐜 The ANTS
            </div>

            {/* Nav links */}
            <div
              style={{
                display: 'flex',
                gap: 22,
                fontSize: 13.5,
                color: 'var(--hp-ink-muted)',
                flexWrap: 'wrap',
              }}
              className="hp-foot-links"
            >
              <style>{`
                .hp-foot-links a:hover { color: var(--hp-ink); }
              `}</style>
              <a href="#explore">Explore</a>
              <a href="#features">Features</a>
              <Link href="/explore/clubs">Clubs</Link>
              <Link href="/explore/profiles">Profiles</Link>
              <Link href="/about">About</Link>
              <Link href="/login">Sign In</Link>
              <Link href="/signup">Sign Up</Link>
            </div>

            {/* Credit */}
            <p
              style={{
                fontFamily: 'var(--hp-font-body)',
                fontSize: 12.5,
                color: 'var(--hp-ink-faint)',
                margin: 0,
              }}
            >
              Built with ❤️ for Myanmar students
            </p>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              marginTop: 30,
              paddingTop: 24,
              borderTop: '1px solid var(--hp-border)',
              textAlign: 'center',
              fontFamily: 'var(--hp-font-mono)',
              fontSize: 12,
              color: 'var(--hp-ink-faint)',
            }}
          >
            <span suppressHydrationWarning>
              © {new Date().getFullYear()} The ANTS. Ace with us! 🐜
            </span>
          </div>
        </div>
        </footer>
      </DotGrid>
    </div>
  );
}