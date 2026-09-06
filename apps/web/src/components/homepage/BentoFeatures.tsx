'use client';

// ──────────────────────────────────────────────────────────────────────────────
// Homepage — BentoFeatures
// Bento-grid layout for the features section.
// Clean Lucide outline icons — no neon/colored icon wells.
// ──────────────────────────────────────────────────────────────────────────────

import {
  CalendarDays,
  Timer,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  Clock,
  Calculator,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import RevealSection from './RevealSection';

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

interface Feature {
  title: string;
  description: string;
  Icon: LucideIcon;
  big?: boolean;
  preview?: 'timetable';
}

const FEATURES: Feature[] = [
  {
    title: 'Smart Timetable',
    description:
      'Drag-and-drop weekly planner with colour-coded events, repeating schedules and multiple views.',
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
    title: 'Lesson Tracker',
    description:
      'Track your confidence across every topic in your syllabus with intuitive progress indicators.',
    Icon: ClipboardCheck,
  },
  {
    title: 'Virtual Classrooms',
    description:
      'Teachers create classrooms, issue assignments and monitor student progress in real time.',
    Icon: GraduationCap,
  },
  {
    title: 'Clubs',
    description:
      'Community spaces for subjects, CCAs and projects — with chat, announcements and resources.',
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

function BentoCard({ feature, index }: { feature: Feature; index: number }) {
  const { title, description, Icon, big, preview } = feature;

  return (
    <RevealSection delayMs={index * 60} className={big ? 'big-card' : ''}>
      <div
        className="bento-card hp-card-elevated"
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'var(--hp-surface-2)',
              border: '1px solid var(--hp-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon
              style={{ width: big ? 26 : 22, height: big ? 26 : 22, color: 'var(--hp-ink-muted)' }}
              strokeWidth={2}
              aria-hidden
            />
          </div>
          {preview === 'timetable' && <MiniTimetable />}
        </div>

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

export default function BentoFeatures() {
  return (
    <div className="bento-grid">
      {FEATURES.map((feature, i) => (
        <BentoCard key={feature.title} feature={feature} index={i} />
      ))}
    </div>
  );
}
