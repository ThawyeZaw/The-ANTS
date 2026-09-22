'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LayoutGrid,
  List,
  ListChecks,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import type { TimetableEvent, TimetableEventFormData, TimetableView } from '@/types/timetable';
import { useAuth } from '@/hooks/useAuth';
import { combineDateTime, formatDateLocal, useTimetable } from '@/hooks/useTimetable';
import { GRID_END_HOUR, GRID_START_HOUR, SNAP_MINUTES } from '@/constants/timetable';
import { useGamificationFeedback } from '@/components/gamification/GamificationFeedbackProvider';
import { cn } from '@/lib/utils';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
import TaskListView from './TaskListView';
import TaskSheet from './TaskSheet';
import WeekStrip from './WeekStrip';
import { TIME_GRID_SLOT, type InlineSlot } from './TimeGrid';
import { TASK_COLOURS, addMinutes, formatDateKey } from './task-utils';

type DayMode = 'agenda' | 'schedule';

const VIEW_OPTIONS: { id: TimetableView; label: string; icon: typeof CalendarDays }[] = [
  { id: 'day', label: 'Day', icon: CalendarDays },
  { id: 'week', label: 'Week', icon: CalendarRange },
  { id: 'month', label: 'Month', icon: LayoutGrid },
  { id: 'list', label: 'Tasks', icon: ListChecks },
];

