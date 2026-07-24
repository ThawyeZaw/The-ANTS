'use client';

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { BookOpen, GraduationCap, Building2, Dumbbell, FileText, Coffee, AlertCircle, Users, Lock, CheckSquare, Square, Edit2, Trash2, MapPin, RotateCcw, CalendarPlus, Link2, Copy, Zap } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const config = EVENT_TYPE_CONFIG[event.event_type];
  const isExternal = event.event_source !== 'user';
  const isCompleted = event.is_todo && event.is_completed;

  // Live / past detection
  const now = new Date();
  const startTime = event.start_time ? new Date(event.start_time) : null;
  const endTime = event.end_time ? new Date(event.end_time) : null;
  const isLive = !event.all_day && startTime && endTime && now >= startTime && now <= endTime;
  const isPast = !event.all_day && endTime ? now > endTime : startTime ? now > startTime : false;

  // Generate .ics file content and trigger download
  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dtStart = startTime
      ? startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      : '';
    const dtEnd = endTime
      ? endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      : '';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//The ANTS//Timetable//EN',
      'BEGIN:VEVENT',
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      event.location ? `LOCATION:${event.location}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#event-${event.id}`;
    navigator.clipboard.writeText(url).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
  };

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
      <div className="px-4 py-3 h-full flex flex-col justify-between min-h-[40px]">
        {/* Header row */}
        <div className="flex items-start gap-2">
          {/* To-do checkbox */}
          {event.is_todo && !isExternal && (
            <button
              className="shrink-0 mt-[3px] hover:scale-110 transition-transform"
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
          <span style={{ color: event.color_code }} className="shrink-0 mt-[3px]">
            <EventIcon iconName={config.icon} size={12} />
          </span>

          {/* Title */}
          <span
            className="text-sm font-semibold leading-tight line-clamp-2 flex-1"
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
              className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide animate-pulse"
              style={{
                backgroundColor: '#6366F1',
                color: '#FFFFFF',
              }}
            >
              <Zap size={8} />
              LIVE
            </span>
          )}

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
          className="absolute top-1 right-1 flex gap-0.5 z-10 rounded-lg px-1 py-0.5 border"
          style={{
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderColor: 'rgba(0,0,0,0.08)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Calendar download */}
          <button
            className="p-1 rounded-full transition-colors hover:bg-black/[0.06]"
            style={{ color: '#475569' }}
            onClick={handleAddToCalendar}
            title="Download .ics / Add to calendar"
          >
            {copied ? <Copy size={11} /> : <CalendarPlus size={11} />}
          </button>
          {/* Copy link */}
          <button
            className="p-1 rounded-full transition-colors hover:bg-black/[0.06]"
            style={{ color: '#475569' }}
            onClick={handleCopyLink}
            title="Copy direct link to event"
          >
            <Link2 size={11} />
          </button>
          <button
            className="p-1 rounded-full transition-colors hover:bg-black/[0.06]"
            style={{ color: '#475569' }}
            onClick={() => onEdit?.(event)}
            title="Edit event"
          >
            <Edit2 size={11} />
          </button>
          <button
            className="p-1 rounded-full transition-colors hover:bg-rose-500/10"
            style={{ color: '#E11D48' }}
            onClick={() => onDelete?.(event.id)}
            title="Delete event"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}

      {/* Hover actions for external events (quick actions only) */}
      {isExternal && showActions && (
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
            onClick={handleAddToCalendar}
            title="Download .ics / Add to calendar"
          >
            {copied ? <Copy size={11} /> : <CalendarPlus size={11} />}
          </button>
          <button
            className="p-1 rounded-full transition-colors hover:bg-black/[0.06]"
            style={{ color: '#475569' }}
            onClick={handleCopyLink}
            title="Copy direct link to event"
          >
            <Link2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
