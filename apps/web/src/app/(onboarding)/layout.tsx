// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Onboarding Layout
// Route group layout for /onboarding — no NavBar, clean progress-bar header.
// ──────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';

export const metadata = {
  title: 'Welcome — The ANTs',
  description:
    'Set up your CAIE and Edexcel subjects, exam session, and countdown reminders.',
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-40 -top-40 h-80 w-80 animate-float rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 animate-float rounded-full bg-accent/10 blur-3xl delay-500" />
        <div className="absolute right-1/4 top-1/3 h-64 w-64 animate-pulse-soft rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
