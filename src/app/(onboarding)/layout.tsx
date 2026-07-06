// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Onboarding Layout
// Route group layout for /onboarding — no NavBar, clean progress-bar header.
// ──────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';

export const metadata = {
  title: 'Welcome — The ANTS',
  description: 'Set up your ANTS account to personalise your study experience.',
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float delay-500" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse-soft" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
