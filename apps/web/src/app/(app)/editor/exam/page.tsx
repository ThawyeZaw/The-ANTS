'use client';

import React from 'react';
import Link from 'next/link';
import { Calculator, Clock, ArrowRight } from 'lucide-react';

export default function ExamEditorPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 font-sans relative">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-80"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)',
        }}
      />

      <div className="relative z-10 w-full px-4 py-6 md:px-6 max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-[var(--foreground)]">
            Exam Data Editors
          </h1>
          <p className="text-[var(--foreground-secondary)] mt-1 font-medium">
            Propose new grade calculator presets and exam countdowns for review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/contribute/grade-calculator"
            className="group flex flex-col items-start gap-4 rounded-3xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-xl transition-all hover:shadow-2xl hover:border-[var(--primary)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                Grade Calculator Editor
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </h2>
              <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                Propose calculator presets with paper components, weights, and grade boundaries linked to curricula.
              </p>
            </div>
          </Link>

          <Link
            href="/contribute/countdown"
            className="group flex flex-col items-start gap-4 rounded-3xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-xl transition-all hover:shadow-2xl hover:border-[var(--primary)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                Countdown Editor
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </h2>
              <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                Propose exam countdowns with dates, priority levels, and qualification groups linked to curricula and subjects.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
