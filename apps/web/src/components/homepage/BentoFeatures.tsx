'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — BentoFeatures (Interactive Toolkit)
// Six feature cards with mini previews, matching the Stitch / Netlify reference.
// Clubs & classrooms omitted (retired).
// ──────────────────────────────────────────────────────────────────────────────

import {
  CalendarDays,
  Headphones,
  ClipboardCheck,
  Layers,
  ChartColumn,
  Calculator,
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
  preview: 'schedule' | 'streak' | 'bars' | 'avatars' | 'heatmap' | 'grade';
  href?: string;
}

const FEATURES: Feature[] = [
  {
    tag: 'DRAG & DROP',
    title: 'Smart Timetable',
    description:
      'Drag, drop, lock in your week with aesthetic color codes & zero chaos. Syncs exam dates and revision blocks automatically.',
    Icon: CalendarDays,
    accent: 'var(--hp-violet)',
    preview: 'schedule',
  },
  {
    tag: 'TRY FREE',
    title: 'Pomodoro & Lo-Fi Beats',
    description:
      'Focus timer dialed into standard 25/5 intervals with integrated background audio. Cut distractions and rack up deep study hours.',
    Icon: Headphones,
    accent: 'var(--hp-amber)',
    preview: 'streak',
    href: '/pomodoro',
  },
  {
    tag: 'LIVE METRIC',
    title: 'Lesson & Syllabus Tracker',
    description:
      'Turn your official Cambridge/Edexcel syllabus checklists from red to confident green with real topic confidence metrics.',
    Icon: ClipboardCheck,
    accent: 'var(--hp-brand)',
    preview: 'bars',
  },
  {
    tag: 'STUDY PACKS',
    title: 'Notes & Flashcards',
    description:
      'Build revision packs in-app — structured notes, spaced-repetition flashcards, and quick quiz drills mapped to your syllabus.',
    Icon: Layers,
    accent: 'var(--hp-violet)',
    preview: 'avatars',
  },
  {
    tag: 'PREDICTIVE',
    title: 'Syllabus Heatmap',
    description:
      'Never guess what to revise next. Instant heatmap identifies high-weighting topics where your marks drop in past exams.',
    Icon: ChartColumn,
    accent: 'var(--hp-ink-muted)',
    preview: 'heatmap',
  },
  {
    tag: 'CALCULATOR',
    title: 'Grade Boundary Predictor',
    description:
      'Plug in your raw marks from June/Nov past paper sessions and calculate official A* / 9 boundaries without math gymnastics.',
    Icon: Calculator,
    accent: 'var(--hp-brand)',
    preview: 'grade',
  },
];

function FeaturePreview({ type }: { type: Feature['preview'] }) {
  if (type === 'schedule') {
    return (
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
              background: 'var(--hp-violet)',
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
            Pure Math 1 Past Paper
          </span>
        </span>
        <span
          style={{
            fontFamily: 'var(--hp-font-mono)',
            fontSize: 11,
            color: 'var(--hp-ink-faint)',
            flexShrink: 0,
          }}
        >
          16:00 – 18:00
        </span>
      </div>
    );
  }

  if (type === 'streak') {
    return (
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
            fontSize: 11.5,
            fontWeight: 700,
            color: 'var(--hp-brand-deep)',
          }}
        >
          4 Streaks Completed
        </span>
        <span
          style={{
            fontFamily: 'var(--hp-font-body)',
            fontSize: 12.5,
            color: 'var(--hp-ink-muted)',
          }}
        >
          Next: 5m Coffee Break
        </span>
      </div>
    );
  }

  if (type === 'bars') {
    return (
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        {[1, 1, 1, 0, 0].map((on, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 999,
              background: on ? 'var(--hp-brand)' : 'var(--hp-surface-2)',
              border: on ? 'none' : '1px solid var(--hp-border)',
            }}
          />
        ))}
        <span
          style={{
            marginLeft: 4,
            fontFamily: 'var(--hp-font-mono)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--hp-brand)',
          }}
        >
          60%
        </span>
      </div>
    );
  }

  if (type === 'avatars') {
    const peeps = [
      { t: 'AK', bg: 'var(--hp-brand)' },
      { t: 'MK', bg: 'var(--hp-amber)' },
      { t: 'TZ', bg: 'var(--hp-violet)' },
    ];
    return (
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex' }}>
          {peeps.map((p, i) => (
            <span
              key={p.t}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: p.bg,
                color: '#fff',
                fontFamily: 'var(--hp-font-body)',
                fontSize: 10,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: i === 0 ? 0 : -8,
                border: '2px solid var(--hp-surface)',
              }}
            >
              {p.t}
            </span>
          ))}
        </div>
        <span
          style={{
            fontFamily: 'var(--hp-font-body)',
            fontSize: 12.5,
            color: 'var(--hp-ink-muted)',
          }}
        >
          +42 studying now
        </span>
      </div>
    );
  }

  if (type === 'heatmap') {
    const cells = [
      'var(--hp-brand)',
      'color-mix(in srgb, var(--hp-brand) 55%, transparent)',
      'var(--hp-amber)',
      'color-mix(in srgb, #ef4444 70%, transparent)',
    ];
    return (
      <div
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
        }}
      >
        {cells.map((c, i) => (
          <span key={i} style={{ height: 14, borderRadius: 5, background: c }} />
        ))}
      </div>
    );
  }

  return (
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
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--hp-ink)',
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
  );
}

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
                background: 'var(--hp-bg-soft)',
                border: '1px solid var(--hp-border)',
                color: 'var(--hp-ink-muted)',
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

        <FeaturePreview type={preview} />
      </div>
  );

  return (
    <RevealSection delayMs={index * 50}>
      {href ? (
        <Link href={href} className="block h-full no-underline focus-ring rounded-[var(--hp-radius-lg)]">
          {card}
        </Link>
      ) : (
        card
      )}
    </RevealSection>
  );
}

export default function BentoFeatures() {
  return (
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
  );
}
