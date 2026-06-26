'use client';

import React, { useState } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { CountdownCard } from './CountdownCard';
import { AddCountdownModal } from './AddCountdownModal';
import { Plus, Timer } from 'lucide-react';

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
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Timer className="h-8 w-8 text-blue-500" />
            Exam Countdowns
          </h1>
          <p className="text-gray-400 mt-2">Manage your upcoming exams and visualize remaining time.</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
          aria-label="Add a new exam countdown"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Add Countdown
        </button>
      </div>

      {sortedGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 py-20 text-center backdrop-blur-md">
          <Timer className="h-16 w-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No Countdowns Yet</h3>
          <p className="text-gray-400 max-w-sm mb-6">Keep track of your exam dates by adding your first countdown timer.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            aria-label="Create your first exam countdown"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Countdown
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedGroups.map(group => {
            const countdowns = groupedCountdowns[group];
            if (!countdowns || countdowns.length === 0) return null;

            return (
              <section key={group} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white tracking-wide uppercase">{group}</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
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
