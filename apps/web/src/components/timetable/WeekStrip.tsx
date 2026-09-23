'use client';

import { formatDateKey, isSameDay } from './task-utils';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WeekStrip({
  weekStart,
  selected,
  markedDates,
  onSelect,
}: {
  weekStart: Date;
  selected: Date;
  markedDates: Set<string>;
  onSelect: (date: Date) => void;
}) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  return (
    <div className="grid grid-cols-7 px-1 pb-1 sm:px-3">
      {days.map((date, index) => {
        const active = isSameDay(date, selected);
        const isToday = isSameDay(date, today);
        const marked = markedDates.has(formatDateKey(date));
        return (
          <button
            key={formatDateKey(date)}
            type="button"
            onClick={() => onSelect(date)}
            className="flex flex-col items-center gap-0.5 rounded-xl py-0.5"
            aria-label={date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            aria-pressed={active}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
              {LETTERS[index]}
            </span>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums"
              style={
                active
                  ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }
                  : isToday
                    ? { color: 'var(--primary)' }
                    : { color: 'var(--foreground)' }
              }
            >
              {date.getDate()}
            </span>
            <span
              className="h-1 w-1 rounded-full"
              style={{ backgroundColor: marked && !active ? 'var(--primary)' : 'transparent' }}
            />
          </button>
        );
      })}
    </div>
  );
}
