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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ListChecks,
  MoreHorizontal,
  Plus,
  ZoomIn,
  ZoomOut,
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
import TaskEditor from './TaskEditor';
import WeekStrip from './WeekStrip';
import { TIME_GRID_SLOT, type GridEditor, type InlineSlot } from './TimeGrid';
import { TASK_COLOURS, addMinutes, formatDateKey } from './task-utils';

const VIEW_OPTIONS: { id: TimetableView; label: string; icon: typeof CalendarDays }[] = [
  { id: 'day', label: 'Day', icon: CalendarDays },
  { id: 'week', label: 'Week', icon: CalendarRange },
  { id: 'month', label: 'Month', icon: LayoutGrid },
  { id: 'list', label: 'Tasks', icon: ListChecks },
];

const ZOOM_MIN = 70;
const ZOOM_MAX = 160;
const ZOOM_STEP = 15;

function dateLabel(view: TimetableView, currentDate: Date, weekStart: Date): string {
  if (view === 'list') return 'All tasks';
  if (view === 'month') {
    return currentDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }
  if (view === 'week') {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const startText = weekStart.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const endText = end.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    return `${startText} – ${endText}`;
  }
  const today = new Date();
  const sameDay =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getDate() === today.getDate();
  if (sameDay) return 'Today';
  return currentDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
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
  const [gridEditor, setGridEditor] = useState<GridEditor | null>(null);
  const [composeKey, setComposeKey] = useState(0);
  const [inlineCreate, setInlineCreate] = useState<InlineSlot | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<TimetableEvent | null>(null);

  useEffect(() => {
    try {
      const savedZoom = Number(window.localStorage.getItem('ants-timetable-zoom'));
      if (savedZoom >= ZOOM_MIN && savedZoom <= ZOOM_MAX) setZoom(savedZoom);
    } catch {
      /* ignore */
    }
  }, []);

  const changeZoom = (next: number) => {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    setZoom(clamped);
    try {
      window.localStorage.setItem('ants-timetable-zoom', String(clamped));
    } catch {
      /* ignore */
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const slotHeight = Math.round(TIME_GRID_SLOT * (zoom / 100));
  const label = dateLabel(view, currentDate, weekStart);
  const activeView = VIEW_OPTIONS.find((option) => option.id === view) ?? VIEW_OPTIONS[0];
  const ActiveViewIcon = activeView.icon;
  const showZoom = view === 'day' || view === 'week';
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

  const openEdit = useCallback((event: TimetableEvent) => {
    if (event.event_source !== 'user') return;
    setInlineCreate(null);
    setGridEditor((current) => (
      current?.kind === 'edit' && current.event.id === event.id ? null : { kind: 'edit', event }
    ));
  }, []);

  const saveTask = useCallback(async (event: TimetableEvent | null, data: TimetableEventFormData) => {
    const result = event ? await updateEvent(event.id, data) : await createEvent(data);
    if (!result.success) throw new Error(result.error || 'Could not save this task');
  }, [createEvent, updateEvent]);

  const removeTask = useCallback(async (event: TimetableEvent) => {
    const result = await deleteEvent(event.id);
    if (!result.success) {
      setNotice(result.error || 'Could not delete this task');
      throw new Error(result.error || 'Could not delete this task');
    }
  }, [deleteEvent]);

  const renderEditor = useCallback(() => {
    if (!gridEditor) return null;
    return (
      <TaskEditor
        event={gridEditor.kind === 'edit' ? gridEditor.event : null}
        defaultDate={gridEditor.kind === 'create' ? dateFromKey(gridEditor.date) : undefined}
        defaultStartTime={gridEditor.kind === 'create' ? gridEditor.time : undefined}
        defaultAllDay={gridEditor.kind === 'create' ? gridEditor.allDay : undefined}
        defaultTitle={gridEditor.kind === 'create' ? gridEditor.title : undefined}
        onSave={(data) => saveTask(gridEditor.kind === 'edit' ? gridEditor.event : null, data)}
        onDelete={gridEditor.kind === 'edit' ? () => removeTask(gridEditor.event) : undefined}
        onClose={() => setGridEditor(null)}
      />
    );
  }, [gridEditor, removeTask, saveTask]);

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
    const totalMinutes = draggedStart.getHours() * 60 + draggedStart.getMinutes() + Math.round(delta.y / (slotHeight / 60));
    const snapped = Math.round(totalMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    const clamped = Math.max(GRID_START_HOUR * 60, Math.min((GRID_END_HOUR + 1) * 60 - 15, snapped));
    const hour = Math.floor(clamped / 60);
    const minute = clamped % 60;
    const newStart = combineDateTime(drop.date, `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    const newEnd = draggedEnd
      ? new Date(new Date(newStart).getTime() + (draggedEnd.getTime() - draggedStart.getTime())).toISOString()
      : null;
    void moveEvent(dragged.id, newStart, newEnd);
  }, [moveEvent, slotHeight]);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background text-foreground pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-0">
      <header className="relative z-50 shrink-0 border-b border-border bg-background">
        <div className="flex flex-wrap items-center gap-2 px-2 py-2 sm:px-3">
          <div className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={viewMenuOpen}
              onClick={() => {
                setViewMenuOpen((open) => !open);
                setMenuOpen(false);
              }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background-card px-2.5 text-sm font-semibold text-foreground shadow-sm hover:border-primary/50"
            >
              <ActiveViewIcon size={15} className="text-primary" />
              {activeView.label}
              <ChevronDown size={14} className="text-foreground-muted" />
            </button>
            {viewMenuOpen && (
              <>
                <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close view menu" onClick={() => setViewMenuOpen(false)} />
                <div role="listbox" aria-label="Timetable view" className="absolute left-0 z-50 mt-1.5 w-max min-w-[9.5rem] rounded-xl border border-border bg-background-card py-1 shadow-2xl">
                  {VIEW_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = view === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          setView(option.id);
                          setInlineCreate(null);
                          setViewMenuOpen(false);
                        }}
                        className={cn(
                          'flex h-9 w-full items-center gap-2 whitespace-nowrap px-3 text-left text-sm font-medium text-foreground hover:bg-foreground/5',
                          selected && 'bg-primary/10 text-primary'
                        )}
                      >
                        <Icon size={15} className={selected ? 'text-primary' : 'text-foreground-muted'} />
                        <span className="flex-1">{option.label}</span>
                        {selected && <Check size={14} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex h-9 items-center rounded-xl border border-border bg-background-card shadow-sm">
            <button
              type="button"
              onClick={() => navigate('prev')}
              disabled={view === 'list'}
              className="flex h-9 w-8 items-center justify-center rounded-l-xl text-foreground hover:bg-foreground/5 disabled:text-foreground-muted disabled:hover:bg-transparent"
              aria-label="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="h-9 min-w-[5.5rem] border-x border-border px-2 text-sm font-semibold tabular-nums text-foreground hover:bg-foreground/5"
              title="Jump to today"
            >
              {label}
            </button>
            <button
              type="button"
              onClick={() => navigate('next')}
              disabled={view === 'list'}
              className="flex h-9 w-8 items-center justify-center rounded-r-xl text-foreground hover:bg-foreground/5 disabled:text-foreground-muted disabled:hover:bg-transparent"
              aria-label="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {showZoom && (
          <div className="flex h-9 items-center rounded-xl border border-border bg-background-card shadow-sm" role="group" aria-label="Zoom timetable">
            <button
              type="button"
              onClick={() => changeZoom(zoom - ZOOM_STEP)}
              disabled={zoom <= ZOOM_MIN}
              className="flex h-9 w-8 items-center justify-center rounded-l-xl text-foreground hover:bg-foreground/5 disabled:text-foreground-muted"
              aria-label="Zoom out"
              title="Zoom out the time grid"
            >
              <ZoomOut size={15} />
            </button>
            <span className="w-11 border-x border-border text-center text-[11px] font-semibold tabular-nums text-foreground-secondary">{zoom}%</span>
            <button
              type="button"
              onClick={() => changeZoom(zoom + ZOOM_STEP)}
              disabled={zoom >= ZOOM_MAX}
              className="flex h-9 w-8 items-center justify-center rounded-r-xl text-foreground hover:bg-foreground/5 disabled:text-foreground-muted"
              aria-label="Zoom in"
              title="Zoom in the time grid"
            >
              <ZoomIn size={15} />
            </button>
          </div>
          )}

          <div className="relative ml-auto">
            <button
              type="button"
              aria-label="More options"
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen((open) => !open);
                setViewMenuOpen(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background-card text-foreground shadow-sm hover:border-primary/50"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <>
                <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-50 mt-1.5 w-max min-w-[12rem] rounded-xl border border-border bg-background-card py-1 shadow-2xl">
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between gap-4 whitespace-nowrap px-3 text-left text-sm font-medium hover:bg-foreground/5"
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
                    className="flex h-9 w-full items-center whitespace-nowrap px-3 text-left text-sm font-medium hover:bg-foreground/5"
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
        <div className={cn('min-h-0 flex-1', gridEditor && 'relative z-30')}>
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              events={dayEvents}
              slotHeight={slotHeight}
              isDragging={Boolean(activeDrag)}
              inlineCreate={inlineCreate}
              onSlotClick={(date, time) => {
                setGridEditor(null);
                setInlineCreate({ date: formatDateLocal(date), time });
              }}
              onEditEvent={openEdit}
              onToggleComplete={(id) => void onToggle(id)}
              onInlineSubmit={(titleText) => void submitInline(titleText)}
              onInlineCancel={() => setInlineCreate(null)}
              onInlineExpand={(titleText) => {
                if (!inlineCreate) return;
                setGridEditor({
                  kind: 'create',
                  date: inlineCreate.date,
                  time: inlineCreate.time,
                  allDay: false,
                  title: titleText,
                });
                setInlineCreate(null);
              }}
              editor={gridEditor}
              renderEditor={renderEditor}
            />
          )}
          {view === 'week' && (
            <WeekView
              weekStart={weekStart}
              selectedDate={currentDate}
              events={weekEvents}
              slotHeight={slotHeight}
              isDragging={Boolean(activeDrag)}
              inlineCreate={inlineCreate}
              onSlotClick={(date, time) => {
                setGridEditor(null);
                setInlineCreate({ date: formatDateLocal(date), time });
              }}
              onEditEvent={openEdit}
              onToggleComplete={(id) => void onToggle(id)}
              onInlineSubmit={(titleText) => void submitInline(titleText)}
              onInlineCancel={() => setInlineCreate(null)}
              onInlineExpand={(titleText) => {
                if (!inlineCreate) return;
                setGridEditor({
                  kind: 'create',
                  date: inlineCreate.date,
                  time: inlineCreate.time,
                  allDay: false,
                  title: titleText,
                });
                setInlineCreate(null);
              }}
              onDayHeaderClick={(date) => {
                goToDate(date);
                setView('day');
              }}
              editor={gridEditor}
              renderEditor={renderEditor}
            />
          )}
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              composeKey={composeKey}
              onSelectDate={goToDate}
              onToggleComplete={(id) => void onToggle(id)}
              onSave={saveTask}
              onDelete={removeTask}
            />
          )}
          {view === 'list' && (
            <TaskListView
              events={events}
              composeKey={composeKey}
              onToggleComplete={(id) => void onToggle(id)}
              onSave={saveTask}
              onDelete={removeTask}
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
        onClick={() => {
          if (view === 'day' || view === 'week') {
            setInlineCreate(null);
            setGridEditor({ kind: 'create', date: formatDateLocal(currentDate), allDay: true });
            return;
          }
          setComposeKey((key) => key + 1);
        }}
        className="absolute right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+0.75rem)] md:bottom-6 md:right-6"
        aria-label="Add a task"
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
