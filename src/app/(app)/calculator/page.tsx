'use client';

import React from 'react';
import GradeCalculator from '@/components/exam-data/GradeCalculator';

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
        <GradeCalculator />
      </div>
    </div>
  );
}
