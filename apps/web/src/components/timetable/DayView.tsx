'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import type { TimetableEvent, TimetableEventFormData } from '@/types/timetable';
import TaskEditor from './TaskEditor';
import { TaskItem } from './TaskRow';
import { eventSortTime, formatDateKey, startOfDay } from './task-utils';
import { cn } from '@/lib/utils';

interface DayViewProps {
  currentDate: Date;
  events: TimetableEvent[];
  onToggleComplete: (eventId: string) => void;
  onSave: (event: TimetableEvent | null, data: TimetableEventFormData) => Promise<void>;
  onDelete: (event: TimetableEvent) => Promise<void>;
  composeKey?: number;
}

export default function DayView({
  currentDate,
  events,
  onToggleComplete,
  onSave,
  onDelete,
  composeKey = 0,
}: DayViewProps) {
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [seenCompose, setSeenCompose] = useState(composeKey);

  useEffect(() => {
    if (composeKey === seenCompose) return;
    setSeenCompose(composeKey);
    setExpandedId(null);
    setCreating(true);
  }, [composeKey, seenCompose]);

  const dateKey = formatDateKey(currentDate);

  useEffect(() => {
    setCreating(false);
    setExpandedId(null);
  }, [dateKey]);

  const dayStart = startOfDay(currentDate).getTime();
  const dayEnd = dayStart + 86400000;

  const { open, done, timed, untimed } = useMemo(() => {
    const forDay = events
      .filter((event) => {
        const anchor = event.start_time || event.end_time;
        if (!anchor) return false;
        const t = new Date(anchor).getTime();
        return t >= dayStart && t < dayEnd;
      })
      .sort((a, b) => eventSortTime(a) - eventSortTime(b));

    return {
      open: forDay.filter((e) => !e.is_completed),
      done: forDay.filter((e) => e.is_completed),
      timed: forDay.filter((e) => !e.all_day && e.start_time && !e.is_completed),
      untimed: forDay.filter((e) => (e.all_day || !e.start_time) && !e.is_completed),
    };
  }, [events, dayStart, dayEnd]);

  const isToday = formatDateKey(currentDate) === formatDateKey(new Date());
  const heading = isToday
    ? 'Today’s plan'
    : currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="h-full overflow-y-auto px-3 pt-3 pb-24 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div className="rounded-2xl border border-border bg-background-card px-4 py-3 shadow-sm">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-foreground">{heading}</h2>
              <p className="mt-0.5 text-xs text-foreground-muted">
                {open.length === 0
                  ? 'Nothing scheduled — add tasks for this day.'
                  : `${open.length} open · ${timed.length} timed · ${untimed.length} flexible`}
              </p>
            </div>
          </div>
        </div>

        <div className={creating ? 'grid grid-rows-[1fr]' : 'grid grid-rows-[0fr]'}>
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

        {!creating && (
          <button
            type="button"
            onClick={() => {
              setExpandedId(null);
              setCreating(true);
            }}
            className="flex h-12 items-center gap-2 rounded-2xl border border-dashed border-border bg-background-card px-3 text-sm font-medium text-foreground-secondary hover:border-primary/50 hover:text-foreground"
          >
            <Plus size={16} className="text-primary" />
            Add a task for this day
          </button>
        )}

        {untimed.length > 0 && (
          <section>
            <h3 className="px-2 pb-1 text-xs font-bold uppercase tracking-wider text-foreground-muted">
              To do
            </h3>
            <div className="flex flex-col">
              {untimed.map((event) => (
                <TaskItem
                  key={event.id}
                  event={event}
                  expanded={expandedId === event.id}
                  onOpen={() => {
                    setCreating(false);
                    setExpandedId((cur) => (cur === event.id ? null : event.id));
                  }}
                  onToggle={() => onToggleComplete(event.id)}
                  onSave={(data) => onSave(event, data)}
                  onDelete={() => onDelete(event)}
                />
              ))}
            </div>
          </section>
        )}

        {timed.length > 0 && (
          <section>
            <h3 className="px-2 pb-1 text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Time-blocked
            </h3>
            <div className="flex flex-col">
              {timed.map((event) => (
                <TaskItem
                  key={event.id}
                  event={event}
                  expanded={expandedId === event.id}
                  onOpen={() => {
                    setCreating(false);
                    setExpandedId((cur) => (cur === event.id ? null : event.id));
                  }}
                  onToggle={() => onToggleComplete(event.id)}
                  onSave={(data) => onSave(event, data)}
                  onDelete={() => onDelete(event)}
                />
              ))}
            </div>
          </section>
        )}

        {done.length > 0 && (
          <section>
            <h3 className="px-2 pb-1 text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Done
            </h3>
            <div className={cn('flex flex-col opacity-70')}>
              {done.map((event) => (
                <TaskItem
                  key={event.id}
                  event={event}
                  expanded={expandedId === event.id}
                  onOpen={() => {
                    setCreating(false);
                    setExpandedId((cur) => (cur === event.id ? null : event.id));
                  }}
                  onToggle={() => onToggleComplete(event.id)}
                  onSave={(data) => onSave(event, data)}
                  onDelete={() => onDelete(event)}
                />
              ))}
            </div>
          </section>
        )}

        {open.length === 0 && done.length === 0 && !creating && (
          <p className="px-2 text-sm text-foreground-muted">
            Empty day. Capture what you need to get done, then time-block it in Week view.
          </p>
        )}
      </div>
    </div>
  );
}
