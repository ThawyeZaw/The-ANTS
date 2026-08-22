'use client';

import React, { useMemo } from 'react';
import type { TimetableEvent } from '@/types/timetable';
import { DAY_NAMES_SHORT } from '@/constants/timetable';
import { formatDateLocal } from '@/hooks/useTimetable';
import TimeBlock from './TimeBlock';

interface MonthViewProps {
  currentDate: Date;
  events: TimetableEvent[];
  zoomLevel?: number;
  onDayClick: (date: Date) => void;
  onEditEvent: (event: TimetableEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleComplete: (eventId: string) => void;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Build a 6-row calendar grid anchored to the given month */
function buildCalendarGrid(month: Date): Date[][] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // Monday-start: offset 0=Mon, 6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;

  const grid: Date[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(firstDay);
    d.setDate(1 - startOffset + i);
    grid.push(d);
  }

  // Group into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }
  return weeks;
}

const MAX_VISIBLE_EVENTS = 3;

export default function MonthView({
  currentDate,
  events,
  zoomLevel = 100,
  onDayClick,
  onEditEvent,
  onDeleteEvent,
  onToggleComplete,
}: MonthViewProps) {
  const today = new Date();
  const weeks = useMemo(() => buildCalendarGrid(currentDate), [currentDate]);

  // Group events by date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, TimetableEvent[]> = {};
    for (const event of events) {
      const anchor = event.start_time || event.end_time;
      if (!anchor && !event.all_day) continue;

      const d = anchor ? new Date(anchor) : null;
      const key = d ? formatDateLocal(d) : null;
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(event);
      }
    }
    return map;
  }, [events]);

  const scale = zoomLevel / 100;
  const isZoomed = zoomLevel !== 100;

  return (
    <div className="flex flex-col h-full">
      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}>
        {DAY_NAMES_SHORT.slice(1).concat(DAY_NAMES_SHORT[0]).map(day => (
          <div
            key={day}
            className="py-2 text-center text-[10px] font-semibold text-foreground-muted uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className="flex-1 grid"
        style={{
          gridTemplateRows: `repeat(${weeks.length}, 1fr)`,
          transform: isZoomed ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
          width: isZoomed ? `${100 / scale}%` : undefined,
          height: isZoomed ? `${100 / scale}%` : undefined,
        }}
      >
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7" style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 50%, transparent)' }}>
            {week.map((day, di) => {
              const dateKey = formatDateLocal(day);
              const dayEvents = eventsByDate[dateKey] ?? [];
              const isToday = isSameDay(day, today);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
              const overflow = dayEvents.length - MAX_VISIBLE_EVENTS;

              return (
                <div
                  key={di}
                  id={`month-day-${dateKey}`}
                  className="relative flex flex-col p-1 cursor-pointer border-r last:border-r-0 transition-colors hover:bg-white/[0.02] group"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)',
                    minHeight: 64,
                    backgroundColor: isToday ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'transparent',
                    opacity: isCurrentMonth ? 1 : 0.35,
                  }}
                  onClick={() => onDayClick(day)}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                      style={{
                        color: isToday ? 'white' : isCurrentMonth ? 'var(--foreground)' : 'var(--foreground-muted)',
                        backgroundColor: isToday ? 'var(--primary)' : 'transparent',
                      }}
                    >
                      {day.getDate()}
                    </span>

                    {/* Hover add button */}
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground-muted hover:text-primary text-xs rounded"
                      onClick={e => {
                        e.stopPropagation();
                        onDayClick(day);
                      }}
                      title="Add event"
                    >
                      +
                    </button>
                  </div>

                  {/* Event chips */}
                  <div className="space-y-0.5 overflow-hidden flex-1">
                    {visibleEvents.map(event => (
                      <div key={event.id} onClick={e => { e.stopPropagation(); onEditEvent(event); }}>
                        <TimeBlock
                          event={event}
                          compact
                          onEdit={onEditEvent}
                          onDelete={onDeleteEvent}
                          onToggleComplete={onToggleComplete}
                        />
                      </div>
                    ))}
                    {overflow > 0 && (
                      <p className="text-[10px] text-foreground-muted pl-1">+{overflow} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
