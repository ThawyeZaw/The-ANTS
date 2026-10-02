'use client';

import { CheckCircle2, Circle, Focus } from 'lucide-react';
import type { TimetableEvent } from '@/types/timetable';
import { eventSortTime, formatClock, formatDateKey, startOfDay } from './task-utils';
import { cn } from '@/lib/utils';

interface TodayFocusPanelProps {
  events: TimetableEvent[];
  onSelectDay?: () => void;
  onToggleComplete?: (eventId: string) => void;
  onOpenEvent?: (event: TimetableEvent) => void;
  className?: string;
}

export default function TodayFocusPanel({
  events,
  onSelectDay,
  onToggleComplete,
  onOpenEvent,
  className,
}: TodayFocusPanelProps) {
  const todayKey = formatDateKey(new Date());
  const dayStart = startOfDay(new Date()).getTime();
  const dayEnd = dayStart + 86400000;

  const todayEvents = events
    .filter((event) => {
      const anchor = event.start_time || event.end_time;
      if (!anchor) return false;
      const t = new Date(anchor).getTime();
      return t >= dayStart && t < dayEnd;
    })
    .sort((a, b) => eventSortTime(a) - eventSortTime(b));

  const open = todayEvents.filter((e) => !e.is_completed);
  const doneCount = todayEvents.length - open.length;
  const nextUp = open[0] ?? null;

  return (
    <aside
      className={cn(
        'shrink-0 border-border bg-background-card/80',
        className
      )}
    >
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <Focus size={15} className="text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
          Today focus
        </h2>
        <button
          type="button"
          onClick={onSelectDay}
          className="ml-auto text-[11px] font-semibold text-primary hover:underline"
        >
          Open day
        </button>
      </div>

      <div className="px-3 pb-2">
        <p className="text-sm font-semibold text-foreground tabular-nums">
          {open.length} open
          {doneCount > 0 ? ` · ${doneCount} done` : ''}
        </p>
        {nextUp ? (
          <button
            type="button"
            onClick={() => onOpenEvent?.(nextUp)}
            className="mt-1.5 w-full rounded-xl border border-primary/25 bg-primary/5 px-2.5 py-2 text-left hover:border-primary/50"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Next up</p>
            <p className="truncate text-sm font-semibold text-foreground">{nextUp.title}</p>
            {nextUp.start_time && !nextUp.all_day && (
              <p className="mt-0.5 font-mono text-[11px] tabular-nums text-foreground-muted">
                {formatClock(nextUp.start_time)}
              </p>
            )}
          </button>
        ) : (
          <p className="mt-1 text-xs text-foreground-muted">You’re clear for {todayKey}.</p>
        )}
      </div>

      <ul className="max-h-48 space-y-0.5 overflow-y-auto px-2 pb-3 md:max-h-[min(40vh,22rem)]">
        {open.slice(0, 8).map((event) => {
          const color = event.color_code || '#d97706';
          return (
            <li key={event.id}>
              <div className="flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 hover:bg-foreground/5">
                <button
                  type="button"
                  aria-label={event.is_completed ? 'Mark incomplete' : 'Mark complete'}
                  onClick={() => onToggleComplete?.(event.id)}
                  className="shrink-0 text-foreground-muted hover:text-primary"
                >
                  {event.is_completed ? (
                    <CheckCircle2 size={15} style={{ color }} />
                  ) : (
                    <Circle size={15} style={{ color }} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenEvent?.(event)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-xs font-medium text-foreground">{event.title}</p>
                  {event.start_time && !event.all_day && (
                    <p className="font-mono text-[10px] tabular-nums text-foreground-muted">
                      {formatClock(event.start_time)}
                    </p>
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
