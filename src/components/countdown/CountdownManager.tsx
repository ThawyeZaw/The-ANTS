'use client';

import React, { useState } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { CountdownCard } from './CountdownCard';
import { AddCountdownModal } from './AddCountdownModal';
import { Plus, Timer, BookMarked } from 'lucide-react';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';

interface CountdownManagerProps {
  userId: string;
}

export function CountdownManager({ userId }: CountdownManagerProps) {
  const { groupedCountdowns, availableExams, createCountdown, deleteCountdown } = useCountdown(userId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const groupOrder = ['IGCSE', 'A LEVEL', 'OSSD', 'IELTS', 'Custom'];
  
  // Sort groups based on groupOrder, then any others
  const sortedGroups = Object.keys(groupedCountdowns).sort((a, b) => {
    const indexA = groupOrder.indexOf(a.toUpperCase());
    const indexB = groupOrder.indexOf(b.toUpperCase());
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
            <Timer className="h-8 w-8 text-[var(--primary)]" />
            Exam Countdowns
          </h1>
          <p className="text-[var(--foreground-secondary)] mt-2">Manage your upcoming exams and visualize remaining time.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/library/exams"
            className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-600 dark:text-amber-400 transition-all hover:bg-amber-500/20"
          >
            <BookMarked className="h-4 w-4" aria-hidden="true" />
            Browse Exams
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-glow)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            aria-label="Add a new custom countdown"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Custom
          </button>
        </div>
      </div>

      {sortedGroups.length === 0 ? (
        <EmptyState
          icon={Timer}
          heading="No Countdowns Yet"
          description="Keep track of your exam dates by adding your first countdown timer."
          actionLabel="Create Countdown"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-10">
          {sortedGroups.map(group => {
            const countdowns = groupedCountdowns[group];
            if (!countdowns || countdowns.length === 0) return null;

            return (
              <section key={group} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-[var(--foreground)] tracking-wide uppercase">{group}</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {countdowns.map(countdown => (
                    <CountdownCard 
                      key={countdown.id} 
                      countdown={countdown} 
                      onDelete={deleteCountdown} 
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <AddCountdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableExams={availableExams}
        onCreate={createCountdown}
      />
    </div>
  );
}
