'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Todo Panel
// Shows all timetable events flagged as is_todo, grouped by day.
// Backed by the existing useTimetable hook — no new backend needed.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  ClipboardList,
  Calendar,
  Clock,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateLocal } from '@/hooks/useTimetable';
import type { TimetableEvent, TimetableEventFormData } from '@/types/timetable';
import { EVENT_TYPE_CONFIG } from '@/constants/timetable';

type TodoFilter = 'today' | 'week' | 'all';

interface TodoPanelProps {
  events: TimetableEvent[];
  onToggleComplete: (id: string) => Promise<{ success: boolean }>;
  onCreateTodo: (data: Partial<TimetableEventFormData>) => Promise<{ success: boolean }>;
  isLoading?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayStr() { return formatDateLocal(new Date()); }
function weekEndStr() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return formatDateLocal(d);
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (formatDateLocal(d) === formatDateLocal(today)) return 'Today';
  if (formatDateLocal(d) === formatDateLocal(tomorrow)) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── Todo item ─────────────────────────────────────────────────────────────────
function TodoItem({
  event,
  onToggle,
}: {
  event: TimetableEvent;
  onToggle: (id: string) => void;
}) {
  const [optimistic, setOptimistic] = useState(event.is_completed);
  const cfg = EVENT_TYPE_CONFIG[event.event_type];
  const timeStr = formatTime(event.end_time || event.start_time);

  const handleToggle = useCallback(() => {
    setOptimistic((v) => !v);
    onToggle(event.id);
  }, [event.id, onToggle]);

  return (
    <div className={cn(
      'group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200',
      optimistic
        ? 'border-border/40 bg-background-secondary/40 opacity-60'
        : 'border-border bg-background-card hover:border-border-hover hover:shadow-xs'
    )}>
      <button
        type="button"
        onClick={handleToggle}
        className="shrink-0 mt-0.5 text-foreground-muted hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
        aria-label={optimistic ? 'Mark incomplete' : 'Mark complete'}
      >
        {optimistic
          ? <CheckCircle2 className="w-4.5 h-4.5 text-primary" />
          : <Circle className="w-4.5 h-4.5" />
        }
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium leading-snug truncate transition-all',
          optimistic ? 'line-through text-foreground-muted' : 'text-foreground'
        )}>
          {event.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {event.subject && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: `${cfg?.color ?? '#6366f1'}18`,
                color: cfg?.color ?? '#6366f1',
              }}
            >
              {event.subject}
            </span>
          )}
          {timeStr && (
            <span className="flex items-center gap-0.5 text-[10px] text-foreground-muted">
              <Clock className="w-2.5 h-2.5" />
              {timeStr}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Quick-add input ───────────────────────────────────────────────────────────
function QuickAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('');

  const submit = useCallback(() => {
    const t = value.trim();
    if (!t) return;
    onAdd(t);
    setValue('');
  }, [value, onAdd]);

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        placeholder="Add a task…"
        className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl border border-border bg-background-secondary text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim()}
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Add task"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function TodoPanel({ events, onToggleComplete, onCreateTodo, isLoading }: TodoPanelProps) {
  const [filter, setFilter] = useState<TodoFilter>('week');
  const [showCompleted, setShowCompleted] = useState(false);

  // Filter to todo events only
  const todos = useMemo(() => {
    return events.filter((e) => e.is_todo);
  }, [events]);

  // Apply date filter
  const filtered = useMemo(() => {
    const today = todayStr();
    const weekEnd = weekEndStr();
    return todos.filter((e) => {
      const dateStr = e.end_time
        ? formatDateLocal(new Date(e.end_time))
        : e.start_time
          ? formatDateLocal(new Date(e.start_time))
          : null;

      if (!showCompleted && e.is_completed) return false;

      switch (filter) {
        case 'today':
          return dateStr === today;
        case 'week':
          return !dateStr || (dateStr >= today && dateStr <= weekEnd);
        case 'all':
          return true;
      }
    });
  }, [todos, filter, showCompleted]);

  // Group by day
  const groups = useMemo(() => {
    const map = new Map<string, TimetableEvent[]>();
    for (const e of filtered) {
      const dateStr = e.end_time
        ? formatDateLocal(new Date(e.end_time))
        : e.start_time
          ? formatDateLocal(new Date(e.start_time))
          : 'no-date';
      const current = map.get(dateStr) ?? [];
      map.set(dateStr, [...current, e]);
    }
    // Sort by date
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === 'no-date') return 1;
      if (b === 'no-date') return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  const pendingCount = todos.filter((e) => !e.is_completed).length;
  const completedCount = todos.filter((e) => e.is_completed).length;

  const handleAdd = useCallback(async (title: string) => {
    await onCreateTodo({
      title,
      event_type: 'study',
      is_todo: true,
      time_mode: 'deadline',
      date: todayStr(),
      end_time: '23:59',
      start_time: '00:00',
      description: '',
      subject: '',
      location: '',
      color_code: '#d97706',
      is_recurring: false,
      recurrence_rule: null,
      reminder_minutes: null,
    });
  }, [onCreateTodo]);

  return (
    <div className="flex flex-col h-full bg-background-card border-l border-border">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            Tasks
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
                {pendingCount}
              </span>
            )}
          </h2>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowCompleted((v) => !v)}
              className="text-[10px] font-semibold text-foreground-muted hover:text-foreground transition-colors"
            >
              {showCompleted ? 'Hide done' : `Show ${completedCount} done`}
            </button>
          )}
        </div>

        {/* Quick add */}
        <QuickAdd onAdd={handleAdd} />

        {/* Filter tabs */}
        <div className="flex gap-1 p-0.5 bg-background-secondary rounded-xl">
          {(['today', 'week', 'all'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 py-1 text-[11px] font-semibold rounded-lg capitalize transition-all',
                filter === f
                  ? 'bg-background-card text-foreground shadow-xs'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              {f === 'week' ? 'This Week' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-background-secondary" />)}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">All caught up!</p>
            <p className="text-xs text-foreground-muted max-w-[180px] leading-relaxed">
              Add tasks using the input above, or mark events as todos in the calendar.
            </p>
          </div>
        ) : (
          groups.map(([dateStr, items]) => (
            <div key={dateStr} className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-3 h-3 text-foreground-muted shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                  {dateStr === 'no-date' ? 'No due date' : formatShortDate(
                    dateStr === todayStr() ? new Date().toISOString() : `${dateStr}T00:00:00`
                  )}
                </span>
                <span className="text-[10px] text-foreground-muted">
                  ({items.filter((e) => !e.is_completed).length} remaining)
                </span>
              </div>
              {items.map((e) => (
                <TodoItem key={e.id} event={e} onToggle={onToggleComplete} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
