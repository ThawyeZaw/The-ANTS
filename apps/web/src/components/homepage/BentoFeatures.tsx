'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — BentoFeatures (Flagship Study Tools Grid)
// Six clickable feature cards showcasing The ANTs' actual study tools,
// with an "Explore All Study Tools →" CTA below the grid.
// ──────────────────────────────────────────────────────────────────────────────

import {
  BookOpen,
  CalendarDays,
  Timer,
  Calculator,
  Clock,
  Trophy,
  ArrowRight,
  Wrench,
  GraduationCap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import RevealSection from './RevealSection';

interface Feature {
  tag: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  accent: string;
  preview: React.ReactNode;
  href: string;
}

const FEATURES: Feature[] = [
  {
    tag: 'MOST POPULAR',
    title: 'Grade Boundary Predictor',
    description:
      'Plug in raw component marks from any Cambridge CAIE session or Edexcel UMS unit and instantly see your predicted grade against official thresholds.',
    Icon: Calculator,
    accent: 'var(--hp-brand)',
    href: '/calculator',
    preview: (
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 12px',
          borderRadius: 12,
          background: 'var(--hp-bg-soft)',
          border: '1px solid var(--hp-border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--hp-font-mono)',
            fontSize: 12,
            color: 'var(--hp-ink-muted)',
          }}
        >
          Raw: 168 / 200
        </span>
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 6,
            background: 'var(--hp-brand)',
            color: 'var(--hp-btn-text)',
            fontFamily: 'var(--hp-font-mono)',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          Predicted: A*
        </span>
      </div>
    ),
  },
  {
    tag: 'DEEP WORK',
    title: 'Pomodoro Focus Timer',
    description:
      'Timed deep-work intervals with ambient lo-fi soundscapes. Link focus blocks to your enrolled subjects and build your daily study streaks.',
    Icon: Timer,
    accent: 'var(--hp-amber)',
    href: '/pomodoro',
    preview: (
      <div
        style={{
          marginTop: 16,
          padding: '10px 12px',
          borderRadius: 12,
          background: 'var(--hp-bg-soft)',
          border: '1px solid var(--hp-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--hp-font-mono)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--hp-amber)',
            letterSpacing: '-0.02em',
          }}
        >
          25:00
        </span>
        <span
          style={{
            fontFamily: 'var(--hp-font-body)',
            fontSize: 12.5,
            color: 'var(--hp-ink-muted)',
          }}
        >
          🎧 Focus Block · +20 XP
        </span>
      </div>
    ),
  },
  {
    tag: 'SYLLABUS MASTERY',
    title: 'Curriculum & Topic Tracker',
    description:
      'Official syllabus breakdowns for Cambridge & Edexcel. Check off subtopics, monitor your percentage mastery, and navigate the modular maths suite with ease.',
    Icon: GraduationCap,
    accent: 'var(--hp-violet)',
    href: '/curriculum',
    preview: (
      <div
        style={{
          marginTop: 16,
          padding: '10px 12px',
          borderRadius: 12,
          background: 'var(--hp-bg-soft)',
          border: '1px solid var(--hp-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--hp-font-body)', fontSize: 12, fontWeight: 600, color: 'var(--hp-ink)' }}>
            Pure Math 1 (WMA11)
          </span>
          <span style={{ fontFamily: 'var(--hp-font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--hp-violet)' }}>
            82% Done
          </span>
        </div>
        <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'var(--hp-surface-2)', overflow: 'hidden' }}>
          <div style={{ width: '82%', height: '100%', borderRadius: 999, background: 'var(--hp-violet)' }} />
        </div>
      </div>
    ),
  },
  {
    tag: 'EXAM DRILLS',
    title: 'Past Paper Tracker',
    description:
      'Excel-style matrix for recording solved papers. Enter component marks, derive official grades, and review historic session trends.',
    Icon: BookOpen,
    accent: 'var(--hp-brand)',
    href: '/past-papers',
    preview: (
      <div
        style={{
          marginTop: 16,
          padding: '10px 12px',
          borderRadius: 12,
          background: 'var(--hp-bg-soft)',
          border: '1px solid var(--hp-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--hp-brand)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--hp-font-body)',
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--hp-ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Physics 0625 / Paper 4
          </span>
        </span>
        <span
          style={{
            fontFamily: 'var(--hp-font-mono)',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'color-mix(in srgb, var(--hp-brand) 18%, transparent)',
            color: 'var(--hp-brand-deep)',
          }}
        >
          A* — 68/80
        </span>
      </div>
    ),
  },
  {
    tag: 'TIME BLOCKING',
    title: 'Smart Timetable & Tasks',
    description:
      'Time-blocking schedule planner with integrated revision to-do lists. Keep track of class schedules, self-study slots, and assignment deadlines.',
    Icon: CalendarDays,
    accent: 'var(--hp-violet)',
    href: '/timetable',
    preview: (
      <div style={{ marginTop: 16, display: 'flex', gap: 6 }}>
        {[
          { label: 'Mon', fill: true },
          { label: 'Tue', fill: true },
          { label: 'Wed', fill: false },
          { label: 'Thu', fill: true },
          { label: 'Fri', fill: false },
        ].map(({ label, fill }) => (
          <div
            key={label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--hp-font-mono)',
                fontSize: 9,
                color: 'var(--hp-ink-faint)',
              }}
            >
              {label}
            </span>
            <span
              style={{
                width: '100%',
                height: 28,
                borderRadius: 8,
                background: fill ? 'var(--hp-violet)' : 'var(--hp-surface-2)',
                border: fill ? 'none' : '1px solid var(--hp-border)',
                opacity: fill ? 0.9 : 0.5,
              }}
            />
          </div>
        ))}
      </div>
    ),
  },
  {
    tag: 'OFFICIAL & IELTS',
    title: 'Exam Countdown',
    description:
      'Live precision countdowns to official Cambridge and Edexcel exam sessions, plus custom countdowns for IELTS, school tests, and university deadlines.',
    Icon: Clock,
    accent: 'var(--hp-ink-muted)',
    href: '/countdown',
    preview: (
      <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[
          { label: 'Days', value: '47' },
          { label: 'Hours', value: '09' },
          { label: 'Mins', value: '22' },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 10,
              background: 'var(--hp-bg-soft)',
              border: '1px solid var(--hp-border)',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--hp-font-mono)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--hp-ink)',
                lineHeight: 1,
              }}
            >
              {value}
            </span>
            <span
              style={{
                fontFamily: 'var(--hp-font-mono)',
                fontSize: 9,
                color: 'var(--hp-ink-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    ),
  },
];

