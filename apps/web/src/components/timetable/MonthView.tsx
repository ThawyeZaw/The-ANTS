'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type { TimetableEvent, TimetableEventFormData } from '@/types/timetable';
import { cn } from '@/lib/utils';
import TaskEditor from './TaskEditor';
import { TaskItem } from './TaskRow';
import { eventSortTime, formatDateKey, isSameDay } from './task-utils';

interface MonthViewProps {
  currentDate: Date;
  events: TimetableEvent[];
  composeKey: number;
  onSelectDate: (date: Date) => void;
  onToggleComplete: (eventId: string) => void;
  onSave: (event: TimetableEvent | null, data: TimetableEventFormData) => Promise<void>;
  onDelete: (event: TimetableEvent) => Promise<void>;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function buildCells(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const cells: Date[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(first);
    date.setDate(1 - startOffset + index);
    cells.push(date);
  }
  return cells;
}

export default function MonthView({
  currentDate,
  events,
  composeKey,
  onSelectDate,
  onToggleComplete,
  onSave,
  onDelete,
}: MonthViewProps) {
  const today = new Date();
  const cells = useMemo(() => buildCells(currentDate), [currentDate]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const seenCompose = useRef(composeKey);

  const selectedKey = formatDateKey(currentDate);

  useEffect(() => {
    setExpandedId(null);
    setCreating(false);
  }, [selectedKey]);

  useEffect(() => {
    if (composeKey === seenCompose.current) return;
    seenCompose.current = composeKey;
    setExpandedId(null);
    setCreating(true);
  }, [composeKey]);

  const byDate = useMemo(() => {
    const map = new Map<string, TimetableEvent[]>();
    for (const event of events) {
      const anchor = event.start_time || event.end_time;
      if (!anchor) continue;
      const key = formatDateKey(new Date(anchor));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) list.sort((a, b) => eventSortTime(a) - eventSortTime(b));
    return map;
  }, [events]);

  const dayTasks = byDate.get(selectedKey) ?? [];
  const heading = currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="grid grid-cols-7 px-2 pt-2">
        {WEEKDAYS.map((label, index) => (
          <div key={`${label}-${index}`} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 px-1">
        {cells.map((date) => {
          const key = formatDateKey(date);
          const inMonth = date.getMonth() === currentDate.getMonth();
          const selected = isSameDay(date, currentDate);
          const isToday = isSameDay(date, today);
          const hasTasks = (byDate.get(key) ?? []).some((event) => !event.is_completed);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-pressed={selected}
              aria-label={date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
              className="flex flex-col items-center py-1"
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium tabular-nums',
                  selected && 'bg-primary text-primary-foreground',
                  !selected && isToday && 'ring-2 ring-foreground',
                  !selected && !isToday && (inMonth ? 'text-foreground' : 'text-foreground-muted')
                )}
              >
                {date.getDate()}
              </span>
              <span
                className="mt-0.5 h-1 w-1 rounded-full"
                style={{ backgroundColor: hasTasks ? 'var(--primary)' : 'transparent' }}
              />
            </button>
          );
        })}
      </div>

      <section className="mx-3 mt-3 rounded-2xl border border-border bg-background-card px-1 py-2 sm:mx-6">
        <div className="flex items-center justify-between px-3 py-1">
          <h2 className="text-sm font-semibold text-foreground">{heading}</h2>
          {!creating && (
            <button
              type="button"
              onClick={() => {
                setExpandedId(null);
                setCreating(true);
              }}
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              <Plus size={14} />
              Add
            </button>
          )}
        </div>

        <div className={creating ? 'grid grid-rows-[1fr] px-2 pb-2 transition-[grid-template-rows] duration-200 ease-out' : 'grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out'}>
          <div className="min-h-0 overflow-hidden">
            {creating && (
              <TaskEditor
                defaultDate={currentDate}
                defaultAllDay
                onSave={(data) => onSave(null, data)}
                onClose={() => setCreating(false)}
              />
            )}
          </div>
        </div>

        {dayTasks.length === 0 && !creating && (
          <p className="px-3 py-3 text-sm text-foreground-muted">Nothing on this day.</p>
        )}

        <div className="flex flex-col">
          {dayTasks.map((event) => (
            <TaskItem
              key={event.id}
              event={event}
              expanded={expandedId === event.id}
              onOpen={() => {
                setCreating(false);
                setExpandedId((current) => (current === event.id ? null : event.id));
              }}
              onToggle={() => onToggleComplete(event.id)}
              onSave={(data) => onSave(event, data)}
              onDelete={() => onDelete(event)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
