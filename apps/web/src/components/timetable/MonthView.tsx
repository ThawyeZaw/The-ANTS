'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { TimetableEvent } from '@/types/timetable';
import { TaskChip } from './TaskRow';
import { eventSortTime, formatDateKey, isoWeekNumber, isSameDay } from './task-utils';

interface MonthViewProps {
  currentDate: Date;
  events: TimetableEvent[];
  onDayClick: (date: Date) => void;
  onEditEvent: (event: TimetableEvent) => void;
  onCreateOnDay: (date: Date) => void;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function buildWeeks(month: Date): Date[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const cells: Date[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(first);
    date.setDate(1 - startOffset + index);
    cells.push(date);
  }
  const weeks: Date[][] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  return weeks;
}

export default function MonthView({
  currentDate,
  events,
  onDayClick,
  onEditEvent,
  onCreateOnDay,
}: MonthViewProps) {
  const today = new Date();
  const weeks = useMemo(() => buildWeeks(currentDate), [currentDate]);
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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto pb-20">
      <div className="grid shrink-0 grid-cols-7 border-b border-border px-1 sm:px-2">
        {WEEKDAYS.map((label, index) => (
          <div key={`${label}-${index}`} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
            {label}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-6">
        {weeks.map((week) => (
          <div key={formatDateKey(week[0])} className="grid min-h-0 grid-cols-7 border-b border-border/70">
            {week.map((date, index) => {
              const key = formatDateKey(date);
              const inMonth = date.getMonth() === currentDate.getMonth();
              const items = byDate.get(key) ?? [];
              const visible = items.slice(0, 3);
              const extra = items.length - visible.length;
              const isToday = isSameDay(date, today);
              return (
                <div
                  key={key}
                  className="group relative flex min-h-[4.75rem] cursor-pointer flex-col gap-0.5 border-l border-border/50 p-1 sm:min-h-[6.5rem] sm:p-1.5"
                  onClick={() => onDayClick(date)}
                >
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(click) => {
                        click.stopPropagation();
                        onDayClick(date);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums sm:h-7 sm:w-7 sm:text-sm"
                      style={
                        isToday
                          ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }
                          : { color: inMonth ? 'var(--foreground)' : 'var(--foreground-muted)' }
                      }
                      aria-label={date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    >
                      {date.getDate()}
                    </button>
                    {index === 0 && (
                      <span className="hidden text-[10px] tabular-nums text-foreground-muted lg:inline">
                        W{isoWeekNumber(date)}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={`Add a task on ${key}`}
                      onClick={(click) => {
                        click.stopPropagation();
                        onCreateOnDay(date);
                      }}
                      className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full text-foreground-muted hover:bg-foreground/5 hover:text-foreground sm:group-hover:flex"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="flex min-h-0 flex-col gap-0.5 overflow-hidden">
                    {visible.map((event) => (
                      <TaskChip key={event.id} event={event} onOpen={() => onEditEvent(event)} />
                    ))}
                    {extra > 0 && (
                      <span className="px-1 text-[10px] font-medium text-foreground-muted">+{extra}</span>
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
