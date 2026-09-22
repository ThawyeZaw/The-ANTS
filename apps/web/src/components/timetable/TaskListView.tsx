'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { TimetableEvent } from '@/types/timetable';
import { TaskRow } from './TaskRow';
import { eventSortTime, representativeTasks, startOfDay } from './task-utils';

interface TaskListViewProps {
  events: TimetableEvent[];
  onEditEvent: (event: TimetableEvent) => void;
  onToggleComplete: (eventId: string) => void;
  onQuickAdd: (title: string) => void;
}

function dayKey(event: TimetableEvent): number {
  return startOfDay(new Date(event.start_time || event.end_time || Date.now())).getTime();
}

export default function TaskListView({
  events,
  onEditEvent,
  onToggleComplete,
  onQuickAdd,
}: TaskListViewProps) {
  const [draft, setDraft] = useState('');
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

  return (
    <div className="h-full overflow-y-auto px-3 pt-3 pb-24 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <form
          className="flex items-center gap-2 rounded-2xl border border-border bg-background-card px-3"
          onSubmit={(formEvent) => {
            formEvent.preventDefault();
            const title = draft.trim();
            if (!title) return;
            onQuickAdd(title);
            setDraft('');
          }}
        >
          <Plus size={16} className="text-primary" />
          <input
            value={draft}
            onChange={(input) => setDraft(input.target.value)}
            placeholder="Add a task for today"
            className="h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
          />
        </form>

        <p className="px-1 text-sm text-foreground-muted">{summaryLine(groups)}</p>

        {sections.map((section) =>
          section.items.length === 0 ? null : (
            <section key={section.id}>
              <h2 className="px-2 pb-1 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                {section.label}
              </h2>
              <div className="flex flex-col">
                {section.items.map((event) => (
                  <TaskRow
                    key={event.id}
                    event={event}
                    onOpen={() => onEditEvent(event)}
                    onToggle={() => onToggleComplete(event.id)}
                    timeLabel={section.id === 'today' ? undefined : eventDateLabel(event)}
                  />
                ))}
              </div>
            </section>
          )
        )}

        {sections.every((section) => section.items.length === 0) && (
          <p className="px-2 text-sm text-foreground-muted">Your list is empty. Add the first task above.</p>
        )}
      </div>
    </div>
  );
}

function summaryLine(groups: { overdue: TimetableEvent[]; today: TimetableEvent[] }): string {
  if (groups.overdue.length && groups.today.length) {
    return `${groups.overdue.length} overdue, ${groups.today.length} still open today.`;
  }
  if (groups.overdue.length) return `${groups.overdue.length} overdue.`;
  if (groups.today.length) return `${groups.today.length} still open today.`;
  return 'You are clear for today.';
}

function eventDateLabel(event: TimetableEvent): string {
  const anchor = event.start_time || event.end_time;
  if (!anchor) return 'All day';
  const date = new Date(anchor);
  const day = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (event.all_day) return day;
  return `${day} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}
