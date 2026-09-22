'use client';

import type { CSSProperties } from 'react';
import { Check, Repeat } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import type { TimetableEvent } from '@/types/timetable';
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
}: TimeBlockProps) {
  const external = event.event_source !== 'user';
  const color = event.color_code || '#3b82f6';
  const done = event.is_completed;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event },
    disabled: !draggable || external,
  });

  const short = heightPx !== undefined && heightPx < 46;
  const style: CSSProperties = {
    position: topPx !== undefined ? 'absolute' : 'relative',
    top: topPx,
    height: heightPx !== undefined ? Math.max(heightPx - 4, 22) : undefined,
    left: leftPct !== undefined ? `calc(${leftPct}% + 2px)` : 2,
    width: widthPct !== undefined ? `calc(${widthPct}% - 6px)` : 'calc(100% - 4px)',
    backgroundColor: `color-mix(in srgb, ${color} 22%, var(--background-card))`,
    borderLeft: `3px solid ${color}`,
    color,
    opacity: isDragging ? 0.45 : done ? 0.55 : 1,
    zIndex: isDragging ? 40 : 2,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="overflow-hidden rounded-lg px-1.5 py-1 text-left shadow-sm"
      style={style}
      onClick={() => {
        if (!isDragging && !external) onEdit?.(event);
      }}
    >
      <div className="flex items-start gap-1">
        {!external && (
          <button
            type="button"
            aria-label={done ? `Mark ${event.title} not done` : `Mark ${event.title} done`}
            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
            style={{ borderColor: color, backgroundColor: done ? color : 'transparent', color: '#fff' }}
            onPointerDown={(pointer) => pointer.stopPropagation()}
            onClick={(click) => {
              click.stopPropagation();
              onToggleComplete?.(event.id);
            }}
          >
            {done ? <Check size={10} strokeWidth={3} /> : null}
          </button>
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
  );
}