function BentoCard({ feature, index }: { feature: Feature; index: number }) {
  const { tag, title, description, Icon, accent, preview, href } = feature;

  const card = (
    <div
      className="bento-card hp-card-elevated"
      style={{
        background: 'var(--hp-surface)',
        border: '1px solid var(--hp-border)',
        borderRadius: 'var(--hp-radius-lg)',
        padding: 26,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: 248,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: `color-mix(in srgb, ${accent} 14%, transparent)`,
              color: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={22} strokeWidth={2} aria-hidden />
          </div>
          <span
            style={{
              fontFamily: 'var(--hp-font-mono)',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '4px 10px',
              borderRadius: 999,
              background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
              color: accent,
            }}
          >
            {tag}
          </span>
        </div>

        <h3
          style={{
            fontFamily: 'var(--hp-font-display)',
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--hp-ink)',
            margin: '18px 0 8px',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--hp-font-body)',
            fontSize: 13.5,
            color: 'var(--hp-ink-muted)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>

      {preview}

      {/* "Open Tool →" footer row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginTop: 18,
          fontFamily: 'var(--hp-font-body)',
          fontSize: 12.5,
          fontWeight: 700,
          color: accent,
        }}
        className="bento-open-link"
      >
        Open Tool
        <ArrowRight size={13} strokeWidth={2.5} />
      </div>
    </div>
  );

  return (
    <RevealSection delayMs={index * 50}>
      <Link
        href={href}
        className="block h-full no-underline focus-ring rounded-[var(--hp-radius-lg)] group"
        style={{ textDecoration: 'none' }}
      >
        <style>{`
          .group:hover .bento-card { border-color: var(--hp-border-strong); box-shadow: 0 8px 32px -8px rgba(0,0,0,0.12); }
          .group:hover .bento-open-link { gap: 8px; }
          .bento-open-link { transition: gap 0.2s ease; }
        `}</style>
        {card}
      </Link>
    </RevealSection>
  );
}

export default function BentoFeatures() {
  return (
    <div>
      <div
        className="bento-features-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18,
        }}
      >
        <style>{`
          @media (max-width: 960px) {
            .bento-features-grid { grid-template-columns: 1fr 1fr !important; }
          }
          @media (max-width: 640px) {
            .bento-features-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
        {FEATURES.map((feature, i) => (
          <BentoCard key={feature.title} feature={feature} index={i} />
        ))}
      </div>

      {/* "Explore All Study Tools" CTA */}
      <RevealSection>
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link
            href="/tools"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 26px',
              borderRadius: 14,
              background: 'var(--hp-surface)',
              border: '1px solid var(--hp-border-strong)',
              color: 'var(--hp-ink)',
              fontFamily: 'var(--hp-font-body)',
              fontWeight: 700,
              fontSize: 14.5,
              textDecoration: 'none',
              transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--hp-brand)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 24px -8px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--hp-border-strong)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
            }}
          >
            <Wrench size={16} strokeWidth={2} />
            Explore All Study Tools
            <ArrowRight size={15} strokeWidth={2.2} />
          </Link>
        </div>
      </RevealSection>
    </div>
  );
}
