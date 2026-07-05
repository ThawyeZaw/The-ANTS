'use client';

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { BookOpen, GraduationCap, Building2, Dumbbell, FileText, Coffee, AlertCircle, Users, Lock, CheckSquare, Square, Edit2, Trash2, MapPin, RotateCcw, GripVertical } from 'lucide-react';
import type { TimetableEvent } from '@/types/timetable';
import { EVENT_TYPE_CONFIG } from '@/constants/timetable';

interface TimeBlockProps {
  event: TimetableEvent;
  /** Compact mode for month view chips */
  compact?: boolean;
  /** Callback when user clicks the event */
  onEdit?: (event: TimetableEvent) => void;
  /** Callback when user deletes the event */
  onDelete?: (eventId: string) => void;
  /** Callback when user toggles to-do completion */
  onToggleComplete?: (eventId: string) => void;
  /** Whether this block is in a dragging state */
  isDragging?: boolean;
  /** Height in pixels (for timed events in grid) */
  heightPx?: number;
  /** Top offset in pixels (for timed events in grid) */
  topPx?: number;
  /** Left offset as percentage (for overlapping events) */
  leftPct?: number;
  /** Width as percentage (for overlapping events) */
  widthPct?: number;
  /** Whether drag handle should be shown (non-external timed events) */
  draggable?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  BookOpen,
  GraduationCap,
  Building2,
  Dumbbell,
  FileText,
  Coffee,
  AlertCircle,
  Users,
};

function EventIcon({ iconName, size = 12 }: { iconName: string; size?: number }) {
  const Icon = ICON_MAP[iconName];
  return Icon ? <Icon size={size} /> : null;
}

export default function TimeBlock({
  event,
  compact = false,
  onEdit,
  onDelete,
  onToggleComplete,
  isDragging: externalDragging = false,
  heightPx,
  topPx,
  leftPct,
  widthPct,
  draggable = false,
}: TimeBlockProps) {
  const [showActions, setShowActions] = useState(false);
  const config = EVENT_TYPE_CONFIG[event.event_type];
  const isExternal = event.event_source !== 'user';
  const isCompleted = event.is_todo && event.is_completed;

  // DnD
  const { attributes, listeners, setNodeRef, transform, isDragging: isDndDragging } = useDraggable({
    id: event.id,
    data: { event },
    disabled: !draggable || isExternal,
  });

  const isDragging = externalDragging || isDndDragging;

  const blockStyle: React.CSSProperties = {
    backgroundColor: config.bgColor,
    borderLeft: `3px solid ${event.color_code}`,
    ...(heightPx !== undefined && topPx !== undefined
      ? {
          position: 'absolute',
          top: topPx,
          height: Math.max(heightPx, 20),
          left: leftPct !== undefined ? `${leftPct}%` : 2,
          width: widthPct !== undefined ? `calc(${widthPct}% - 4px)` : undefined,
          right: leftPct === undefined ? 2 : undefined,
        }
      : {}),
    opacity: isDragging ? 0.5 : 1,
    transition: isDndDragging ? 'none' : 'opacity 0.15s, box-shadow 0.15s',
    zIndex: isDragging ? 50 : 1,
  };

  if (transform) {
    blockStyle.transform = `translate3d(${transform.x}px, ${transform.y}px, 0)`;
  }

  if (compact) {
    // Month view chip
    return (
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer overflow-hidden group"
        style={{ backgroundColor: config.bgColor, borderLeft: `2px solid ${event.color_code}` }}
        onClick={() => onEdit?.(event)}
        title={event.title}
      >
        <EventIcon iconName={config.icon} size={10} />
        <span
          className="truncate leading-tight"
          style={{ color: event.color_code, textDecoration: isCompleted ? 'line-through' : 'none' }}
        >
          {event.title}
        </span>
        {isExternal && <Lock size={8} className="shrink-0 opacity-60" style={{ color: event.color_code }} />}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="relative rounded-md overflow-hidden cursor-pointer group select-none"
      style={blockStyle}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => !isExternal && onEdit?.(event)}
    >
      {/* Drag handle (visible on hover for draggable events) */}
      {draggable && !isExternal && (
        <div
          className="absolute left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          style={{ color: event.color_code }}
        >
          <GripVertical size={12} />
        </div>
      )}

      <div className="px-2 py-1.5 h-full flex flex-col justify-between min-h-[28px]">
        {/* Header row */}
        <div className="flex items-start gap-1.5">
          {/* To-do checkbox */}
          {event.is_todo && !isExternal && (
            <button
              className="shrink-0 mt-0.5 hover:scale-110 transition-transform"
              style={{ color: event.color_code }}
              onClick={e => {
                e.stopPropagation();
                onToggleComplete?.(event.id);
              }}
              title={event.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {event.is_completed
                ? <CheckSquare size={13} />
                : <Square size={13} />
              }
            </button>
          )}

          {/* Icon */}
          <span style={{ color: event.color_code }} className="shrink-0 mt-0.5">
            <EventIcon iconName={config.icon} size={12} />
          </span>

          {/* Title */}
          <span
            className="text-xs font-medium leading-tight line-clamp-2 flex-1"
            style={{
              color: event.color_code,
              textDecoration: isCompleted ? 'line-through' : 'none',
              opacity: isCompleted ? 0.6 : 1,
            }}
          >
            {event.title}
          </span>

          {/* Lock badge for external events */}
          {isExternal && (
            <span
              className="shrink-0 mt-0.5 opacity-50"
              title="External event — read only"
              style={{ color: event.color_code }}
            >
              <Lock size={10} />
            </span>
          )}

          {/* Recurrence badge */}
          {event.is_recurring && !isExternal && (
            <span className="shrink-0 mt-0.5 opacity-50" style={{ color: event.color_code }} title="Recurring">
              <RotateCcw size={10} />
            </span>
          )}
        </div>

        {/* Time / location sub-row */}
        {event.location && (
          <div className="flex items-center gap-0.5 mt-0.5 opacity-60">
            <MapPin size={9} style={{ color: event.color_code }} />
            <span className="text-[10px] truncate" style={{ color: event.color_code }}>
              {event.location}
            </span>
          </div>
        )}
      </div>

      {/* Hover actions (user events only) */}
      {!isExternal && showActions && (
        <div
          className="absolute top-1 right-1 flex gap-0.5 z-10"
          onClick={e => e.stopPropagation()}
        >
          <button
            className="p-1 rounded hover:bg-white/20 transition-colors"
            style={{ color: event.color_code }}
            onClick={() => onEdit?.(event)}
            title="Edit event"
          >
            <Edit2 size={10} />
          </button>
          <button
            className="p-1 rounded hover:bg-red-500/20 transition-colors text-red-400"
            onClick={() => onDelete?.(event.id)}
            title="Delete event"
          >
            <Trash2 size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
