'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Public Route Group Layout
// Provides universal navigation shell & footer for all public visitors.
// ──────────────────────────────────────────────────────────────────────────────

import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <NavBar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>
      <Footer />
    </div>
  );
}
