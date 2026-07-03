import React from 'react';
import ScheduleTimelineInput from '@/components/exam-editor/ScheduleTimelineInput';
import { Save, CalendarDays } from 'lucide-react';

export const metadata = {
  title: 'Exam Schedule | Editor',
};

export default function ExamSchedulePage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Exam Board Schedule</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Manage official start times, session types, and durations for this exam syllabus.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Schedule Configuration</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Set the properties for the upcoming exam paper.</p>
          </div>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Paper Code
              </label>
              <input
                type="text"
                placeholder="e.g. 4MA1/1F or 9709/12"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none text-zinc-900 dark:text-white transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                placeholder="120"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none text-zinc-900 dark:text-white transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Session Type
              </label>
              <select
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none text-zinc-900 dark:text-white appearance-none transition-all"
              >
                <option value="AM">Morning (AM)</option>
                <option value="PM">Afternoon (PM)</option>
                <option value="EV">Evening (EV)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            {/* The global time zone component */}
            <ScheduleTimelineInput />
          </div>

          <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