function heading(view: TimetableView, currentDate: Date, weekStart: Date): { title: string; subtitle: string } {
  const month = currentDate.toLocaleDateString(undefined, { month: 'long' });
  const today = new Date();
  const sameDay =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getDate() === today.getDate();

  if (view === 'list') return { title: 'Tasks', subtitle: 'Every item on your timetable is a task' };
  if (view === 'month') return { title: `${month} ${currentDate.getFullYear()}`, subtitle: 'Tap a day to open it' };
  if (view === 'week') {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const range =
      weekStart.getMonth() === end.getMonth()
        ? `${weekStart.getDate()}–${end.getDate()}`
        : `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    return { title: month, subtitle: range };
  }
  if (sameDay) return { title: month, subtitle: 'Today' };
  return {
    title: currentDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric' }),
    subtitle: `${month} ${currentDate.getFullYear()}`,
  };
}

function blankTask(partial: Partial<TimetableEventFormData> & Pick<TimetableEventFormData, 'title' | 'date' | 'color_code' | 'time_mode'>): TimetableEventFormData {
  return {
    description: '',
    event_type: 'study',
    subject: '',
    location: '',
    start_time: '09:00',
    end_time: '10:00',
    is_todo: true,
    is_recurring: false,
    recurrence_rule: null,
    reminder_minutes: null,
    ...partial,
  };
}

export default function TimetableManager({ userId: userIdProp }: { userId?: string }) {
  const { user } = useAuth();
  const userId = userIdProp ?? user?.id ?? '';
  const {
    view,
    currentDate,
    filters,
    events,
    isLoading,
    weekStart,
    navigate,
    goToToday,
    goToDate,
    setView,
    setFilters,
    getEventsForDay,
    getEventsForWeek,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleComplete,
    moveEvent,
  } = useTimetable(userId);

  const { handleAwardResult } = useGamificationFeedback();
  const [dayMode, setDayMode] = useState<DayMode>('agenda');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimetableEvent | null>(null);
  const [sheetDate, setSheetDate] = useState<Date | undefined>();
  const [sheetTime, setSheetTime] = useState<string | undefined>();
  const [sheetAllDay, setSheetAllDay] = useState<boolean | undefined>();
  const [inlineCreate, setInlineCreate] = useState<InlineSlot | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<TimetableEvent | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('ants-timetable-day-mode');
      if (saved === 'agenda' || saved === 'schedule') setDayMode(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setMode = (mode: DayMode) => {
    setDayMode(mode);
    setInlineCreate(null);
    try {
      window.localStorage.setItem('ants-timetable-day-mode', mode);
    } catch {
      /* ignore */
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const { title, subtitle } = heading(view, currentDate, weekStart);
  const dayEvents = getEventsForDay(currentDate);
  const weekEvents = getEventsForWeek(weekStart);
  const markedDates = useMemo(() => {
    const marks = new Set<string>();
    for (const event of events) {
      const anchor = event.start_time || event.end_time;
      if (anchor) marks.add(formatDateKey(new Date(anchor)));
    }
    return marks;
  }, [events]);
  const nextColor = TASK_COLOURS[events.length % TASK_COLOURS.length];

  const openSheet = useCallback((options?: { event?: TimetableEvent | null; date?: Date; time?: string; allDay?: boolean }) => {
    setEditingEvent(options?.event ?? null);
    setSheetDate(options?.date);
    setSheetTime(options?.time);
    setSheetAllDay(options?.allDay);
    setInlineCreate(null);
    setSheetOpen(true);
    setMenuOpen(false);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setEditingEvent(null);
  }, []);

  const openEdit = useCallback((event: TimetableEvent) => {
    if (event.event_source !== 'user') return;
    openSheet({ event });
  }, [openSheet]);

  const saveTask = useCallback(async (data: TimetableEventFormData) => {
    const result = editingEvent ? await updateEvent(editingEvent.id, data) : await createEvent(data);
    if (!result.success) throw new Error(result.error || 'Could not save this task');
  }, [createEvent, editingEvent, updateEvent]);

  const removeTask = useCallback(async () => {
    if (!editingEvent) return;
    const result = await deleteEvent(editingEvent.id);
    if (!result.success) {
      setNotice(result.error || 'Could not delete this task');
      return;
    }
    closeSheet();
  }, [closeSheet, deleteEvent, editingEvent]);

  const quickAdd = useCallback(async (titleText: string) => {
    const date = view === 'list' ? new Date() : currentDate;
    const result = await createEvent(blankTask({
      title: titleText,
      date: formatDateLocal(date),
      color_code: nextColor,
      time_mode: 'all_day',
    }));
    if (!result.success) setNotice(result.error || 'Could not add that task');
  }, [createEvent, currentDate, nextColor, view]);

  const submitInline = useCallback(async (titleText: string) => {
    if (!inlineCreate) return;
    const result = await createEvent(blankTask({
      title: titleText,
      date: inlineCreate.date,
      start_time: inlineCreate.time,
      end_time: addMinutes(inlineCreate.time, 60),
      color_code: nextColor,
      time_mode: 'timed',
    }));
    if (!result.success) setNotice(result.error || 'Could not add that task');
    setInlineCreate(null);
  }, [createEvent, inlineCreate, nextColor]);

  const onToggle = useCallback(async (id: string) => {
    const result = await toggleComplete(id);
    if (result.gamification) handleAwardResult(result.gamification);
    if (!result.success) setNotice(result.error || 'Could not update that task');
  }, [handleAwardResult, toggleComplete]);

  const handleDragStart = useCallback((drag: DragStartEvent) => {
    const event = drag.active.data.current?.event as TimetableEvent | undefined;
    setActiveDrag(event ?? null);
  }, []);

  const handleDragEnd = useCallback((drag: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over, delta } = drag;
    if (!over) return;
    const dragged = active.data.current?.event as TimetableEvent | undefined;
    const drop = over.data.current as { date?: string; hour?: number } | undefined;
    if (!dragged?.start_time || !drop?.date || drop.hour === undefined) return;
    if (dragged.is_recurring || dragged.event_source !== 'user') return;

    const draggedStart = new Date(dragged.start_time);
    const draggedEnd = dragged.end_time ? new Date(dragged.end_time) : null;
    const totalMinutes = draggedStart.getHours() * 60 + draggedStart.getMinutes() + Math.round(delta.y / (TIME_GRID_SLOT / 60));
    const snapped = Math.round(totalMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    const clamped = Math.max(GRID_START_HOUR * 60, Math.min((GRID_END_HOUR + 1) * 60 - 15, snapped));
    const hour = Math.floor(clamped / 60);
    const minute = clamped % 60;
    const newStart = combineDateTime(drop.date, `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    const newEnd = draggedEnd
      ? new Date(new Date(newStart).getTime() + (draggedEnd.getTime() - draggedStart.getTime())).toISOString()
      : null;
    void moveEvent(dragged.id, newStart, newEnd);
  }, [moveEvent]);

  const scheduleEvents = view === 'week' ? weekEvents : dayEvents;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background text-foreground pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-0">
      <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 px-2 pt-2 sm:px-4">
          <div className="flex items-center">
            {view !== 'list' && (
              <button type="button" onClick={() => navigate('prev')} className="flex h-10 w-10 items-center justify-center rounded-full text-foreground-muted hover:bg-foreground/5" aria-label="Previous">
                <ChevronLeft size={20} />
              </button>
            )}
          </div>
          <button type="button" onClick={goToToday} className="min-w-0 px-1 text-center">
            <span className="block truncate text-base font-semibold leading-tight sm:text-lg">{title}</span>
            <span className="block truncate text-xs text-foreground-muted">
              {isLoading ? 'Loading tasks…' : subtitle}
            </span>
          </button>
          <div className="flex items-center justify-end">
            {view !== 'list' && (
              <button type="button" onClick={() => navigate('next')} className="flex h-10 w-10 items-center justify-center rounded-full text-foreground-muted hover:bg-foreground/5" aria-label="Next">
                <ChevronRight size={20} />
              </button>
            )}
            <div className="relative">
              <button
                type="button"
                aria-label="More options"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground-muted hover:bg-foreground/5"
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-40 mt-1 w-56 rounded-2xl border border-border bg-background-card p-2 shadow-xl">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-foreground/5"
                      onClick={() => setFilters({ ...filters, showCompleted: !filters.showCompleted })}
                    >
                      <span>Show completed</span>
                      <span
                        className={cn('flex h-5 w-5 items-center justify-center rounded-md border', filters.showCompleted ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}
                      >
                        {filters.showCompleted ? <Check size={12} strokeWidth={3} /> : null}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-foreground/5"
                      onClick={() => {
                        goToToday();
                        setMenuOpen(false);
                      }}
                    >
                      Jump to today
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
          <div className="grid min-w-0 flex-1 grid-cols-4 rounded-2xl bg-background-secondary p-1" role="tablist" aria-label="Timetable view">
            {VIEW_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = view === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setView(option.id);
                    setInlineCreate(null);
                  }}
                  className={cn(
                    'flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold sm:text-sm',
                    active ? 'bg-background-card text-foreground shadow-sm' : 'text-foreground-muted'
                  )}
                  aria-label={option.label}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              );
            })}
          </div>
          {view === 'day' && (
            <div className="flex shrink-0 rounded-2xl bg-background-secondary p-1">
              <button
                type="button"
                aria-label="Agenda"
                aria-pressed={dayMode === 'agenda'}
                onClick={() => setMode('agenda')}
                className={cn('flex h-9 w-9 items-center justify-center rounded-xl', dayMode === 'agenda' ? 'bg-background-card text-foreground shadow-sm' : 'text-foreground-muted')}
              >
                <List size={16} />
              </button>
              <button
                type="button"
                aria-label="Schedule"
                aria-pressed={dayMode === 'schedule'}
                onClick={() => setMode('schedule')}
                className={cn('flex h-9 w-9 items-center justify-center rounded-xl', dayMode === 'schedule' ? 'bg-background-card text-foreground shadow-sm' : 'text-foreground-muted')}
              >
                <Clock3 size={16} />
              </button>
            </div>
          )}
        </div>

        {view === 'day' && (
          <WeekStrip
            weekStart={weekStart}
            selected={currentDate}
            markedDates={markedDates}
            onSelect={(date) => {
              goToDate(date);
              setInlineCreate(null);
            }}
          />
        )}
      </header>

      {notice && (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-red-500/10 px-4 py-2 text-sm text-red-600">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-medium">Dismiss</button>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="min-h-0 flex-1">
          {view === 'day' && (
            <DayView
              mode={dayMode}
              currentDate={currentDate}
              events={dayEvents}
              isDragging={Boolean(activeDrag)}
              inlineCreate={inlineCreate}
              onSlotClick={(date, time) => setInlineCreate({ date: formatDateLocal(date), time })}
              onEditEvent={openEdit}
              onToggleComplete={(id) => void onToggle(id)}
              onQuickAdd={(titleText) => void quickAdd(titleText)}
              onInlineSubmit={(titleText) => void submitInline(titleText)}
              onInlineCancel={() => setInlineCreate(null)}
              onInlineExpand={() => {
                if (!inlineCreate) return;
                const [year, month, day] = inlineCreate.date.split('-').map(Number);
                openSheet({
                  date: new Date(year, month - 1, day),
                  time: inlineCreate.time,
                  allDay: false,
                });
              }}
            />
          )}
          {view === 'week' && (
            <WeekView
              weekStart={weekStart}
              selectedDate={currentDate}
              events={weekEvents}
              isDragging={Boolean(activeDrag)}
              inlineCreate={inlineCreate}
              onSlotClick={(date, time) => setInlineCreate({ date: formatDateLocal(date), time })}
              onEditEvent={openEdit}
              onToggleComplete={(id) => void onToggle(id)}
              onInlineSubmit={(titleText) => void submitInline(titleText)}
              onInlineCancel={() => setInlineCreate(null)}
              onInlineExpand={() => {
                if (!inlineCreate) return;
                const [year, month, day] = inlineCreate.date.split('-').map(Number);
                openSheet({ date: new Date(year, month - 1, day), time: inlineCreate.time, allDay: false });
              }}
              onDayHeaderClick={(date) => {
                goToDate(date);
                setView('day');
                setMode('agenda');
              }}
            />
          )}
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onDayClick={(date) => {
                goToDate(date);
                setView('day');
              }}
              onEditEvent={openEdit}
              onCreateOnDay={(date) => openSheet({ date, allDay: true })}
            />
          )}
          {view === 'list' && (
            <TaskListView
              events={events}
              onEditEvent={openEdit}
              onToggleComplete={(id) => void onToggle(id)}
              onQuickAdd={(titleText) => void quickAdd(titleText)}
            />
          )}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeDrag ? (
            <div className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-lg">
              {activeDrag.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <button
        type="button"
        onClick={() => openSheet({ date: view === 'list' ? new Date() : currentDate, allDay: true })}
        className="absolute right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+0.75rem)] md:bottom-6 md:right-6"
        aria-label="Add a task"
      >
        <Plus size={26} />
      </button>

      <TaskSheet
        isOpen={sheetOpen}
        onClose={closeSheet}
        onSave={saveTask}
        onDelete={editingEvent ? removeTask : undefined}
        event={editingEvent}
        defaultDate={sheetDate ?? currentDate}
        defaultStartTime={sheetTime}
        defaultAllDay={sheetAllDay}
      />
    </div>
  );
}
