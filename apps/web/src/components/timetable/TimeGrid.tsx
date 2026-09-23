'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { TimetableEvent } from '@/types/timetable';
import { formatHourShort } from '@/constants/timetable';
import { layoutOverlappingEvents } from '@/lib/timetable/layout';
import { cn } from '@/lib/utils';
import TimeBlock from './TimeBlock';
import { formatDateKey, isSameDay } from './task-utils';

export const TIME_GRID_SLOT = 56;

export interface InlineSlot {
  date: string;
  time: string;
}

export type GridEditor =
  | { kind: 'create'; date: string; time?: string; allDay: boolean; title?: string }
  | { kind: 'edit'; event: TimetableEvent };

interface TimeGridProps {
  days: Date[];
  events: TimetableEvent[];
  isDragging?: boolean;
  selectedDate?: Date;
  slotHeight?: number;
  inlineCreate?: InlineSlot | null;
  onSlotClick: (date: Date, time: string) => void;
  onEditEvent: (event: TimetableEvent) => void;
  onToggleComplete: (eventId: string) => void;
  onInlineSubmit: (title: string) => void;
  onInlineCancel: () => void;
  onInlineExpand: (title: string) => void;
  onDayHeaderClick?: (date: Date) => void;
  editor?: GridEditor | null;
  renderEditor?: () => ReactNode;
}

/** Full day stays on the grid. The view opens at 8:00 so 8 AM–8 PM fills the screen. */
const DAY_HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const DEFAULT_VIEW_HOUR = 8;

