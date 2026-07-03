'use client';

import React, { useState } from 'react';
import ExamDataEditor from '@/components/exam-data/ExamDataEditor';
import GradeCalculator from '@/components/exam-data/GradeCalculator';
import GradeCalculatorEditor from '@/components/exam-data/GradeCalculatorEditor';
import CountdownEditor from '@/components/exam-data/CountdownEditor';
import ReviewQueuePanel from '@/components/exam-data/ReviewQueuePanel';
import { useAuth } from '@/hooks/useAuth';
import { mockGradeBoundaries } from '@/lib/mock/database';
import { ExamGradeBoundary } from '@/types';

export default function ExamDataPage() {
  const { user } = useAuth();
  const [gradeBoundaries, setGradeBoundaries] = useState<ExamGradeBoundary[]>(() => mockGradeBoundaries);
  const canReview = user?.profile.role === 'main_contributor';

  return (
    <div className="min-h-screen bg-white font-sans relative">
      {/* Background Pattern similar to reference */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-85"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)',
        }}
      />
      
      <div className="relative z-10 w-full px-4 py-6 md:px-6 max-w-[1800px] mx-auto">
        <div className="mb-4">
          <h1 className="text-3xl font-extrabold text-[#0F172A]">
            Exam Data & Boundaries
          </h1>
          <p className="text-slate-600 mt-1 font-medium">
            Manage syllabus blueprints and calculate percentage uniform marks side-by-side.
          </p>
        </div>

        {/* Split View Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[calc(100vh-140px)] min-h-[800px]">
          {/* Left Side: Editor */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-y-auto overflow-x-hidden relative flex flex-col">
            <ExamDataEditor gradeBoundaries={gradeBoundaries} onGradeBoundariesChange={setGradeBoundaries} />
          </div>

          {/* Right Side: Calculator */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-y-auto overflow-x-hidden relative flex flex-col">
            <GradeCalculator gradeBoundaries={gradeBoundaries} />
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div className="mb-2">
            <h2 className="text-2xl font-extrabold text-[#0F172A]">Contributor editors</h2>
            <p className="text-slate-600 mt-1 font-medium">
              Submit new grade calculator presets and countdown entries for review before they become live.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <GradeCalculatorEditor />
            <CountdownEditor />
          </div>

          {canReview ? <ReviewQueuePanel /> : null}
        </div>
      </div>
    </div>
  );
}
