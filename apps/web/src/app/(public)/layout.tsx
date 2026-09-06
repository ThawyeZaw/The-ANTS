'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Public Route Group Layout
// Provides sidebar/bottom-nav shell & footer for all public visitors.
// ──────────────────────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <Suspense fallback={null}>
        <NavBar />
      </Suspense>
      <div className="md:pl-[var(--sidebar-width-collapsed)] lg:pl-[var(--sidebar-width)] pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-0 min-h-screen flex flex-col transition-[padding] duration-200 ease-out motion-reduce:transition-none">
        <main
          id="main-content"
          className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in"
        >
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
