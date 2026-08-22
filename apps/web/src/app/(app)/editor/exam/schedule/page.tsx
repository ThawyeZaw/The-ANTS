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
        <h1 className="text-3xl font-bold text-foreground">Exam Board Schedule</h1>
        <p className="mt-2 text-foreground-secondary">
          Manage official start times, session types, and durations for this exam syllabus.
        </p>
      </div>

      <div className="bg-background-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Schedule Configuration</h2>
            <p className="text-sm text-foreground-muted">Set the properties for the upcoming exam paper.</p>
          </div>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Paper Code
              </label>
              <input
                type="text"
                placeholder="e.g. 4MA1/1F or 9709/12"
                className="w-full px-4 py-2 bg-background-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg outline-none text-foreground transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                placeholder="120"
                className="w-full px-4 py-2 bg-background-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg outline-none text-foreground transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Session Type
              </label>
              <select
                className="w-full px-4 py-2 bg-background-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg outline-none text-foreground appearance-none transition-all"
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

          <div className="pt-6 mt-6 border-t border-border flex justify-end">
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-sm font-medium transition-colors"
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
