'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — BentoFeatures
// Bento-grid layout for the 8 features section.
// Smart Timetable → col-span-2 with mini timetable preview inside.
// Flashcard Decks → col-span-2 with clickable flip card demo inside.
// Other 6 features → col-span-1 standard tiles.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  CalendarDays,
  Timer,
  Layers,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  Clock,
  Calculator,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import RevealSection from './RevealSection';

// ── Mini timetable preview (inside Smart Timetable big tile) ──────────────────
const TT_MINI = [
  { day: 'M', blocks: ['b1', 'b2'] },
  { day: 'T', blocks: ['b3'] },
  { day: 'W', blocks: ['b1', 'b3'] },
  { day: 'T', blocks: ['b2'] },
  { day: 'F', blocks: ['b1', 'b2', 'b3'] },
];

const BLOCK_H: Record<string, number> = { b1: 22, b2: 14, b3: 18 };
const BLOCK_BG: Record<string, string> = {
  b1: 'var(--hp-brand)',
  b2: 'var(--hp-violet)',
  b3: 'var(--hp-amber)',
};

function MiniTimetable() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5,1fr)',
        gap: 5,
        width: 130,
        flexShrink: 0,
      }}
    >
      {TT_MINI.map(({ day, blocks }, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div
            style={{
              fontFamily: 'var(--hp-font-mono)',
              fontSize: 9,
              color: 'var(--hp-ink-faint)',
              textAlign: 'center',
              marginBottom: 2,
            }}
          >
            {day}
          </div>
          {blocks.map((b, bi) => (
            <div
              key={bi}
              style={{
                height: BLOCK_H[b],
                borderRadius: 4,
                background: BLOCK_BG[b],
                opacity: 0.82,
                width: '100%',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Flip card (inside Flashcard Decks big tile) ───────────────────────────────
function FlipCardDemo() {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      aria-label="Flip flashcard demo"
      style={{
        width: 118,
        height: 74,
        flexShrink: 0,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
      className={`hp-flip-card${flipped ? ' flipped' : ''}`}
    >
      <div className="hp-flip-inner" style={{ width: '100%', height: '100%' }}>
        <div className="hp-flip-face hp-flip-front">tap to flip</div>
        <div className="hp-flip-face hp-flip-back">F = ma</div>
      </div>
    </button>
  );
}

// ── Feature tile data ─────────────────────────────────────────────────────────

interface Feature {
  title: string;
  description: string;
  Icon: LucideIcon;
  iconColor: string;
  big?: boolean;
  preview?: 'timetable' | 'flashcard';
}

const FEATURES: Feature[] = [
  {
    title: 'Smart Timetable',
    description:
      'Drag-and-drop weekly planner with colour-coded events, repeating schedules and multiple views.',
    Icon: CalendarDays,
    iconColor: '#1D9BF0',
    big: true,
    preview: 'timetable',
  },
  {
    title: 'Flashcard Decks',
    description: "Create or browse decks with spaced-repetition. Never forget what you've learnt.",
    Icon: Layers,
    iconColor: '#9D5CFF',
    big: true,
    preview: 'flashcard',
  },
  {
    title: 'Pomodoro Timer',
    description:
      'Focus sessions with customisable intervals and background music to keep you in the zone.',
    Icon: Timer,
    iconColor: '#FF4A6B',
  },
  {
    title: 'Lesson Tracker',
    description:
      'Track your confidence across every topic in your syllabus with intuitive progress indicators.',
    Icon: ClipboardCheck,
    iconColor: '#00CC88',
  },
  {
    title: 'Virtual Classrooms',
    description:
      'Teachers create classrooms, issue assignments and monitor student progress in real time.',
    Icon: GraduationCap,
    iconColor: '#FF9F0A',
  },
  {
    title: 'Clubs',
    description:
      'Community spaces for subjects, CCAs and projects — with chat, announcements and resources.',
    Icon: MessageSquare,
    iconColor: '#00A2FF',
  },
  {
    title: 'Exam Countdown',
    description:
      'Visual urgency indicators showing exactly how long until each exam. Never miss a date.',
    Icon: Clock,
    iconColor: '#FF453A',
  },
  {
    title: 'Grade Calculator',
    description:
      'Enter raw marks and get predicted grades using official boundary tables for IGCSE, A Level and more.',
    Icon: Calculator,
    iconColor: '#7E57C2',
  },
];

// ── Single bento card ─────────────────────────────────────────────────────────

function BentoCard({ feature, index }: { feature: Feature; index: number }) {
  const { title, description, Icon, iconColor, big, preview } = feature;

  return (
    <RevealSection
      delayMs={index * 60}
      className={big ? 'big-card' : ''}
    >
      <div
        className="bento-card"
        style={{
          background: 'var(--hp-surface)',
          border: '1px solid var(--hp-border)',
          borderRadius: 'var(--hp-radius-md)',
          padding: big ? 32 : 26,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          minHeight: big ? 280 : 200,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top row: icon + optional preview widget */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${iconColor}1A`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon
              style={{ width: big ? 26 : 22, height: big ? 26 : 22, color: iconColor }}
              strokeWidth={1.5}
            />
          </div>
          {preview === 'timetable' && <MiniTimetable />}
          {preview === 'flashcard' && <FlipCardDemo />}
        </div>

        {/* Text */}
        <div style={{ marginTop: big ? 20 : 16, flex: 1 }}>
          <h3
            style={{
              fontFamily: 'var(--hp-font-display)',
              fontSize: big ? 19 : 17,
              fontWeight: 600,
              color: 'var(--hp-ink)',
              margin: '0 0 8px',
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontFamily: 'var(--hp-font-body)',
              fontSize: big ? 14 : 13.5,
              color: 'var(--hp-ink-muted)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </RevealSection>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function BentoFeatures() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridAutoRows: 'auto',
        gridAutoFlow: 'dense',
        gap: 18,
      }}
      className="bento-features-grid"
    >
      <style>{`
        .bento-features-grid .big-card {
          grid-column: span 2;
        }

        .bento-features-grid .bento-card {
          transition: border-color 0.3s cubic-bezier(0.0, 0.0, 0.2, 1),
                      transform 0.3s cubic-bezier(0.0, 0.0, 0.2, 1),
                      box-shadow 0.3s cubic-bezier(0.0, 0.0, 0.2, 1);
        }

        .bento-features-grid .bento-card:hover {
          border-color: var(--hp-border-strong) !important;
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -12px rgba(60, 219, 167, 0.18);
        }

        [data-theme="light"] .bento-features-grid .bento-card:hover {
          box-shadow: 0 20px 40px -12px rgba(5, 150, 105, 0.15);
        }

        @media (max-width: 960px) {
          .bento-features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .bento-features-grid .big-card {
            grid-column: span 2 !important;
          }
        }
        @media (max-width: 580px) {
          .bento-features-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .bento-features-grid .big-card {
            grid-column: span 1 !important;
          }
        }
      `}</style>
      {FEATURES.map((feature, i) => (
        <BentoCard key={feature.title} feature={feature} index={i} />
      ))}
    </div>
  );
}