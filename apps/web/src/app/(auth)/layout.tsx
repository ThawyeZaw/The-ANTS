// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Auth Layout
// Route group layout for /login and /signup — no NavBar, centered card.
// ──────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';

export const metadata = {
  title: 'The ANTs — Sign In',
  description: 'Sign in or create an account to access The ANTs academic productivity platform.',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse-soft" />
      </div>

      <Link
        href="/"
        aria-label="Back to home"
        title="Back to home"
        className="absolute top-4 left-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background-card text-foreground-secondary transition-colors hover:border-border-hover hover:text-foreground"
      >
        <Home className="h-4 w-4" aria-hidden />
      </Link>

      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
