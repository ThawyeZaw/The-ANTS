'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Repeat } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import type { TimetableEvent } from '@/types/timetable';
import { TaskCheck } from './TaskRow';
import { formatClock } from './task-utils';

interface TimeBlockProps {
  event: TimetableEvent;
  onEdit?: (event: TimetableEvent) => void;
  onToggleComplete?: (eventId: string) => void;
  heightPx?: number;
  topPx?: number;
  leftPct?: number;
  widthPct?: number;
  draggable?: boolean;
  details?: ReactNode;
  detailsAlign?: 'start' | 'end';
}

export default function TimeBlock({
  event,
  onEdit,
  onToggleComplete,
  heightPx,
  topPx,
  leftPct,
  widthPct,
  draggable = false,
  details,
  detailsAlign = 'start',
}: TimeBlockProps) {
  const external = event.event_source !== 'user';
  const color = event.color_code || '#3b82f6';
  const done = event.is_completed;
  const open = Boolean(details);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event },
    disabled: !draggable || external || open,
  });

  const short = heightPx !== undefined && heightPx < 46;
  const frame: CSSProperties = {
    position: topPx !== undefined ? 'absolute' : 'relative',
    top: topPx,
    left: leftPct !== undefined ? `calc(${leftPct}% + 2px)` : 2,
    width: widthPct !== undefined ? `calc(${widthPct}% - 6px)` : 'calc(100% - 4px)',
    zIndex: open || isDragging ? 40 : 2,
  };
  const style: CSSProperties = {
    height: heightPx !== undefined ? Math.max(heightPx - 4, 22) : undefined,
    backgroundColor: `color-mix(in srgb, ${color} 22%, var(--background-card))`,
    borderLeft: `3px solid ${color}`,
    color,
    opacity: isDragging ? 0.45 : done && !open ? 0.55 : 1,
    boxShadow: open ? '0 0 0 2px var(--primary)' : undefined,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div data-editor-open={open ? 'true' : undefined} className={open ? 'overflow-visible' : undefined} style={frame}>
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="cursor-pointer overflow-hidden rounded-lg px-1.5 py-1 text-left shadow-sm"
      style={style}
      onClick={() => {
        if (!isDragging && !external) onEdit?.(event);
      }}
    >
      <div className="flex items-start gap-1">
        {!external && (
          <TaskCheck
            checked={done}
            color={color}
            onToggle={() => onToggleComplete?.(event.id)}
            label={done ? `Mark ${event.title} not done` : `Mark ${event.title} done`}
            compact
          />
        )}
        <span className={`min-w-0 flex-1 text-[11px] font-semibold leading-tight sm:text-xs ${done ? 'line-through' : ''} ${short ? 'truncate' : 'break-words'}`}>
          {event.title}
        </span>
        {event.is_recurring && <Repeat size={10} className="mt-0.5 shrink-0 opacity-70" />}
      </div>
      {!short && !event.all_day && event.start_time && (
        <p className="mt-0.5 pl-5 text-[10px] tabular-nums opacity-80">
          {formatClock(event.start_time)}
          {event.end_time ? ` – ${formatClock(event.end_time)}` : ''}
        </p>
      )}
    </div>
      {open && (
        <div
          className={`absolute top-full z-50 mt-1 w-[min(22rem,70vw)] overflow-hidden rounded-2xl border border-border bg-background-card shadow-2xl ${detailsAlign === 'end' ? 'right-0' : 'left-0'}`}
          onPointerDown={(pointer) => pointer.stopPropagation()}
          onClick={(click) => click.stopPropagation()}
        >
          {details}
        </div>
      )}
    </div>
  );
}
