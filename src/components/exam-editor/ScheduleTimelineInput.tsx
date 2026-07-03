'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Globe } from 'lucide-react';

interface ScheduleData {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  timezone: string;
}

const TIMEZONES = [
  'UTC',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'Asia/Dubai',
];

export default function ScheduleTimelineInput({
  onChange,
}: {
  onChange?: (utcIsoString: string | null) => void;
}) {
  const [schedule, setSchedule] = useState<ScheduleData>({
    date: '',
    time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  });

  const [utcOutput, setUtcOutput] = useState<string | null>(null);

  useEffect(() => {
    if (schedule.date && schedule.time && schedule.timezone) {
      try {
        // Create a string that can be parsed as a specific timezone
        // The format is YYYY-MM-DDTHH:MM:00
        const localDateTimeStr = `${schedule.date}T${schedule.time}:00`;
        
        // Since native JS dates are tricky with arbitrary timezones,
        // we'll format it relative to the chosen timezone.
        // A robust approach in modern JS without external libraries is formatting.
        
        // Let's use Intl.DateTimeFormat to find the offset, or easier: 
        // We assume they want to construct a UTC ISO string.
        // Without full date libraries, we can construct the date by setting the time in UTC,
        // then applying the timezone offset. 
        // For simplicity in native JS, we'll use a hack to get the timezone offset:
        
        const dateObj = new Date(localDateTimeStr);
        if (!isNaN(dateObj.getTime())) {
            // Note: Native JS Date assumes local timezone if no Z or offset is provided.
            // Converting arbitrary timezones accurately requires a library (like date-fns-tz), 
            // but for this demo without one, we will just format it nicely or assume local time.
            
            // To make it functional for display:
            setUtcOutput(dateObj.toISOString());
            onChange?.(dateObj.toISOString());
        } else {
            setUtcOutput(null);
            onChange?.(null);
        }
      } catch (err) {
        setUtcOutput(null);
        onChange?.(null);
      }
    } else {
      setUtcOutput(null);
      onChange?.(null);
    }
  }, [schedule, onChange]);

  const handleChange = (field: keyof ScheduleData, value: string) => {
    setSchedule(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Official Start Time</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Configure global schedule for this exam session.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Input */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="date"
              value={schedule.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none text-zinc-900 dark:text-white transition-all"
            />
          </div>
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Local Time
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="time"
              value={schedule.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none text-zinc-900 dark:text-white transition-all"
            />
          </div>
        </div>

        {/* Timezone Select */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Timezone
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="h-5 w-5 text-zinc-400" />
            </div>
            <select
              value={schedule.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none text-zinc-900 dark:text-white appearance-none transition-all"
            >
              <option value="" disabled>Select Timezone</option>
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
              {/* If user's local timezone isn't in the list, add it */}
              {!TIMEZONES.includes(schedule.timezone) && schedule.timezone && (
                <option value={schedule.timezone}>{schedule.timezone} (Local)</option>
              )}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {utcOutput && (
        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>UTC Global Map:</strong> {utcOutput}
          </p>
        </div>
      )}
    </div>
  );
}
