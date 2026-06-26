'use client';

import React, { useState } from 'react';
import { Exam } from '@/types';
import { X } from 'lucide-react';

interface AddCountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableExams: Exam[];
  onCreate: (data: {
    exam_id?: string;
    custom_title?: string;
    target_date?: string;
    priority_indicator?: string;
    qualification_group?: string;
  }) => void;
}

export function AddCountdownModal({ isOpen, onClose, availableExams, onCreate }: AddCountdownModalProps) {
  const [tab, setTab] = useState<'library' | 'custom'>('library');
  
  // Form states
  const [selectedExamId, setSelectedExamId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('09:00');
  const [priority, setPriority] = useState('medium');
  const [group, setGroup] = useState('Custom');

  if (!isOpen) return null;

  const isPastDate = targetDate && targetTime ? new Date(`${targetDate}T${targetTime}`).getTime() < Date.now() : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'library') {
      if (!selectedExamId) return;
      // When selected from library, group is typically set to the exam board/qualification, we'll ask user or default to Custom
      // Let's add a group selector even for library if they want, but default to 'IGCSE' for test.
      // Actually we'll just use the form's group.
      onCreate({
        exam_id: selectedExamId,
        priority_indicator: priority,
        qualification_group: group,
      });
    } else {
      if (!customTitle || !targetDate) return;
      onCreate({
        custom_title: customTitle,
        target_date: new Date(`${targetDate}T${targetTime}`).toISOString(),
        priority_indicator: priority,
        qualification_group: group,
      });
    }
    
    // Reset and close
    setSelectedExamId('');
    setCustomTitle('');
    setTargetDate('');
    setTargetTime('09:00');
    setPriority('medium');
    setGroup('Custom');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Exam Countdown</h2>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1 text-gray-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-6 flex rounded-lg bg-black/40 p-1">
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              tab === 'library' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setTab('library')}
            aria-label="Select from library exams"
          >
            Library Exam
          </button>
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              tab === 'custom' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setTab('custom')}
            aria-label="Create a custom countdown"
          >
            Custom Countdown
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'library' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Select Exam</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">-- Choose an Exam --</option>
                {availableExams.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} ({exam.exam_series})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Physics Mock"
                  className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-300">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className={`w-full rounded-lg border bg-black/40 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark] ${isPastDate ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500'}`}
                    required
                    aria-describedby={isPastDate ? "date-error" : undefined}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-300">Time</label>
                  <input
                    type="time"
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    className={`w-full rounded-lg border bg-black/40 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark] ${isPastDate ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500'}`}
                    required
                  />
                </div>
              </div>
              {isPastDate && (
                <p id="date-error" className="text-sm text-red-400" role="alert">
                  Warning: This date and time is in the past!
                </p>
              )}
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Qualification Group</label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="IGCSE">IGCSE</option>
              <option value="A LEVEL">A LEVEL</option>
              <option value="OSSD">OSSD</option>
              <option value="IELTS">IELTS</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
              aria-label="Cancel and close modal"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
              aria-label="Submit and add countdown"
            >
              Add Countdown
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
