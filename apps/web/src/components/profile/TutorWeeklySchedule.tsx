'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Tutor Weekly Schedule Timetable (Sunday to Saturday)
// Displays read-only weekly slots for visitors or editable grid for tutors.
// Slot Options: Taken / Not Available, Flexible, Available / Free.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SlotStatus = 'available' | 'flexible' | 'unavailable';

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];

export const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
];

export type WeeklyAvailability = Record<string, Record<string, SlotStatus>>;

interface TutorWeeklyScheduleProps {
  availability?: WeeklyAvailability | null;
  isEditable?: boolean;
  onSlotChange?: (day: DayOfWeek, time: string, newStatus: SlotStatus) => void;
  onSelectSlot?: (slot: { day: DayOfWeek; time: string; status: SlotStatus }) => void;
}

const STATUS_CONFIG: Record<
  SlotStatus,
  { label: string; bg: string; border: string; text: string; icon: any; desc: string }
> = {
  available: {
    label: 'Available / Free',
    bg: 'bg-emerald-500/15 hover:bg-emerald-500/25',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    text: 'text-emerald-500',
    icon: CheckCircle2,
    desc: 'Open for booking new students',
  },
  flexible: {
    label: 'Flexible',
    bg: 'bg-amber-500/15 hover:bg-amber-500/25',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    text: 'text-amber-500',
    icon: HelpCircle,
    desc: 'Subject to schedule arrangement',
  },
  unavailable: {
    label: 'Taken / Busy',
    bg: 'bg-background-secondary/40 hover:bg-background-secondary/60 opacity-60',
    border: 'border-border/40',
    text: 'text-foreground-muted',
    icon: XCircle,
    desc: 'Booked class or unavailable',
  },
};

export default function TutorWeeklySchedule({
  availability = {},
  isEditable = false,
  onSlotChange,
  onSelectSlot,
}: TutorWeeklyScheduleProps) {
  const getSlotStatus = (day: DayOfWeek, time: string): SlotStatus => {
    return availability?.[day]?.[time] ?? 'unavailable';
  };

  const handleSlotClick = (day: DayOfWeek, time: string) => {
    const current = getSlotStatus(day, time);

    if (isEditable && onSlotChange) {
      // Cycle through states: unavailable -> flexible -> available -> unavailable
      const nextStatus: SlotStatus =
        current === 'unavailable'
          ? 'available'
          : current === 'available'
          ? 'flexible'
          : 'unavailable';
      onSlotChange(day, time, nextStatus);
    } else if (!isEditable && onSelectSlot && current !== 'unavailable') {
      onSelectSlot({ day, time, status: current });
    }
  };

  return (
    <div className="space-y-4">
      {/* Legend and Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-background-secondary/40 border border-border">
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>
            {isEditable
              ? 'Click any slot to cycle between Available, Flexible, and Taken.'
              : 'Click any Available or Flexible slot to inquire for that specific time.'}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {(['available', 'flexible', 'unavailable'] as SlotStatus[]).map((status) => {
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            return (
              <div key={status} className="flex items-center gap-1.5 text-xs font-medium">
                <span className={cn('w-3 h-3 rounded-md border flex items-center justify-center', cfg.bg, cfg.border)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', cfg.text)} />
                </span>
                <span className="text-foreground-muted">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <div className="bg-background-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-center">
            <thead>
              <tr className="bg-background-secondary/60 border-b border-border text-xs font-semibold text-foreground-muted">
                <th className="py-3 px-2 w-20 text-left pl-4 font-mono">Time</th>
                {DAYS_OF_WEEK.map((day) => (
                  <th key={day} className="py-3 px-2 font-medium">
                    <span className="block text-foreground">{day.slice(0, 3)}</span>
                    <span className="text-[10px] text-foreground-muted font-normal hidden sm:inline">
                      {day}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-xs font-mono">
              {TIME_SLOTS.map((time) => (
                <tr key={time} className="hover:bg-background-secondary/20 transition-colors">
                  <td className="py-2.5 px-2 text-left pl-4 text-foreground-muted font-semibold text-[11px] select-none">
                    {time}
                  </td>
                  {DAYS_OF_WEEK.map((day) => {
                    const status = getSlotStatus(day, time);
                    const cfg = STATUS_CONFIG[status];
                    const isClickable = isEditable || status !== 'unavailable';

                    return (
                      <td key={day} className="p-1">
                        <button
                          type="button"
                          onClick={() => handleSlotClick(day, time)}
                          disabled={!isClickable}
                          title={`${day} at ${time}: ${cfg.label}`}
                          className={cn(
                            'w-full py-2 px-1 rounded-xl border text-[11px] font-semibold transition-all select-none',
                            cfg.bg,
                            cfg.border,
                            cfg.text,
                            isClickable ? 'cursor-pointer hover:scale-102 active:scale-96 shadow-2xs' : 'cursor-default'
                          )}
                        >
                          <span className="capitalize text-[10px]">
                            {status === 'available' ? 'Free' : status === 'flexible' ? 'Flex' : '—'}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
