'use client';

import React from 'react';
import Link from 'next/link';
import { Calculator, Timer, CheckCircle2, ArrowRight } from 'lucide-react';
import RevealSection from './RevealSection';

const STEPS = [
  {
    step: '01',
    badge: 'Step 1 · Setup & Targets',
    title: 'Plan & Predict',
    description:
      'Choose your Cambridge (CAIE) or Pearson Edexcel qualification. Use the Grade Calculator to see exact raw mark and UMS targets, and set countdowns for your exam papers or IELTS.',
    icon: Calculator,
    color: 'var(--hp-brand)',
    actionLabel: 'Try Grade Calculator',
    actionHref: '/calculator',
  },
  {
    step: '02',
    badge: 'Step 2 · Daily Deep Work',
    title: 'Focus & Study',
    description:
      'Block your revision week with the Smart Timetable and lock in distraction-free study blocks using the Pomodoro timer with ambient soundscapes. Build your daily streak.',
    icon: Timer,
    color: 'var(--hp-amber)',
    actionLabel: 'Launch Pomodoro',
    actionHref: '/pomodoro',
  },
  {
    step: '03',
    badge: 'Step 3 · Performance & Mastery',
    title: 'Track & Conquer',
    description:
      'Check off syllabus topics as you understand them. Solve past papers, record component marks into the tracker, and compare your performance against official grade boundaries.',
    icon: CheckCircle2,
    color: 'var(--hp-violet)',
    actionLabel: 'Explore Past Papers',
    actionHref: '/past-papers',
  },
];

export default function HowItWorks() {
  return (
    <RevealSection>
      <div className="hp-how-it-works-grid">
        <style>{`
          .hp-how-it-works-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 22px;
            margin-top: 36px;
          }
          @media (max-width: 900px) {
            .hp-how-it-works-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }
          }
        `}</style>

        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.step}
              className="hp-card-elevated"
              style={{
                position: 'relative',
                background: 'var(--hp-surface)',
                border: '1px solid var(--hp-border)',
                borderRadius: 'var(--hp-radius-lg)',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 290,
                transition: 'transform 0.25s ease, border-color 0.25s ease',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--hp-font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: `color-mix(in srgb, ${step.color} 12%, transparent)`,
                      color: step.color,
                      border: `1px solid color-mix(in srgb, ${step.color} 24%, transparent)`,
                    }}
                  >
                    {step.badge}
                  </span>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `color-mix(in srgb, ${step.color} 12%, transparent)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: step.color,
                    }}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--hp-font-display)',
                    fontSize: 20,
                    fontWeight: 650,
                    color: 'var(--hp-ink)',
                    margin: '0 0 10px',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 14,
                    color: 'var(--hp-ink-muted)',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {step.description}
                </p>
              </div>

              <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid var(--hp-border)' }}>
                <Link
                  href={step.actionHref}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'var(--hp-font-body)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: step.color,
                    textDecoration: 'none',
                  }}
                >
                  {step.actionLabel}
                  <ArrowRight size={13} strokeWidth={2.2} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </RevealSection>
  );
}
