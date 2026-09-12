'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Public Home / Landing Page
// Layout & copy aligned to the Stitch / Netlify hero-feed redesign.
// Sections: Hero → Stats → Toolkit → Boards → Mentors → Roles → CTA.
// Clubs / classrooms omitted (retired). Scoped under .hp tokens.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Eye, Home, Rocket, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLandingPath } from '@/lib/utils';
import HeroVisual from '@/components/homepage/HeroVisual';
import BentoFeatures from '@/components/homepage/BentoFeatures';
import QualBoards from '@/components/homepage/QualBoards';
import MentorPreview from '@/components/homepage/MentorPreview';
import RoleLadder from '@/components/homepage/RoleLadder';
import RevealSection from '@/components/homepage/RevealSection';
import AntHeroAccent from '@/components/homepage/AntHeroAccent';
import Footer from '@/components/layout/Footer';
import ThemeToggle from '@/components/ui/ThemeToggle';

// ── Shared section heading ────────────────────────────────────────────────────

function SectionHead({
  eyebrow,
  heading,
  gradPhrase,
  subtext,
  align = 'center',
  action,
}: {
  eyebrow: string;
  heading: string;
  gradPhrase?: string;
  subtext?: string;
  align?: 'center' | 'left';
  action?: ReactNode;
}) {
  const textAlign = align === 'center' ? 'center' : 'left';
  const mx = align === 'center' ? 'auto' : '0';
  const phrase = gradPhrase ?? '';
  const rest = phrase ? heading.replace(phrase, '').trim() : heading;

  return (
    <RevealSection>
      <div
        style={{
          maxWidth: action ? '100%' : 680,
          margin: `0 ${mx} 48px`,
          textAlign,
          display: action ? 'flex' : 'block',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <div style={{ maxWidth: 640, textAlign, margin: align === 'center' && !action ? '0 auto' : 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '5px 12px',
              borderRadius: 999,
              background: 'color-mix(in srgb, var(--hp-brand) 12%, transparent)',
              color: 'var(--hp-brand-deep)',
              fontFamily: 'var(--hp-font-mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </span>
          <h2
            style={{
              fontFamily: 'var(--hp-font-display)',
              fontSize: 'clamp(1.85rem, 3.4vw, 2.55rem)',
              fontWeight: 560,
              letterSpacing: '-0.01em',
              color: 'var(--hp-ink)',
              margin: '14px 0 0',
              lineHeight: 1.15,
            }}
          >
            {rest}
            {phrase ? (
              <>
                {' '}
                <span className="hp-grad hp-neon-stroke">{phrase}</span>
              </>
            ) : null}
          </h2>
          {subtext && (
            <p
              style={{
                fontFamily: 'var(--hp-font-body)',
                fontSize: 15.5,
                color: 'var(--hp-ink-muted)',
                marginTop: 12,
                lineHeight: 1.65,
              }}
            >
              {subtext}
            </p>
          )}
        </div>
        {action}
      </div>
    </RevealSection>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  // Auth seeds from localStorage on the client only — gate until mount to match SSR HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="hp" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* ── Fixed Nav (theme-aware via .hp-nav class) ──────────────────── */}
      <header
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(94%, 980px)',
          zIndex: 50,
        }}
      >
        <nav
          style={{
            width: '100%',
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
            <a
              className="hp-nav-item"
              href="#explore"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="hp-nav-linktext" data-text="Explore">Explore</span>
            </a>
            <a
              className="hp-nav-item"
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="hp-nav-linktext" data-text="Features">Features</span>
            </a>
            <a
              className="hp-nav-item"
              href="#qualifications"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('qualifications')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="hp-nav-linktext" data-text="Boards & Syllabi">Boards & Syllabi</span>
            </a>
            <a
              className="hp-nav-item"
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="hp-nav-linktext" data-text="Study Tools">Study Tools</span>
            </a>
          </div>


          {mounted && isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <ThemeToggle onHomepage className="rounded-full" />
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
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <ThemeToggle onHomepage className="rounded-full" />
              <Link href="/login">
                <button
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--hp-border-strong)',
                    borderRadius: 999,
                    padding: '8px 16px',
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
                    padding: '8px 18px',
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
                  Get Started — It&apos;s Free
                </button>
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        className="hp-grid-bg"
        style={{
          paddingTop: 160,
          paddingBottom: 120,
          position: 'relative',
        }}
      >
        <AntHeroAccent />

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
          .neon-accent-gold {
            width: clamp(200px, 22vw, 360px);
            height: clamp(200px, 22vw, 360px);
            left: -4%;
            top: 45%;
            transform: translateY(-50%);
            background: radial-gradient(
              circle at 50% 50%,
              color-mix(in srgb, var(--primary) 45%, transparent) 0%,
              color-mix(in srgb, var(--accent) 22%, transparent) 30%,
              color-mix(in srgb, var(--primary) 6%, transparent) 60%,
              transparent 100%
            );
            box-shadow:
              0 0 60px color-mix(in srgb, var(--primary) 20%, transparent),
              0 0 120px color-mix(in srgb, var(--accent) 10%, transparent);
            animation: neonPulseGold 4s ease-in-out infinite;
          }
          .neon-accent-amber {
            width: clamp(200px, 22vw, 360px);
            height: clamp(200px, 22vw, 360px);
            right: -4%;
            top: 40%;
            transform: translateY(-50%);
            background: radial-gradient(
              circle at 50% 50%,
              color-mix(in srgb, var(--accent) 40%, transparent) 0%,
              color-mix(in srgb, var(--primary) 20%, transparent) 30%,
              color-mix(in srgb, var(--accent) 5%, transparent) 60%,
              transparent 100%
            );
            box-shadow:
              0 0 60px color-mix(in srgb, var(--accent) 18%, transparent),
              0 0 120px color-mix(in srgb, var(--primary) 8%, transparent);
            animation: neonPulseAmber 4.5s ease-in-out infinite;
          }
          @keyframes neonPulseGold {
            0%, 100% { opacity: 0.20; transform: translateY(-50%) scale(1); }
            50%      { opacity: 0.28; transform: translateY(-50%) scale(1.06); }
          }
          @keyframes neonPulseAmber {
            0%, 100% { opacity: 0.18; transform: translateY(-50%) scale(1); }
            50%      { opacity: 0.26; transform: translateY(-50%) scale(1.05); }
          }
          .hp-hero-grid {
            display: grid;
            grid-template-columns: 1.15fr 0.95fr;
            gap: clamp(36px, 5vw, 64px);
            align-items: center;
          }
          @media (max-width: 960px) {
            .hp-hero-grid { grid-template-columns: 1fr; }
            .hp-hero-copy { text-align: center; align-items: center; }
            .hp-hero-copy .hp-hero-trust { justify-content: center; }
            .hp-hero-copy .hp-hero-ctas { justify-content: center; }
            .hp-hero-copy .hp-hero-pill { margin-left: auto; margin-right: auto; }
            .hp-hero-copy .hp-hero-sub { margin-left: auto; margin-right: auto; }
            .neon-accent-gold,
            .neon-accent-amber {
              width: clamp(140px, 16vw, 220px);
              height: clamp(140px, 16vw, 220px);
              opacity: 0.14;
            }
          }
          @media (max-width: 640px) {
            .neon-accent { display: none; }
          }
          @media (prefers-reduced-motion: reduce) {
            .neon-accent-gold,
            .neon-accent-amber { animation: none; }
          }
        `}</style>

        <div className="neon-accent neon-accent-gold" aria-hidden="true" />
        <div className="neon-accent neon-accent-amber" aria-hidden="true" />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 'var(--hp-maxw)',
            margin: '0 auto',
            padding: '0 28px',
          }}
        >
          <div className="hp-hero-grid">
            {/* Left — copy */}
            <div
              className="hp-hero-copy"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <RevealSection stagger className="w-full">
                <div className="hp-reveal hp-hero-pill">
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 14px',
                      borderRadius: 999,
                      background: 'var(--hp-surface)',
                      border: '1px solid var(--hp-border)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      fontFamily: 'var(--hp-font-body)',
                      fontSize: 13,
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        position: 'relative',
                        width: 8,
                        height: 8,
                        flexShrink: 0,
                      }}
                      aria-hidden
                    >
                      <span
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          background: 'var(--hp-brand)',
                          opacity: 0.45,
                          animation: 'neonPulseGold 2s ease-in-out infinite',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          inset: 1,
                          borderRadius: '50%',
                          background: 'var(--hp-brand)',
                        }}
                      />
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--hp-ink)' }}>
                      Built by students, for students
                    </span>
                    <span style={{ color: 'var(--hp-ink-faint)' }}>·</span>
                    <span style={{ fontWeight: 700, color: 'var(--hp-brand)' }}>
                      Yangon, Mandalay & worldwide
                    </span>
                  </div>
                </div>

                <h1
                  className="hp-reveal"
                  style={{
                    fontFamily: 'var(--hp-font-display)',
                    fontSize: 'clamp(2.4rem, 5vw, 3.85rem)',
                    fontWeight: 560,
                    lineHeight: 1.08,
                    letterSpacing: '-0.01em',
                    maxWidth: 640,
                    margin: '22px 0 0',
                    color: 'var(--hp-ink)',
                  }}
                >
                  Ace your exams.
                  <br />
                  <span className="hp-grad hp-neon-stroke">No stress, just vibes</span>
                  {' '}& top grades.
                </h1>

                <p
                  className="hp-reveal hp-hero-sub"
                  style={{
                    margin: '18px 0 0',
                    maxWidth: 520,
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 'clamp(15px, 1.6vw, 17px)',
                    lineHeight: 1.65,
                    color: 'var(--hp-ink-muted)',
                  }}
                >
                  More than just tutors —{' '}
                  <span className="font-brand" style={{ color: 'var(--hp-ink)', fontWeight: 700 }}>
                    The ANTs
                  </span>{' '}
                  is your all-in-one cheat code to conquer Cambridge CAIE, Pearson Edexcel, and ace
                  international boards. Free forever, no credit card required.
                </p>

                <div
                  className="hp-reveal hp-hero-ctas"
                  style={{
                    display: 'flex',
                    gap: 12,
                    marginTop: 28,
                    flexWrap: 'wrap',
                    width: '100%',
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
                        borderRadius: 14,
                        padding: '13px 22px',
                        fontFamily: 'var(--hp-font-body)',
                        fontWeight: 700,
                        fontSize: 14.5,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                      }}
                    >
                      Start Grinding for Free
                      <Rocket size={16} strokeWidth={2.2} />
                    </button>
                  </Link>
                  <a
                    href="#features"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '13px 22px',
                      borderRadius: 14,
                      background: 'var(--hp-surface)',
                      border: '1px solid var(--hp-border)',
                      color: 'var(--hp-ink)',
                      fontFamily: 'var(--hp-font-body)',
                      fontWeight: 700,
                      fontSize: 14.5,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'transform 0.25s ease, border-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = 'var(--hp-border-strong)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'var(--hp-border)';
                    }}
                  >
                    Peep the Features
                    <Eye size={16} style={{ color: 'var(--hp-violet)' }} strokeWidth={2.2} />
                  </a>
                </div>

                <div
                  className="hp-reveal hp-hero-trust"
                  style={{
                    marginTop: 22,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '14px 20px',
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 13.5,
                    color: 'var(--hp-ink-muted)',
                  }}
                >
                  {['Zero Kyats setup', 'Verified exam syllabi', 'No credit card'].map((label) => (
                    <span
                      key={label}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <CheckCircle2
                        size={16}
                        style={{ color: 'var(--hp-brand)', flexShrink: 0 }}
                        fill="color-mix(in srgb, var(--hp-brand) 18%, transparent)"
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </RevealSection>
            </div>

            {/* Right — study workspace mockup */}
            <div style={{ paddingBottom: 28 }}>
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Toolkit / Features ───────────────────────────────── */}
      <section
        id="features"
        className="hp-grid-bg-strong"
        style={{ padding: '110px 28px', position: 'relative', scrollMarginTop: 90 }}
      >
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          <SectionHead
            eyebrow="Interactive Toolkit"
            heading="Everything built to crush syllabus anxiety"
            gradPhrase="syllabus anxiety"
            subtext="High-contrast dashboards, verified past paper solutions, and live collaboration suites tailored for Burmese students taking on global qualifications."
          />
          <BentoFeatures />
        </div>
      </section>

      {/* ── Qualifications ───────────────────────────────────────────────── */}
      <section
        id="qualifications"
        className="hp-grid-card"
        style={{
          padding: '110px 28px',
          background: 'var(--hp-bg-soft)',
          position: 'relative',
          scrollMarginTop: 90,
        }}
      >
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          <SectionHead
            align="left"
            eyebrow="Qualifications"
            heading="Wired directly to your official board"
            gradPhrase="official board"
            subtext="Every revision note, specimen mark scheme, and unit breakdown is mapped 1:1 against current international exam specifications."
          />
          <QualBoards />
        </div>
      </section>

      {/* ── Verified Mentors / Explore ───────────────────────────────────── */}
      <section
        id="explore"
        style={{ padding: '110px 28px', position: 'relative', scrollMarginTop: 90 }}
      >
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          <SectionHead
            align="left"
            eyebrow="Verified Mentors"
            heading="Learn from students who already aced it"
            gradPhrase="already aced it"
          />
          <MentorPreview />
        </div>
      </section>

      {/* ── Ecosystem Ladder ─────────────────────────────────────────────── */}
      <section
        id="roles"
        className="hp-grid-card"
        style={{
          padding: '110px 28px',
          background: 'var(--hp-bg-soft)',
          position: 'relative',
          scrollMarginTop: 90,
        }}
      >
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          <SectionHead
            eyebrow="Ecosystem Ladder"
            heading="From Study Rookie to Master Contributor"
            gradPhrase="Master Contributor"
            subtext="One unified platform, 4 distinct roles. Progress organically as you study, teach, and contribute back to the community."
          />
          <RoleLadder />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 28px 120px', position: 'relative' }}>
        <div style={{ maxWidth: 'var(--hp-maxw)', margin: '0 auto' }}>
          <RevealSection>
            <div
              className="hp-grid-accent"
              style={{
                borderRadius: 'var(--hp-radius-lg)',
                background: 'var(--hp-brand-deep)',
                padding: '64px 40px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid var(--hp-border-strong)',
              }}
            >
              <div aria-hidden="true">
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 180,
                    height: 180,
                    background: 'rgba(255,255,255,0.10)',
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: 140,
                    height: 140,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                  }}
                />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                    padding: '6px 14px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.14)',
                    color: 'var(--hp-btn-text)',
                    fontFamily: 'var(--hp-font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <Zap size={14} />
                  Myanmar International Student Alliance
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--hp-font-display)',
                    fontSize: 'clamp(1.8rem, 3.6vw, 2.6rem)',
                    fontWeight: 560,
                    color: 'var(--hp-btn-text)',
                    margin: 0,
                    letterSpacing: '-0.01em',
                    maxWidth: 640,
                    marginInline: 'auto',
                  }}
                >
                  Stop cramming the night before. Build your study streak today.
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--hp-font-body)',
                    color: 'var(--hp-cta-text-muted)',
                    maxWidth: 520,
                    margin: '14px auto 0',
                    fontSize: 16,
                    lineHeight: 1.6,
                  }}
                >
                  Join thousands of students across Yangon, Mandalay, Taunggyi and diaspora scholars
                  conquering their international exams without burning out.
                </p>
                <div
                  style={{
                    marginTop: 28,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    justifyContent: 'center',
                  }}
                >
                  <Link href="/signup">
                    <button
                      className="hp-btn-elevated"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'var(--hp-btn-text)',
                        color: 'var(--hp-brand-deep)',
                        border: '1px solid var(--hp-border-strong)',
                        borderRadius: 14,
                        padding: '13px 24px',
                        fontFamily: 'var(--hp-font-body)',
                        fontWeight: 700,
                        fontSize: 14.5,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Join The ANTs Squad — It&apos;s Free
                      <Zap size={15} />
                    </button>
                  </Link>
                  <Link
                    href="/team"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '13px 22px',
                      borderRadius: 14,
                      border: '1px solid rgba(255,255,255,0.28)',
                      color: 'var(--hp-btn-text)',
                      fontFamily: 'var(--hp-font-body)',
                      fontWeight: 700,
                      fontSize: 14.5,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Talk to Student Leaders
                  </Link>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative' }}>
        <Footer />
      </section>
    </div>
  );
}