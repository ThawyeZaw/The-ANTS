'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import ExamDataEditor from '@/components/exam-data/ExamDataEditor';

export default function ExamEditorPage() {
  const { theme, themeColor } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 font-sans relative">
      {/* Dynamic theme-aware background pattern */}
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
        <div className="mb-4">
          <h1 className="text-3xl font-extrabold text-[var(--foreground)]">
            Exam Syllabus Editor
          </h1>
          <p className="text-[var(--foreground-secondary)] mt-1 font-medium">
            Create and manage exam blueprints, component weights, and grade boundaries.
          </p>
        </div>

        {/* Editor Container */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-card)] shadow-2xl shadow-[var(--shadow-glow)] overflow-hidden relative flex flex-col">
          <ExamDataEditor />
        </div>
      </div>
    </div>
  );
}
