'use client';

import { useEffect, useState } from 'react';
import { Check, Repeat } from 'lucide-react';
import type { TimetableEvent, TimetableEventFormData } from '@/types/timetable';
import { cn } from '@/lib/utils';
import TaskEditor from './TaskEditor';
import { playTaskCompleteSound } from './task-sound';
import { repeatLabel, taskWhenLabel } from './task-utils';

export function TaskCheck({
  checked,
  color,
  onToggle,
  label,
  compact = false,
}: {
  checked: boolean;
  color: string;
  onToggle: () => void;
  label: string;
  compact?: boolean;
}) {
  const [shown, setShown] = useState(checked);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    setShown(checked);
  }, [checked]);

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={shown}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        const next = !shown;
        setShown(next);
        if (next) {
          const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!reduceMotion) {
            setPop(true);
            window.setTimeout(() => setPop(false), 280);
          }
          playTaskCompleteSound();
        }
        onToggle();
      }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        compact ? 'mt-0.5 h-5 w-5' : 'h-11 w-11'
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-full border-2 transition-transform duration-200 ease-out',
          compact ? 'h-3.5 w-3.5' : 'h-[22px] w-[22px]',
          pop && 'scale-125'
        )}
        style={{
          borderColor: color,
          backgroundColor: shown ? color : 'transparent',
          color: '#fff',
        }}
      >
        <Check
          size={compact ? 9 : 13}
          strokeWidth={3}
          className={cn('transition-all duration-200', shown ? 'scale-100 opacity-100' : 'scale-50 opacity-0')}
        />
      </span>
    </button>
  );
}

export function TaskItem({
  event,
  expanded,
  onOpen,
  onToggle,
  onSave,
  onDelete,
}: {
  event: TimetableEvent;
  expanded: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onSave: (data: TimetableEventFormData) => Promise<void>;
  onDelete?: () => Promise<void> | void;
}) {
  const color = event.color_code || '#3b82f6';
  const done = event.is_completed;
  const external = event.event_source !== 'user';
  const when = taskWhenLabel(event);
  const repeat = repeatLabel(event);
  const canEdit = !external;

  return (
    <div className={cn('rounded-2xl', expanded && 'bg-background-card')}>
      <div className={cn('flex min-h-11 items-center gap-0.5 pr-3', done && !expanded && 'opacity-60')}>
        {external ? (
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
          onClick={() => {
            if (canEdit) onOpen();
          }}
          className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left"
          aria-expanded={canEdit ? expanded : undefined}
        >
          <span className="min-w-0 flex-1">
            <span className="relative inline-grid max-w-full">
              <span
                className={cn(
                  'col-start-1 row-start-1 truncate text-sm font-medium text-foreground transition-colors',
                  done && 'text-foreground-muted'
                )}
              >
                {event.title}
              </span>
              <span
                className={cn(
                  'pointer-events-none col-start-1 row-start-1 h-px self-center bg-foreground-muted transition-[width] duration-300 ease-out',
                  done ? 'w-full' : 'w-0'
                )}
                aria-hidden
              />
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-primary">
              <span className="tabular-nums">{when}</span>
              {repeat && <Repeat size={12} className="shrink-0" aria-label={repeat} />}
            </span>
          </span>
        </button>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {expanded && canEdit && (
            <div className="px-2 pb-2">
              <TaskEditor
                event={event}
                onSave={onSave}
                onDelete={onDelete}
                onClose={onOpen}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
