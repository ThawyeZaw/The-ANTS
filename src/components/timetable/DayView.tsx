'use client';

import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { TimetableEvent } from '@/types/timetable';
import {
  GRID_HOURS,
  GRID_START_HOUR,
  HOUR_SLOT_HEIGHT,
  SNAP_MINUTES,
  formatHour,
  DAY_NAMES_FULL,
} from '@/constants/timetable';
import { formatDateLocal } from '@/hooks/useTimetable';
import { layoutOverlappingEvents } from '@/lib/timetable/layout';
import TimeBlock from './TimeBlock';

interface DayViewProps {
  currentDate: Date;
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
  return Math.max(durationHours * sh, 28);
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

export default function DayView({
  currentDate,
  events,
  slotHeight: sh = HOUR_SLOT_HEIGHT,
  isDragging = false,
  onSlotClick,
  onEditEvent,
  onDeleteEvent,
  onToggleComplete,
}: DayViewProps) {
  const today = new Date();
  const isToday =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getDate() === today.getDate();

  const { timedEvents, allDayEvents, deadlineEvents } = useMemo(() => {
    const timed: TimetableEvent[] = [];
    const allDay: TimetableEvent[] = [];
    const deadline: TimetableEvent[] = [];

    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    for (const event of events) {
      if (event.all_day) {
        allDay.push(event);
      } else if (!event.start_time && event.end_time) {
        const d = new Date(event.end_time);
        if (d >= dayStart && d <= dayEnd) deadline.push(event);
      } else if (event.start_time) {
        const d = new Date(event.start_time);
        if (d >= dayStart && d <= dayEnd) timed.push(event);
      }
    }

    return { timedEvents: timed, allDayEvents: allDay, deadlineEvents: deadline };
  }, [events, currentDate]);

  const layeredTimedEvents = useMemo(
    () => layoutOverlappingEvents(timedEvents),
    [timedEvents]
  );

  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const nowTopPx = ((nowMinutes / 60) - GRID_START_HOUR) * sh;
  const totalGridHeight = GRID_HOURS.length * sh;

  return (
    <div className="flex flex-col h-full">
      {/* Day Header */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="text-center">
          <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
            {DAY_NAMES_FULL[currentDate.getDay()]}
          </p>
          <div
            className="text-2xl font-bold mt-0.5 w-10 h-10 rounded-full flex items-center justify-center mx-auto"
            style={{
              color: isToday ? 'var(--foreground)' : 'var(--foreground-muted)',
              backgroundColor: isToday ? 'var(--primary)' : 'transparent',
            }}
          >
            {currentDate.getDate()}
          </div>
        </div>

        {(allDayEvents.length > 0 || deadlineEvents.length > 0) && (
          <div className="flex-1 flex flex-col gap-1 max-h-20 overflow-y-auto">
            {allDayEvents.map(e => (
              <TimeBlock
                key={e.id}
                event={e}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
                onToggleComplete={onToggleComplete}
              />
            ))}
            {deadlineEvents.map(e => (
              <TimeBlock
                key={e.id}
                event={e}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Time Grid */}
      <div className="flex flex-1 overflow-y-auto">
        <div className="w-16 shrink-0 relative" style={{ height: totalGridHeight }}>
          {GRID_HOURS.map(hour => (
            <div
              key={hour}
              className="absolute right-3 text-[10px] text-foreground-muted tabular-nums"
              style={{ top: (hour - GRID_START_HOUR) * sh - 7 }}
            >
              {formatHour(hour)}
            </div>
          ))}
        </div>

        <div
          className="flex-1 relative border-l"
          style={{
            height: totalGridHeight,
            borderColor: 'var(--border)',
          }}
        >
          {GRID_HOURS.map(hour => (
            <DroppableSlot
              key={hour}
              date={currentDate}
              hour={hour}
              sh={sh}
              isDragging={isDragging}
              onClick={() => {
                const time = `${String(hour).padStart(2, '0')}:00`;
                onSlotClick(currentDate, time);
              }}
            />
          ))}

          {isToday && nowTopPx > 0 && nowTopPx < totalGridHeight && (
            <div
              className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
              style={{ top: nowTopPx }}
            >
              <div className="w-2 h-2 rounded-full bg-primary -ml-1" />
              <div className="flex-1 h-px bg-primary opacity-70" />
            </div>
          )}

          {layeredTimedEvents.map(event => (
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
      </div>
    </div>
  );
}