function DroppableHour({
  date,
  hour,
  height,
  onClick,
}: {
  date: string;
  hour: number;
  height: number;
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
        height,
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
  onExpand: (title: string) => void;
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
        <button type="button" className="font-medium text-primary" onClick={() => onExpand(title)}>
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
  slotHeight = TIME_GRID_SLOT,
  inlineCreate,
  onSlotClick,
  onEditEvent,
  onToggleComplete,
  onInlineSubmit,
  onInlineCancel,
  onInlineExpand,
  onDayHeaderClick,
  editor = null,
  renderEditor,
}: TimeGridProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const hours = DAY_HOURS;
  const startHour = 0;
  const columns = `3.25rem repeat(${days.length}, minmax(${days.length > 1 ? '5.5rem' : '0px'}, 1fr))`;

  const dayKey = days.map((day) => formatDateKey(day)).join('|');
  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = DEFAULT_VIEW_HOUR * slotHeight;
    // Open on 8:00. Zoom changes hour height without jumping back to 8:00.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  const editorKey = editor
    ? editor.kind === 'edit'
      ? editor.event.id
      : `new-${editor.date}-${editor.time ?? 'day'}`
    : '';
  useEffect(() => {
    if (!editorKey) return;
    const anchor = scrollerRef.current?.querySelector('[data-editor-open="true"]');
    anchor?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [editorKey]);

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
          className="sticky top-0 z-10 grid border-b border-border bg-background"
          style={{ gridTemplateColumns: columns }}
        >
          <div className="sticky left-0 z-[1] bg-background" />
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
          <div className="sticky left-0 z-[1] bg-background px-1 py-2 text-right text-[10px] text-foreground-muted">All day</div>
          {days.map((day, dayIndex) => {
            const key = formatDateKey(day);
            const items = byDay.get(key)?.allDay ?? [];
            const align = dayIndex >= Math.ceil(days.length / 2) ? 'end' : 'start';
            const creatingHere = editor?.kind === 'create' && editor.allDay && editor.date === key;
            const editingHere = items.some((event) => editor?.kind === 'edit' && editor.event.id === event.id);
            return (
              <div
                key={key}
                className={cn(
                  'relative flex flex-col gap-1 border-l border-border/60 p-1',
                  creatingHere || editingHere ? 'z-30 overflow-visible' : 'max-h-24 overflow-y-auto'
                )}
              >
                {creatingHere && renderEditor && (
                  <div data-editor-open="true" className="overflow-hidden rounded-2xl border border-border bg-background-card shadow-2xl">
                    {renderEditor()}
                  </div>
                )}
                {items.map((event) => {
                  const color = event.color_code || '#3b82f6';
                  const open = editor?.kind === 'edit' && editor.event.id === event.id;
                  return (
                    <div key={event.id} className="relative">
                    <div className="flex items-center gap-0.5">
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
                    {open && renderEditor && (
                      <div
                        data-editor-open="true"
                        className={cn(
                          'absolute top-full z-50 mt-1 w-[min(22rem,70vw)] overflow-hidden rounded-2xl border border-border bg-background-card shadow-2xl',
                          align === 'end' ? 'right-0' : 'left-0'
                        )}
                      >
                        {renderEditor()}
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="grid" style={{ gridTemplateColumns: columns }}>
          <div className="sticky left-0 z-10 bg-background">
            {hours.map((hour) => (
              <div key={hour} className="relative border-t border-transparent" style={{ height: slotHeight }}>
                <span className="absolute right-1.5 top-0 -translate-y-1/2 text-[10px] tabular-nums text-foreground-muted">
                  {formatHourShort(hour)}
                </span>
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => {
            const key = formatDateKey(day);
            const timed = byDay.get(key)?.timed ?? [];
            const laidOut = layoutOverlappingEvents(timed);
            const selected = selectedDate ? isSameDay(day, selectedDate) : isSameDay(day, today);
            const showNow = isSameDay(day, today);
            const now = new Date();
            const nowTop = ((now.getHours() + now.getMinutes() / 60) - startHour) * slotHeight;
            const composerHour = inlineCreate?.date === key ? Number(inlineCreate.time.split(':')[0]) : null;
            const align = dayIndex >= Math.ceil(days.length / 2) ? 'end' : 'start';
            const creatingHour = editor?.kind === 'create' && !editor.allDay && editor.date === key && editor.time
              ? Number(editor.time.split(':')[0])
              : null;

            return (
              <div
                key={key}
                className="relative border-l border-border/60"
                style={{
                  height: hours.length * slotHeight,
                  backgroundColor: selected ? 'color-mix(in srgb, var(--primary) 5%, transparent)' : undefined,
                }}
              >
                {hours.map((hour, index) => (
                  <div key={hour} className="absolute inset-x-0" style={{ top: index * slotHeight, height: slotHeight }}>
                    <DroppableHour
                      date={key}
                      hour={hour}
                      height={slotHeight}
                      onClick={() => onSlotClick(day, `${String(hour).padStart(2, '0')}:00`)}
                    />
                    {composerHour === hour && inlineCreate && creatingHour !== hour && (
                      <SlotComposer
                        time={inlineCreate.time}
                        onSubmit={onInlineSubmit}
                        onCancel={onInlineCancel}
                        onExpand={onInlineExpand}
                      />
                    )}
                    {creatingHour === hour && renderEditor && (
                      <div
                        data-editor-open="true"
                        className={cn(
                          'absolute top-1 z-50 w-[min(22rem,70vw)] overflow-hidden rounded-2xl border border-border bg-background-card shadow-2xl',
                          align === 'end' ? 'right-0' : 'left-0'
                        )}
                        onPointerDown={(pointer) => pointer.stopPropagation()}
                        onClick={(click) => click.stopPropagation()}
                      >
                        {renderEditor()}
                      </div>
                    )}
                  </div>
                ))}

                {laidOut.map((event) => {
                  const start = event.start_time ? new Date(event.start_time) : null;
                  if (!start) return null;
                  const startMins = start.getHours() * 60 + start.getMinutes();
                  const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 60 * 60 * 1000);
                  const durationMins = Math.max(20, (end.getTime() - start.getTime()) / 60000);
                  const top = ((startMins / 60) - startHour) * slotHeight;
                  const height = (durationMins / 60) * slotHeight;
                  const open = editor?.kind === 'edit' && editor.event.id === event.id;
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
                      details={open && renderEditor ? renderEditor() : undefined}
                      detailsAlign={align}
                    />
                  );
                })}

                {showNow && nowTop >= 0 && nowTop <= hours.length * slotHeight && (
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
