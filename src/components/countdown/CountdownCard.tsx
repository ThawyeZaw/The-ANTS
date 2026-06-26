'use client';

import React from 'react';
import { CountdownWithTime } from '@/hooks/useCountdown';
import { Trash2, Clock, Calendar, ArrowUpCircle, MinusCircle, ArrowDownCircle } from 'lucide-react';

interface CountdownCardProps {
  countdown: CountdownWithTime;
  onDelete: (id: string) => void;
}

export function CountdownCard({ countdown, onDelete }: CountdownCardProps) {
  const { custom_title, target_date, priority_indicator, timeLeft } = countdown;

  const priorityColors = {
    high: 'border-red-500 bg-red-500/10 text-red-500',
    medium: 'border-amber-500 bg-amber-500/10 text-amber-500',
    low: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
  };
  
  const priorityStyle = priorityColors[priority_indicator as keyof typeof priorityColors] || priorityColors.medium;

  const formattedDate = target_date 
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(target_date))
    : 'Unknown Date';

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-white/20">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{custom_title || 'Untitled Exam'}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div 
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize ${priorityStyle}`}
            title={`${priority_indicator || 'medium'} priority exam`}
          >
            {priority_indicator === 'high' && <ArrowUpCircle className="h-3.5 w-3.5" aria-hidden="true" />}
            {priority_indicator === 'medium' && <MinusCircle className="h-3.5 w-3.5" aria-hidden="true" />}
            {priority_indicator === 'low' && <ArrowDownCircle className="h-3.5 w-3.5" aria-hidden="true" />}
            {priority_indicator || 'Medium'} <span className="sr-only">Priority</span>
          </div>
          <button
            onClick={() => onDelete(countdown.id)}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
            title="Delete countdown"
            aria-label={`Delete ${custom_title || 'Untitled Exam'} countdown`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg bg-black/40 p-4">
        {timeLeft.isPast ? (
          <div className="flex w-full items-center justify-center gap-2 text-emerald-400">
            <Clock className="h-5 w-5" />
            <span className="font-semibold tracking-wide">Exam time has passed!</span>
          </div>
        ) : (
          <div className="flex w-full justify-around text-center">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white font-mono">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400 mt-1">Days</span>
            </div>
            <div className="text-2xl font-bold text-gray-600 font-mono self-start mt-1">:</div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white font-mono">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400 mt-1">Hours</span>
            </div>
            <div className="text-2xl font-bold text-gray-600 font-mono self-start mt-1">:</div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400 mt-1">Mins</span>
            </div>
            <div className="text-2xl font-bold text-gray-600 font-mono self-start mt-1">:</div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-cyan-400 font-mono">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-xs font-medium uppercase tracking-wider text-cyan-400/70 mt-1">Secs</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
