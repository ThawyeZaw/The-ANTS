'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import type { TimetableEventType } from '@/types/timetable';
import { EVENT_TYPE_CONFIG, ALL_EVENT_TYPES } from '@/constants/timetable';

interface InlineCreateProps {
  /** Date for the new event */
  date: Date;
  /** Optional pre-filled start time (HH:mm) */
  startTime?: string;
  /** Pixel offset from top of the grid for positioning */
  topPx?: number;
  /** Called when user submits (Enter key) */
  onSubmit: (title: string, eventType: TimetableEventType) => void;
  /** Called when user wants to open the full event creation modal */
  onMore?: (title: string, eventType: TimetableEventType) => void;
  /** Called when user cancels (Escape or blur) */
  onCancel: () => void;
}

export default function InlineCreate({ topPx, onSubmit, onMore, onCancel }: InlineCreateProps) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<TimetableEventType>('study');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus and position cursor
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    onSubmit(trimmed, eventType);
  }, [title, eventType, onSubmit, onCancel]);

  const handleMore = useCallback(() => {
    onMore?.(title.trim(), eventType);
  }, [title, eventType, onMore]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [handleSubmit, onCancel]);

  const config = EVENT_TYPE_CONFIG[eventType];

  return (
    <div
      className="absolute left-2 right-2 z-30 rounded-lg p-2.5 flex flex-col gap-2 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
      style={{
        top: topPx ?? 0,
        backgroundColor: 'var(--background-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Title input */}
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Small delay to allow button clicks
          setTimeout(onCancel, 200);
        }}
        placeholder="Event title…"
        className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-foreground-muted outline-none"
        autoComplete="off"
      />

      {/* Quick type picker + action buttons */}
      <div className="flex items-center gap-1.5">
        {/* Type chips (compact) */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
          {ALL_EVENT_TYPES.map(type => {
            const cfg = EVENT_TYPE_CONFIG[type];
            const isActive = type === eventType;
            return (
              <button
                key={type}
                type="button"
                onMouseDown={e => e.preventDefault()} // prevent blur
                onClick={() => setEventType(type)}
                className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? cfg.bgColor : 'color-mix(in srgb, var(--border) 20%, transparent)',
                  color: isActive ? cfg.color : 'var(--foreground-muted)',
                }}
                title={cfg.label}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* 'More...' button to open full modal */}
        {onMore && (
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={handleMore}
            className="shrink-0 px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors hover:bg-accent"
            style={{
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            }}
            title="Open full event creation modal"
          >
            <SlidersHorizontal size={11} />
            <span>More</span>
          </button>
        )}

        {/* Submit button */}
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="shrink-0 px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-30"
          style={{
            backgroundColor: config.color,
            color: 'white',
          }}
        >
          <Plus size={12} />
          <span>Add</span>
        </button>
      </div>

      <p className="text-[9px] text-foreground-muted flex justify-between items-center">
        <span>Press Enter to create · Esc to cancel</span>
        {onMore && <span className="opacity-75 font-medium">Click More for reminders & recurrence</span>}
      </p>
    </div>
  );
}
