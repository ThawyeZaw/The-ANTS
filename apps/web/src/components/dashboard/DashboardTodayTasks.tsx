'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — DashboardTodayTasks
// Compact widget for Student Dashboard displaying today's tasks and time-blocks.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { actionGetTimetableEvents, toggleEventCompleteAction } from '@/actions/timetable';
import type { TimetableEvent } from '@/types/timetable';
import { cn } from '@/lib/utils';

function formatEventTime(isoString?: string | null, allDay?: boolean): string {
  if (allDay || !isoString) return 'All day';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function DashboardTodayTasks() {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }, []);

  const loadTodayEvents = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const all = await actionGetTimetableEvents(user.id);
      setEvents(all);
    } catch (err) {
      console.error('[DashboardTodayTasks] Failed to load timetable events:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadTodayEvents();
  }, [loadTodayEvents]);

  // Filter for today's events
  const todayEvents = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const sTime = startOfToday.getTime();
    const eTime = endOfToday.getTime();

    return events.filter((e) => {
      const anchor = e.start_time || e.end_time;
      if (!anchor) return false;
      const t = new Date(anchor).getTime();
      return !Number.isNaN(t) && t >= sTime && t <= eTime;
    });
  }, [events]);

  const openEvents = useMemo(() => todayEvents.filter((e) => !e.is_completed), [todayEvents]);
  const doneCount = todayEvents.length - openEvents.length;

  const handleToggle = async (eventId: string) => {
    if (!user?.id) return;
    // Optimistic update
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, is_completed: !e.is_completed } : e))
    );
    try {
      await toggleEventCompleteAction(eventId, user.id);
    } catch (err) {
      console.error('[DashboardTodayTasks] Toggle completion error:', err);
      // Revert on error
      void loadTodayEvents();
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-background-card p-5 shadow-xs flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CalendarDays className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-tight">Today's Schedule</h3>
            <p className="text-[11px] text-foreground-muted">
              {todayStr} · <span className="font-semibold text-foreground">{openEvents.length} open</span>
              {doneCount > 0 && <span>, {doneCount} done</span>}
            </p>
          </div>
        </div>

        <Link
          href="/timetable"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          Timetable <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Task List */}
      <div className="flex-1">
        {loading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-background-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : todayEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background-secondary/40 p-4 text-center">
            <p className="text-xs font-semibold text-foreground">You're clear for today!</p>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              No tasks scheduled for today. Plan study sessions in your timetable.
            </p>
            <Link
              href="/timetable"
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Plan in Timetable
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {todayEvents.slice(0, 5).map((event) => {
              const color = event.color_code || '#d97706';
              const timeDisplay = formatEventTime(event.start_time, event.all_day);

              return (
                <div
                  key={event.id}
                  className={cn(
                    'group flex items-center justify-between gap-2.5 rounded-xl border border-border/60 bg-background-secondary/50 px-3 py-2 transition-all hover:bg-background-secondary',
                    event.is_completed && 'opacity-60 bg-background-secondary/20'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(event.id)}
                      className="shrink-0 text-foreground-muted hover:text-primary transition-colors cursor-pointer"
                      title={event.is_completed ? 'Mark pending' : 'Mark done'}
                    >
                      {event.is_completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4" style={{ color }} />
                      )}
                    </button>
                    <span
                      className={cn(
                        'text-xs font-medium text-foreground truncate',
                        event.is_completed && 'line-through text-foreground-muted'
                      )}
                    >
                      {event.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {timeDisplay && (
                      <span className="font-mono text-[10px] tabular-nums text-foreground-muted">
                        {timeDisplay}
                      </span>
                    )}
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}

            {todayEvents.length > 5 && (
              <Link
                href="/timetable"
                className="block text-center text-[11px] font-semibold text-primary pt-1 hover:underline"
              >
                +{todayEvents.length - 5} more tasks in timetable
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
