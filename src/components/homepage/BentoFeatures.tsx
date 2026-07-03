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
  big?: boolean;
  preview?: 'timetable' | 'flashcard';
}

const FEATURES: Feature[] = [
  {
    title: 'Smart Timetable',
    description:
      'Drag-and-drop weekly planner with colour-coded events, repeating schedules, and daily / weekly / monthly views.',
    Icon: CalendarDays,
    big: true,
    preview: 'timetable',
  },
  {
    title: 'Pomodoro Timer',
    description:
      'Focus sessions with customisable intervals and background music to keep you in the zone.',
    Icon: Timer,
  },
  {
    title: 'Flashcard Decks',
    description: "Create or browse decks with spaced-repetition. Never forget what you've learnt.",
    Icon: Layers,
    big: true,
    preview: 'flashcard',
  },
  {
    title: 'Lesson Tracker',
    description:
      'Track your confidence across every topic in your syllabus with intuitive progress indicators.',
    Icon: ClipboardCheck,
  },
  {
    title: 'Virtual Classrooms',
    description:
      'Teachers create classrooms, issue assignments, and monitor student progress in real time.',
    Icon: GraduationCap,
  },
  {
    title: 'Clubs',
    description:
      'Community spaces for subjects, CCAs, and projects — with chat, announcements, and resources.',
    Icon: MessageSquare,
  },
  {
    title: 'Exam Countdown',
    description:
      'Visual urgency indicators showing exactly how long until each exam. Never miss a date.',
    Icon: Clock,
  },
  {
    title: 'Grade Calculator',
    description:
      'Enter raw marks and get predicted grades using official boundary tables for IGCSE, A Level and more.',
    Icon: Calculator,
  },
];

// ── Single bento card ─────────────────────────────────────────────────────────

function BentoCard({ feature, index }: { feature: Feature; index: number }) {
  const { title, description, Icon, big, preview } = feature;

  return (
    <RevealSection
      delayMs={index * 60}
      className={big ? 'col-span-2' : 'col-span-1'}
    >

      <div
        style={{
          background: 'var(--hp-surface)',
          border: '1px solid var(--hp-border)',
          borderRadius: 'var(--hp-radius-md)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'border-color 0.2s ease, transform 0.2s ease',
          height: '100%',
          minHeight: 190,
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--hp-border-strong)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--hp-border)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Top row: icon + optional preview widget */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <Icon
            style={{ width: 32, height: 32, color: 'var(--hp-brand)', flexShrink: 0 }}
            strokeWidth={1.5}
          />
          {preview === 'timetable' && <MiniTimetable />}
          {preview === 'flashcard' && <FlipCardDemo />}
        </div>

        {/* Text */}
        <div style={{ marginTop: 16 }}>
          <h3
            style={{
              fontFamily: 'var(--hp-font-display)',
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--hp-ink)',
              margin: '0 0 6px',
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontFamily: 'var(--hp-font-body)',
              fontSize: 13.5,
              color: 'var(--hp-ink-muted)',
              lineHeight: 1.55,
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
        gridAutoRows: 'minmax(190px, auto)',
        gap: 16,
      }}
      className="bento-features-grid"
    >
      <style>{`
        @media (max-width: 900px) {
          .bento-features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .bento-features-grid .col-span-2 {
            grid-column: span 2 !important;
          }
        }
        @media (max-width: 540px) {
          .bento-features-grid {
            grid-template-columns: 1fr !important;
          }
          .bento-features-grid .col-span-2 {
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
