'use client';

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { BookOpen, GraduationCap, Building2, Dumbbell, FileText, Coffee, AlertCircle, Users, Lock, CheckSquare, Square, Edit2, Trash2, MapPin, RotateCcw, Zap } from 'lucide-react';
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const config = EVENT_TYPE_CONFIG[event.event_type];
  const isExternal = event.event_source !== 'user';
  const isCompleted = event.is_todo && event.is_completed;

  // Live / past detection
  const now = new Date();
  const startTime = event.start_time ? new Date(event.start_time) : null;
  const endTime = event.end_time ? new Date(event.end_time) : null;
  const isLive = !event.all_day && startTime && endTime && now >= startTime && now <= endTime;
  const isPast = !event.all_day && endTime ? now > endTime : startTime ? now > startTime : false;

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
    opacity: isDragging ? 0.5 : isPast ? 0.5 : 1,
    transition: isDndDragging ? 'none' : 'opacity 0.2s, box-shadow 0.2s',
    zIndex: isDragging ? 50 : isLive ? 5 : 1,
    ...(isLive ? { boxShadow: `0 0 12px ${event.color_code}40`, borderLeftWidth: '4px' } : {}),
  };

  if (transform) {
    blockStyle.transform = `translate3d(${transform.x}px, ${transform.y}px, 0)`;
  }

  if (compact) {
    // Month view chip
    return (
      <div
        className="flex items-start gap-1 px-1.5 py-1 rounded text-[11px] cursor-pointer overflow-hidden group hover:z-30 hover:scale-[1.02] hover:shadow-md transition-all duration-150"
        style={{ backgroundColor: config.bgColor, borderLeft: `2.5px solid ${event.color_code}` }}
        onClick={() => onEdit?.(event)}
        title={event.title}
      >
        <EventIcon iconName={config.icon} size={10} />
        <span
          className="leading-tight break-words whitespace-normal flex-1 font-medium text-[11px]"
          style={{ color: event.color_code, textDecoration: isCompleted ? 'line-through' : 'none' }}
        >
          {event.title}
        </span>
        {isExternal && <Lock size={8} className="shrink-0 opacity-60 mt-0.5" style={{ color: event.color_code }} />}
      </div>
    );
  }

  const isShortBlock = heightPx !== undefined && heightPx < 45;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="relative rounded-md overflow-hidden cursor-pointer group select-none hover:z-50 hover:scale-[1.02] hover:shadow-2xl transition-all duration-150"
      style={blockStyle}
      onMouseEnter={() => { setShowActions(true); setConfirmDelete(false); }}
      onMouseLeave={() => { setShowActions(false); setConfirmDelete(false); }}
      onClick={() => { if (!isExternal) setShowActions((prev) => !prev); }}
    >
      <div className={`px-1.5 sm:px-2 py-1 sm:py-1.5 h-full flex flex-col justify-between ${isShortBlock ? 'min-h-[22px]' : 'min-h-[36px]'}`}>
        {/* Header row */}
        <div className="flex items-start gap-1">
          {/* To-do checkbox */}
          {event.is_todo && !isExternal && (
            <button
              className="shrink-0 mt-[1px] hover:scale-110 transition-transform"
              style={{ color: event.color_code }}
              onClick={e => {
                e.stopPropagation();
                onToggleComplete?.(event.id);
              }}
              title={event.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {event.is_completed
                ? <CheckSquare size={11} />
                : <Square size={11} />
              }
            </button>
          )}

          {/* Title — full text wrapping */}
          <span
            className="text-[11px] sm:text-[12px] font-semibold leading-[1.2] break-words whitespace-normal text-wrap flex-1 min-w-0"
            style={{
              color: event.color_code,
              textDecoration: isCompleted ? 'line-through' : 'none',
              opacity: isCompleted ? 0.6 : 1,
            }}
          >
            {event.title}
          </span>

          {/* LIVE NOW badge */}
          {isLive && (
            <span
              className="shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide animate-pulse"
              style={{
                backgroundColor: '#6366F1',
                color: '#FFFFFF',
              }}
            >
              <Zap size={7} />
              LIVE
            </span>
          )}

          {/* Recurrence badge — visible on hover or wide block */}
          {event.is_recurring && !isExternal && (
            <span className="shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: event.color_code }} title="Recurring">
              <RotateCcw size={9} />
            </span>
          )}
        </div>

        {/* Time / location sub-row — visible if space permits or on hover */}
        {event.location && (!isShortBlock || showActions) && (
          <div className="flex items-center gap-0.5 mt-0.5 opacity-60">
            <MapPin size={8} style={{ color: event.color_code }} />
            <span className="text-[9.5px] break-words whitespace-normal leading-tight" style={{ color: event.color_code }}>
              {event.location}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons on hover/click (user events only) */}
      {!isExternal && showActions && (
        <div
          className="absolute top-1 right-1 flex gap-0.5 z-10 rounded-lg px-1 py-0.5 border"
          style={{
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderColor: 'rgba(0,0,0,0.08)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="p-1 rounded-full transition-colors hover:bg-black/[0.06]"
            style={{ color: '#475569' }}
            onClick={() => onEdit?.(event)}
            title="Edit event"
          >
            <Edit2 size={11} />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-0.5 pl-0.5 border-l border-black/10">
              <span className="text-[10px] text-rose-600 font-medium px-1">Delete?</span>
              <button
                className="p-1 rounded-full transition-colors bg-rose-500 text-white hover:bg-rose-600"
                onClick={() => {
                  onDelete?.(event.id);
                  setConfirmDelete(false);
                  setShowActions(false);
                }}
                title="Confirm delete"
              >
                <CheckSquare size={11} />
              </button>
            </div>
          ) : (
            <button
              className="p-1 rounded-full transition-colors hover:bg-rose-500/10"
              style={{ color: '#E11D48' }}
              onClick={() => { setConfirmDelete(true); }}
              title="Delete event"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
