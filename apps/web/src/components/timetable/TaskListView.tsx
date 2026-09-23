'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type { TimetableEvent, TimetableEventFormData } from '@/types/timetable';
import TaskEditor from './TaskEditor';
import { TaskItem } from './TaskRow';
import { eventSortTime, representativeTasks, startOfDay } from './task-utils';

interface TaskListViewProps {
  events: TimetableEvent[];
  composeKey: number;
  onToggleComplete: (eventId: string) => void;
  onSave: (event: TimetableEvent | null, data: TimetableEventFormData) => Promise<void>;
  onDelete: (event: TimetableEvent) => Promise<void>;
}

function dayKey(event: TimetableEvent): number {
  return startOfDay(new Date(event.start_time || event.end_time || Date.now())).getTime();
}

export default function TaskListView({
  events,
  composeKey,
  onToggleComplete,
  onSave,
  onDelete,
}: TaskListViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const seenCompose = useRef(composeKey);

  useEffect(() => {
    if (composeKey === seenCompose.current) return;
    seenCompose.current = composeKey;
    setExpandedId(null);
    setCreating(true);
  }, [composeKey]);

  const groups = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    const tomorrow = today + 86400000;
    const weekEnd = today + 7 * 86400000;
    const rows = representativeTasks(events);
    const buckets = {
      overdue: [] as TimetableEvent[],
      today: [] as TimetableEvent[],
      tomorrow: [] as TimetableEvent[],
      week: [] as TimetableEvent[],
      later: [] as TimetableEvent[],
      done: [] as TimetableEvent[],
    };
    for (const event of rows) {
      if (event.is_completed) {
        buckets.done.push(event);
        continue;
      }
      const when = dayKey(event);
      if (when < today) buckets.overdue.push(event);
      else if (when < tomorrow) buckets.today.push(event);
      else if (when < tomorrow + 86400000) buckets.tomorrow.push(event);
      else if (when < weekEnd) buckets.week.push(event);
      else buckets.later.push(event);
    }
    for (const list of Object.values(buckets)) list.sort((a, b) => eventSortTime(a) - eventSortTime(b));
    return buckets;
  }, [events]);

  const sections: { id: string; label: string; items: TimetableEvent[] }[] = [
    { id: 'overdue', label: 'Overdue', items: groups.overdue },
    { id: 'today', label: 'Today', items: groups.today },
    { id: 'tomorrow', label: 'Tomorrow', items: groups.tomorrow },
    { id: 'week', label: 'This week', items: groups.week },
    { id: 'later', label: 'Later', items: groups.later },
    { id: 'done', label: 'Done', items: groups.done },
  ];

  const openCreate = () => {
    setExpandedId(null);
    setCreating(true);
  };

  return (
    <div className="h-full overflow-y-auto px-3 pt-3 pb-24 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div
          className={cnGrid(creating)}
        >
          <div className="min-h-0 overflow-hidden">
            {creating && (
              <TaskEditor
                defaultDate={new Date()}
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
            onClick={openCreate}
            className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-background-card px-3 text-sm font-medium text-foreground-secondary hover:border-primary/40"
          >
            <Plus size={16} className="text-primary" />
            Add a task
          </button>
        )}

        <p className="px-1 text-sm text-foreground-muted">{summaryLine(groups)}</p>

        {sections.map((section) =>
          section.items.length === 0 ? null : (
            <section key={section.id}>
              <h2 className="px-2 pb-1 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                {section.label}
              </h2>
              <div className="flex flex-col">
                {section.items.map((event) => (
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
          )
        )}

        {sections.every((section) => section.items.length === 0) && !creating && (
          <p className="px-2 text-sm text-foreground-muted">Your list is empty. Add the first task above.</p>
        )}
      </div>
    </div>
  );
}

function cnGrid(open: boolean): string {
  return open
    ? 'grid grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-out'
    : 'grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out';
}

function summaryLine(groups: { overdue: TimetableEvent[]; today: TimetableEvent[] }): string {
  if (groups.overdue.length && groups.today.length) {
    return `${groups.overdue.length} overdue, ${groups.today.length} still open today.`;
  }
  if (groups.overdue.length) return `${groups.overdue.length} overdue.`;
  if (groups.today.length) return `${groups.today.length} still open today.`;
  return 'You are clear for today.';
}
