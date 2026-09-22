'use client';

import { Check, Repeat } from 'lucide-react';
import type { TimetableEvent } from '@/types/timetable';
import { cn } from '@/lib/utils';
import { formatClock, formatTimeRange, isDailyHabit, repeatLabel } from './task-utils';

export function TaskCheck({
  checked,
  color,
  onToggle,
  label,
}: {
  checked: boolean;
  color: string;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
    >
      <span
        className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition-colors"
        style={{
          borderColor: color,
          backgroundColor: checked ? color : 'transparent',
          color: checked ? '#fff' : color,
        }}
      >
        {checked ? <Check size={13} strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

export function TaskRow({
  event,
  onOpen,
  onToggle,
  timeLabel,
  habit = false,
}: {
  event: TimetableEvent;
  onOpen: () => void;
  onToggle: () => void;
  timeLabel?: string;
  habit?: boolean;
}) {
  const color = event.color_code || '#3b82f6';
  const done = event.is_completed;
  const external = event.event_source !== 'user';
  const when = timeLabel ?? (event.all_day ? 'All day' : formatClock(event.start_time));
  const repeat = repeatLabel(event);

  return (
    <div
      className={cn(
        'flex min-h-11 items-center gap-1 rounded-2xl pr-3 transition-colors hover:bg-foreground/[0.04]',
        done && 'opacity-60'
      )}
    >
      {habit ? (
        <span
          className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: color }}
          aria-hidden
        >
          {event.title.trim().charAt(0).toUpperCase() || '•'}
        </span>
      ) : external ? (
        <span className="w-3 shrink-0" />
      ) : (
        <TaskCheck
          checked={done}
          color={color}
          onToggle={onToggle}
          label={done ? `Mark ${event.title} not done` : `Mark ${event.title} done`}
        />
      )}

      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 py-2.5 text-left"
      >
        {!habit && (
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        )}
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate text-sm font-medium text-foreground',
              done && 'line-through text-foreground-muted'
            )}
          >
            {event.title}
          </span>
          {repeat && !habit && (
            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-foreground-muted">
              <Repeat size={10} />
              {repeat}
            </span>
          )}
        </span>
        {when && (
          <span className="shrink-0 text-xs font-medium tabular-nums text-primary">{when}</span>
        )}
      </button>

      {habit && !external && (
        <TaskCheck
          checked={done}
          color={color}
          onToggle={onToggle}
          label={done ? `Mark ${event.title} not done` : `Mark ${event.title} done`}
        />
      )}
    </div>
  );
}

export function TaskChip({
  event,
  onOpen,
}: {
  event: TimetableEvent;
  onOpen: () => void;
}) {
  const color = event.color_code || '#3b82f6';
  return (
    <button
      type="button"
      onClick={(click) => {
        click.stopPropagation();
        onOpen();
      }}
      title={formatTimeRange(event)}
      className={cn(
        'flex w-full items-center gap-1 rounded-md px-1 py-0.5 text-left text-[10px] font-medium leading-tight sm:text-[11px]',
        event.is_completed && 'opacity-50 line-through'
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 18%, var(--background-card))`,
        color,
      }}
    >
      {isDailyHabit(event) && <Repeat size={9} className="shrink-0" />}
      <span className="truncate">{event.title}</span>
    </button>
  );
}
