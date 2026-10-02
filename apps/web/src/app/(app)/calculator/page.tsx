'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import BackButton from '@/components/ui/BackButton';

const GradeCalculator = dynamic(
  () => import('@/components/exam-data/GradeCalculator'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-3xl border border-border bg-background-card p-4 sm:p-6 md:p-8 shadow-xs space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="space-y-3 border-b border-border pb-6">
          <div className="h-5 w-40 rounded-full bg-background-secondary" />
          <div className="h-7 w-72 max-w-full rounded-lg bg-background-secondary" />
          <div className="h-4 w-96 max-w-full rounded bg-background-secondary" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 rounded-2xl bg-background-secondary" />
          <div className="h-16 rounded-2xl bg-background-secondary" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-12 rounded-xl bg-background-secondary" />
          <div className="h-12 rounded-xl bg-background-secondary" />
        </div>
      </div>
    ),
  },
);

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-300 font-sans relative">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-80"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)',
        }}
      />

      <div className="relative z-10 w-full px-4 py-6 md:px-6 max-w-[1600px] mx-auto">
        <div className="mb-6">
          <BackButton href="/dashboard" label="Back to Dashboard" />
        </div>
        <GradeCalculator />
      </div>
    </div>
  );
}
