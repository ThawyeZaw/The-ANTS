'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Past Paper Tracker Page
// Route: /past-papers
// ──────────────────────────────────────────────────────────────────────────────

import React from 'react';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { PastPaperTracker } from '@/components/past-papers/PastPaperTracker';

export default function PastPapersPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-foreground-muted animate-pulse text-xs font-mono">
          Loading your study workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors space-y-6">
      <BackButton href="/dashboard" label="Back to Dashboard" />
      <PastPaperTracker userId={user.id} />
    </div>
  );
}
