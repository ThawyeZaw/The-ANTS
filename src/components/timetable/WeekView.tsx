'use client';

import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { TimetableEvent } from '@/types/timetable';
import {
  GRID_HOURS,
  GRID_START_HOUR,
  HOUR_SLOT_HEIGHT,
  formatHourShort,
  DAY_NAMES_SHORT,
} from '@/constants/timetable';
import { formatDateLocal } from '@/hooks/useTimetable';
import { layoutOverlappingEvents } from '@/lib/timetable/layout';
import TimeBlock from './TimeBlock';

interface WeekViewProps {
  weekStart: Date;
  events: TimetableEvent[];
  slotHeight?: number;
  isDragging?: boolean;
  onSlotClick: (date: Date, time: string) => void;
  onEditEvent: (event: TimetableEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleComplete: (eventId: string) => void;
}

function getEventTopPx(event: TimetableEvent, sh: number): number {
  if (!event.start_time) return 0;
  const d = new Date(event.start_time);
  const hours = d.getHours() + d.getMinutes() / 60;
  return (hours - GRID_START_HOUR) * sh;
}

function getEventHeightPx(event: TimetableEvent, sh: number): number {
  if (!event.start_time || !event.end_time) return sh;
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Math.max(durationHours * sh, 24);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function DroppableSlot({ date, hour, sh, onClick, isDragging }: {
  date: Date;
  hour: number;
  sh: number;
  onClick: () => void;
  isDragging?: boolean;
}) {
  const dateStr = formatDateLocal(date);
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${dateStr}-${hour}`,
    data: { date: dateStr, hour },
  });

  return (
    <div
      ref={setNodeRef}
      className="absolute left-0 right-0 cursor-pointer transition-colors"
      style={{
        top: (hour - GRID_START_HOUR) * sh,
        height: sh,
        borderTop: '1px solid var(--border)',
        backgroundColor: isOver ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'transparent',
      }}
      onClick={onClick}
    >
      {/* Snap guide lines at 15-min intervals (shown during drag) */}
      {isDragging && (
        <>
          <div className="absolute left-0 right-0 border-t border-dashed"
            style={{ top: `${25}%`, borderColor: 'color-mix(in srgb, var(--primary) 25%, transparent)' }} />
          <div className="absolute left-0 right-0 border-t border-dashed"
            style={{ top: `${50}%`, borderColor: 'color-mix(in srgb, var(--primary) 25%, transparent)' }} />
          <div className="absolute left-0 right-0 border-t border-dashed"
            style={{ top: `${75}%`, borderColor: 'color-mix(in srgb, var(--primary) 25%, transparent)' }} />
        </>
      )}
    </div>
  );
}

export default function WeekView({
  weekStart,
  events,
  slotHeight: sh = HOUR_SLOT_HEIGHT,
  isDragging = false,
  onSlotClick,
  onEditEvent,
  onDeleteEvent,
  onToggleComplete,
}: WeekViewProps) {
  const today = new Date();

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, { timed: TimetableEvent[]; allDay: TimetableEvent[]; deadline: TimetableEvent[] }> = {};

    for (const day of weekDays) {
      const key = formatDateLocal(day);
      map[key] = { timed: [], allDay: [], deadline: [] };
    }

    for (const event of events) {
      const anchor = event.start_time || event.end_time;
      if (!anchor && !event.all_day) continue;

      const dayDate = anchor ? new Date(anchor) : null;

      for (const day of weekDays) {
        const key = formatDateLocal(day);
        if (event.all_day) {
          if (!dayDate || isSameDay(dayDate, day)) {
            map[key]?.allDay.push(event);
          }
        } else if (!event.start_time && event.end_time) {
          if (dayDate && isSameDay(dayDate, day)) map[key]?.deadline.push(event);
        } else if (event.start_time) {
          const d = new Date(event.start_time);
          if (isSameDay(d, day)) map[key]?.timed.push(event);
        }
      }
    }

    return map;
  }, [events, weekDays]);

  const layeredEventsByDay = useMemo(() => {
    const map: Record<string, ReturnType<typeof layoutOverlappingEvents>> = {};
    for (const day of weekDays) {
      const key = formatDateLocal(day);
      const dayEvents = eventsByDay[key]?.timed ?? [];
      map[key] = layoutOverlappingEvents(dayEvents);
    }
    return map;
  }, [eventsByDay, weekDays]);

  const totalGridHeight = GRID_HOURS.length * sh;
  const nowTop = ((today.getHours() + today.getMinutes() / 60) - GRID_START_HOUR) * sh;

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Day Headers */}
      <div
        className="flex border-b sticky top-0 z-20 backdrop-blur-sm"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--background) 92%, transparent)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="w-14 shrink-0 border-r" style={{ borderColor: 'var(--border)' }} />

        {weekDays.map((day, i) => {
          const key = formatDateLocal(day);
          const dayEvents = eventsByDay[key];
          const isToday = isSameDay(day, today);
          const allDay = dayEvents?.allDay ?? [];
          const deadline = dayEvents?.deadline ?? [];

          return (
            <div
              key={i}
              className="flex-1 min-w-0 border-r last:border-r-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="px-1 py-2 text-center">
                <p className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                  {DAY_NAMES_SHORT[day.getDay()]}
                </p>
                <div
                  className="text-sm font-bold mx-auto w-7 h-7 flex items-center justify-center rounded-full mt-0.5"
                  style={{
                    color: isToday ? 'var(--foreground)' : 'var(--foreground-muted)',
                    backgroundColor: isToday ? 'var(--primary)' : 'transparent',
                  }}
                >
                  {day.getDate()}
                </div>
              </div>

              {(allDay.length > 0 || deadline.length > 0) && (
                <div className="px-1 pb-1 space-y-0.5 border-t" style={{ borderColor: 'var(--border)' }}>
                  {[...allDay, ...deadline].slice(0, 2).map(e => (
                    <TimeBlock
                      key={e.id}
                      event={e}
                      compact
                      onEdit={onEditEvent}
                      onDelete={onDeleteEvent}
                      onToggleComplete={onToggleComplete}
                    />
                  ))}
                  {(allDay.length + deadline.length) > 2 && (
                    <p className="text-[10px] text-foreground-muted px-1">
                      +{allDay.length + deadline.length - 2} more
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable Grid */}
      <div className="flex flex-1 overflow-y-auto">
        <div
          className="w-16 shrink-0 relative border-r pt-2.5"
          style={{ height: totalGridHeight + 10, borderColor: 'var(--border)' }}
        >
          {GRID_HOURS.map(hour => (
            <div
              key={hour}
              className="absolute right-3 pl-1.5 text-[9px] text-foreground-muted tabular-nums leading-none"
              style={{ top: (hour - GRID_START_HOUR) * sh - 5 }}
            >
              {formatHourShort(hour)}
            </div>
          ))}
        </div>

        {weekDays.map((day, i) => {
          const key = formatDateLocal(day);
          const isToday = isSameDay(day, today);
          const layeredEvents = layeredEventsByDay[key] ?? [];

          return (
            <div
              key={i}
              className="flex-1 min-w-0 relative border-r last:border-r-0"
              style={{
                height: totalGridHeight,
                borderColor: 'var(--border)',
                backgroundColor: isToday ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
              }}
            >
              {GRID_HOURS.map(hour => (
                <DroppableSlot
                  key={hour}
                  date={day}
                  hour={hour}
                  sh={sh}
                  isDragging={isDragging}
                  onClick={() => {
                    const time = `${String(hour).padStart(2, '0')}:00`;
                    onSlotClick(day, time);
                  }}
                />
              ))}

              {isToday && nowTop > 0 && nowTop < totalGridHeight && (
                <div
                  className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
                  style={{ top: nowTop }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary -ml-0.5 shrink-0" />
                  <div className="flex-1 h-px bg-primary opacity-60" />
                </div>
              )}

              {layeredEvents.map(event => (
                <TimeBlock
                  key={event.id}
                  event={event}
                  draggable
                  heightPx={getEventHeightPx(event, sh)}
                  topPx={getEventTopPx(event, sh)}
                  leftPct={event.leftPct}
                  widthPct={event.widthPct}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
                  onToggleComplete={onToggleComplete}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
