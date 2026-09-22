'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { TimetableEvent } from '@/types/timetable';
import { formatHourShort } from '@/constants/timetable';
import { layoutOverlappingEvents } from '@/lib/timetable/layout';
import { cn } from '@/lib/utils';
import TimeBlock from './TimeBlock';
import { formatDateKey, isSameDay } from './task-utils';

const SLOT = 56;

export interface InlineSlot {
  date: string;
  time: string;
}

interface TimeGridProps {
  days: Date[];
  events: TimetableEvent[];
  isDragging?: boolean;
  selectedDate?: Date;
  inlineCreate?: InlineSlot | null;
  onSlotClick: (date: Date, time: string) => void;
  onEditEvent: (event: TimetableEvent) => void;
  onToggleComplete: (eventId: string) => void;
  onInlineSubmit: (title: string) => void;
  onInlineCancel: () => void;
  onInlineExpand: () => void;
  onDayHeaderClick?: (date: Date) => void;
}

function visibleHours(events: TimetableEvent[]): number[] {
  let start = 7;
  let end = 21;
  for (const event of events) {
    if (event.all_day || !event.start_time) continue;
    const startHour = new Date(event.start_time).getHours();
    const endDate = event.end_time ? new Date(event.end_time) : null;
    const endHour = endDate ? endDate.getHours() + (endDate.getMinutes() > 0 ? 0 : -1) : startHour;
    start = Math.min(start, startHour);
    end = Math.max(end, Math.max(startHour, endHour));
  }
  start = Math.max(0, start);
  end = Math.min(23, end);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function DroppableHour({
  date,
  hour,
  onClick,
}: {
  date: string;
  hour: number;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${date}-${hour}`,
    data: { date, hour },
  });
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className="absolute inset-x-0 cursor-pointer border-t border-border/70"
      style={{
        top: 0,
        height: SLOT,
        backgroundColor: isOver ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'transparent',
      }}
    />
  );
}

function SlotComposer({
  time,
  onSubmit,
  onCancel,
  onExpand,
}: {
  time: string;
  onSubmit: (title: string) => void;
  onCancel: () => void;
  onExpand: () => void;
}) {
  const [title, setTitle] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <form
      className="absolute inset-x-1 z-30 rounded-lg border-2 border-primary bg-background-card p-2 shadow-lg"
      style={{ top: 4 }}
      onSubmit={(formEvent) => {
        formEvent.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) onCancel();
        else onSubmit(trimmed);
      }}
      onClick={(click) => click.stopPropagation()}
    >
      <input
        ref={ref}
        value={title}
        onChange={(input) => setTitle(input.target.value)}
        onKeyDown={(keyEvent) => {
          if (keyEvent.key === 'Escape') onCancel();
        }}
        placeholder="Add a task"
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
      />
      <div className="mt-1 flex items-center justify-between text-[11px] text-foreground-muted">
        <span className="tabular-nums">{time}</span>
        <button type="button" className="font-medium text-primary" onClick={onExpand}>
          Details
        </button>
      </div>
    </form>
  );
}

export default function TimeGrid({
  days,
  events,
  selectedDate,
  inlineCreate,
  onSlotClick,
  onEditEvent,
  onToggleComplete,
  onInlineSubmit,
  onInlineCancel,
  onInlineExpand,
  onDayHeaderClick,
}: TimeGridProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const hours = useMemo(() => visibleHours(events), [events]);
  const startHour = hours[0] ?? 7;
  const columns = `3.25rem repeat(${days.length}, minmax(${days.length > 1 ? '5.5rem' : '0px'}, 1fr))`;

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const now = new Date();
    const hour = now.getHours();
    if (hour >= startHour) {
      node.scrollTop = Math.max(0, (hour - startHour) * SLOT - 48);
    }
  }, [startHour, days.length]);

  const byDay = useMemo(() => {
    const map = new Map<string, { allDay: TimetableEvent[]; timed: TimetableEvent[] }>();
    for (const day of days) map.set(formatDateKey(day), { allDay: [], timed: [] });
    for (const event of events) {
      const anchor = event.start_time || event.end_time;
      if (!anchor) continue;
      const key = formatDateKey(new Date(anchor));
      const bucket = map.get(key);
      if (!bucket) continue;
      if (event.all_day) bucket.allDay.push(event);
      else bucket.timed.push(event);
    }
    return map;
  }, [days, events]);

  return (
    <div ref={scrollerRef} className="h-full overflow-auto pb-24">
      <div style={{ minWidth: days.length > 1 ? 760 : undefined }}>
        {days.length > 1 && (
        <div
          className="sticky top-0 z-30 grid border-b border-border bg-background/95 backdrop-blur-sm"
          style={{ gridTemplateColumns: columns }}
        >
          <div className="sticky left-0 z-40 bg-background" />
          {days.map((day) => {
            const active = selectedDate ? isSameDay(day, selectedDate) : false;
            const isToday = isSameDay(day, today);
            return (
              <button
                key={formatDateKey(day)}
                type="button"
                onClick={() => onDayHeaderClick?.(day)}
                className={cn('flex flex-col items-center gap-0.5 py-2', onDayHeaderClick && 'cursor-pointer')}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
                  {day.toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums"
                  style={
                    active || (isToday && !selectedDate)
                      ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }
                      : isToday
                        ? { color: 'var(--primary)' }
                        : { color: 'var(--foreground)' }
                  }
                >
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>
        )}

        <div className="grid border-b border-border" style={{ gridTemplateColumns: columns }}>
          <div className="sticky left-0 z-20 bg-background px-1 py-2 text-right text-[10px] text-foreground-muted">All day</div>
          {days.map((day) => {
            const key = formatDateKey(day);
            const items = byDay.get(key)?.allDay ?? [];
            return (
              <div key={key} className="flex max-h-24 flex-col gap-1 overflow-y-auto border-l border-border/60 p-1">
                {items.map((event) => {
                  const color = event.color_code || '#3b82f6';
                  return (
                    <div key={event.id} className="flex items-center gap-0.5">
                      {event.event_source === 'user' && (
                        <button
                          type="button"
                          aria-label={event.is_completed ? `Mark ${event.title} not done` : `Mark ${event.title} done`}
                          className="flex h-6 w-6 shrink-0 items-center justify-center"
                          onClick={() => onToggleComplete(event.id)}
                        >
                          <span
                            className="flex h-3.5 w-3.5 items-center justify-center rounded-full border"
                            style={{
                              borderColor: color,
                              backgroundColor: event.is_completed ? color : 'transparent',
                            }}
                          />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditEvent(event)}
                        className={cn(
                          'min-w-0 flex-1 truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium',
                          event.is_completed && 'line-through opacity-50'
                        )}
                        style={{
                          backgroundColor: `color-mix(in srgb, ${color} 20%, var(--background-card))`,
                          color,
                        }}
                      >
                        {event.title}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="grid" style={{ gridTemplateColumns: columns }}>
          <div className="sticky left-0 z-20 bg-background">
            {hours.map((hour) => (
              <div key={hour} className="relative border-t border-transparent" style={{ height: SLOT }}>
                <span className="absolute right-1.5 top-0 -translate-y-1/2 text-[10px] tabular-nums text-foreground-muted">
                  {formatHourShort(hour)}
                </span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const key = formatDateKey(day);
            const timed = byDay.get(key)?.timed ?? [];
            const laidOut = layoutOverlappingEvents(timed);
            const selected = selectedDate ? isSameDay(day, selectedDate) : isSameDay(day, today);
            const showNow = isSameDay(day, today);
            const now = new Date();
            const nowTop = ((now.getHours() + now.getMinutes() / 60) - startHour) * SLOT;
            const composerHour = inlineCreate?.date === key ? Number(inlineCreate.time.split(':')[0]) : null;

            return (
              <div
                key={key}
                className="relative border-l border-border/60"
                style={{
                  height: hours.length * SLOT,
                  backgroundColor: selected ? 'color-mix(in srgb, var(--primary) 5%, transparent)' : undefined,
                }}
              >
                {hours.map((hour, index) => (
                  <div key={hour} className="absolute inset-x-0" style={{ top: index * SLOT, height: SLOT }}>
                    <DroppableHour
                      date={key}
                      hour={hour}
                      onClick={() => onSlotClick(day, `${String(hour).padStart(2, '0')}:00`)}
                    />
                    {composerHour === hour && inlineCreate && (
                      <SlotComposer
                        time={inlineCreate.time}
                        onSubmit={onInlineSubmit}
                        onCancel={onInlineCancel}
                        onExpand={onInlineExpand}
                      />
                    )}
                  </div>
                ))}

                {laidOut.map((event) => {
                  const start = event.start_time ? new Date(event.start_time) : null;
                  if (!start) return null;
                  const startMins = start.getHours() * 60 + start.getMinutes();
                  const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 60 * 60 * 1000);
                  const durationMins = Math.max(20, (end.getTime() - start.getTime()) / 60000);
                  const top = ((startMins / 60) - startHour) * SLOT;
                  const height = (durationMins / 60) * SLOT;
                  return (
                    <TimeBlock
                      key={event.id}
                      event={event}
                      topPx={top}
                      heightPx={height}
                      leftPct={event.leftPct}
                      widthPct={event.widthPct}
                      draggable={!event.is_recurring}
                      onEdit={onEditEvent}
                      onToggleComplete={onToggleComplete}
                    />
                  );
                })}

                {showNow && nowTop >= 0 && nowTop <= hours.length * SLOT && (
                  <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: nowTop }}>
                    <div className="relative border-t-2 border-red-500">
                      <span className="absolute -left-1 -top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { SLOT as TIME_GRID_SLOT };
