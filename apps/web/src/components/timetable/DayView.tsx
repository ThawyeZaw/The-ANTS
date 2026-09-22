'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { TimetableEvent } from '@/types/timetable';
import TimeGrid, { type InlineSlot } from './TimeGrid';
import { TaskRow } from './TaskRow';
import { eventSortTime, isDailyHabit } from './task-utils';

interface DayViewProps {
  mode: 'agenda' | 'schedule';
  currentDate: Date;
  events: TimetableEvent[];
  isDragging?: boolean;
  inlineCreate: InlineSlot | null;
  onSlotClick: (date: Date, time: string) => void;
  onEditEvent: (event: TimetableEvent) => void;
  onToggleComplete: (eventId: string) => void;
  onQuickAdd: (title: string) => void;
  onInlineSubmit: (title: string) => void;
  onInlineCancel: () => void;
  onInlineExpand: () => void;
}

export default function DayView({
  mode,
  currentDate,
  events,
  isDragging,
  inlineCreate,
  onSlotClick,
  onEditEvent,
  onToggleComplete,
  onQuickAdd,
  onInlineSubmit,
  onInlineCancel,
  onInlineExpand,
}: DayViewProps) {
  const [draft, setDraft] = useState('');
  const heading = isToday(currentDate) ? 'Today' : currentDate.toLocaleDateString(undefined, { weekday: 'long' });

  if (mode === 'schedule') {
    return (
      <TimeGrid
        days={[currentDate]}
        events={events}
        selectedDate={currentDate}
        isDragging={isDragging}
        inlineCreate={inlineCreate}
        onSlotClick={onSlotClick}
        onEditEvent={onEditEvent}
        onToggleComplete={onToggleComplete}
        onInlineSubmit={onInlineSubmit}
        onInlineCancel={onInlineCancel}
        onInlineExpand={onInlineExpand}
      />
    );
  }

  const habits = events.filter(isDailyHabit).sort((a, b) => a.title.localeCompare(b.title));
  const tasks = events
    .filter((event) => !isDailyHabit(event))
    .sort((a, b) => {
      if (a.all_day !== b.all_day) return a.all_day ? 1 : -1;
      return eventSortTime(a) - eventSortTime(b);
    });

  return (
    <div className="h-full overflow-y-auto px-3 pt-3 pb-24 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <section>
          <h2 className="px-2 pb-1 text-xs font-bold uppercase tracking-wider text-foreground-muted">{heading}</h2>
          {tasks.length === 0 && (
            <p className="px-2 py-3 text-sm text-foreground-muted">Nothing scheduled. Add a task to start the day.</p>
          )}
          <div className="flex flex-col">
            {tasks.map((event) => (
              <TaskRow
                key={event.id}
                event={event}
                onOpen={() => onEditEvent(event)}
                onToggle={() => onToggleComplete(event.id)}
              />
            ))}
          </div>
          <form
            className="mt-1 flex items-center gap-2 rounded-2xl px-2"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              const title = draft.trim();
              if (!title) return;
              onQuickAdd(title);
              setDraft('');
            }}
          >
            <Plus size={16} className="text-foreground-muted" />
            <input
              value={draft}
              onChange={(input) => setDraft(input.target.value)}
              placeholder="Add a task"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
            />
          </form>
        </section>

        <section>
          <h2 className="px-2 pb-1 text-xs font-bold uppercase tracking-wider text-foreground-muted">Habits</h2>
          {habits.length === 0 ? (
            <p className="px-2 py-2 text-sm text-foreground-muted">
              A habit is a task set to repeat every day.
            </p>
          ) : (
            <div className="flex flex-col">
              {habits.map((event) => (
                <TaskRow
                  key={event.id}
                  event={event}
                  habit
                  timeLabel={event.all_day ? 'Today' : undefined}
                  onOpen={() => onEditEvent(event)}
                  onToggle={() => onToggleComplete(event.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function isToday(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}
