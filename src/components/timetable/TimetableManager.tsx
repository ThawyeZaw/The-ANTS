'use client';

import React, { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  SlidersHorizontal,
  CalendarDays,
  LayoutGrid,
  CalendarRange,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import type { TimetableEvent, TimetableView, TimetableEventFormData, TimetableEventType } from '@/types/timetable';
import { useTimetable, formatDateLocal, combineDateTime } from '@/hooks/useTimetable';
import { useZoomToFit } from '@/hooks/useZoomToFit';
import { DEFAULT_TIMETABLE_FILTERS, GRID_TOTAL_HOURS, GRID_START_HOUR, GRID_END_HOUR, SNAP_MINUTES, EVENT_TYPE_CONFIG } from '@/constants/timetable';
import WeekView from './WeekView';
import DayView from './DayView';
import MonthView from './MonthView';
import EventModal from './EventModal';
import InlineCreate from './InlineCreate';
import TimetableFilters from './TimetableFilters';
import IntegrationBanner from './IntegrationBanner';

// ---------------------------------------------------------------------------
// Helper: format the header label for the current view & date
// ---------------------------------------------------------------------------

function getHeaderLabel(view: TimetableView, currentDate: Date, weekStart: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  switch (view) {
    case 'day': {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${days[currentDate.getDay()]}, ${months[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    }
    case 'week': {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
      const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();
      if (sameMonth && sameYear) {
        return `${months[weekStart.getMonth()]} ${weekStart.getDate()}–${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      }
      if (sameYear) {
        return `${months[weekStart.getMonth()]} ${weekStart.getDate()} – ${months[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      }
      return `${months[weekStart.getMonth()]} ${weekStart.getDate()}, ${weekStart.getFullYear()} – ${months[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
    }
    case 'month':
      return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface TimetableManagerProps {
  userId?: string;
}

export default function TimetableManager({ userId = 'user-student-001' }: TimetableManagerProps) {
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
    toggleEventTypeFilter,
    getEventsForDay,
    getEventsForWeek,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleComplete,
    moveEvent,
    integrationCounts,
  } = useTimetable(userId);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimetableEvent | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<Date | undefined>();
  const [modalDefaultTime, setModalDefaultTime] = useState<string | undefined>();

  // Filter panel
  const [filterOpen, setFilterOpen] = useState(false);

  // Recurring instance edit choice dialog
  const [recurringChoice, setRecurringChoice] = useState<{
    event: TimetableEvent;
    baseId: string;
    instanceDate: string;
  } | null>(null);

  // Zoom-to-fit: dynamic slot height for day/week views
  const {
    containerRef: gridContainerRef,
    slotHeight,
    zoomLevel,
    zoomMode,
    setZoom,
    resetToFit,
  } = useZoomToFit(GRID_TOTAL_HOURS);

  // Inline quick-create state
  const [inlineCreate, setInlineCreate] = useState<{
    date: Date;
    startTime: string;
    topPx: number;
  } | null>(null);

  // DnD state
  const [activeDragEvent, setActiveDragEvent] = useState<TimetableEvent | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // ── Improved DnD handler: snap to 15-min increments with better accuracy ──
  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveDragEvent(null);
    setIsDragging(false);
    const { active, over, delta } = e;
    if (!over) return;

    const draggedEvent = active.data.current?.event as TimetableEvent | undefined;
    const dropData = over.data.current as { date?: string; hour?: number } | undefined;
    if (!draggedEvent || !dropData?.date || dropData.hour === undefined) return;

    const draggedStart = draggedEvent.start_time ? new Date(draggedEvent.start_time) : null;
    const draggedEnd = draggedEvent.end_time ? new Date(draggedEvent.end_time) : null;
    if (!draggedStart) return;

    // Snap to 15-min increment:
    // 1. Calculate total minutes from original start time + drag displacement
    // 2. Round to nearest 15-min boundary
    // 3. Constrain within the droppable hour slot
    const snapMinutes = SNAP_MINUTES;
    const pixelsPerMinute = slotHeight / 60;
    const totalMinutesOffset = Math.round(delta.y / pixelsPerMinute);
    const originalMinutes = draggedStart.getHours() * 60 + draggedStart.getMinutes();
    const totalMinutes = originalMinutes + totalMinutesOffset;
    const snappedTotalMinutes = Math.round(totalMinutes / snapMinutes) * snapMinutes;

    // Clamp to valid range within the grid
    const gridStartMin = GRID_START_HOUR * 60;
    const gridEndMin = (GRID_END_HOUR + 1) * 60;
    const clampedMinutes = Math.max(gridStartMin, Math.min(gridEndMin - 1, snappedTotalMinutes));

    const newHour = Math.floor(clampedMinutes / 60);
    const newMinute = clampedMinutes % 60;

    const newStart = combineDateTime(
      dropData.date,
      `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`
    );

    // Preserve duration
    let newEnd: string | null = null;
    if (draggedEnd) {
      const durationMs = draggedEnd.getTime() - draggedStart.getTime();
      const endDate = new Date(new Date(newStart).getTime() + durationMs);
      newEnd = endDate.toISOString();
    }

    moveEvent(draggedEvent.id, newStart, newEnd);
  }, [moveEvent, slotHeight]);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const event = e.active.data.current?.event as TimetableEvent | undefined;
    setActiveDragEvent(event ?? null);
    setIsDragging(true);
  }, []);

  // Derived event lists for each view
  const dayEvents = view === 'day' ? getEventsForDay(currentDate) : [];
  const weekEvents = view === 'week' ? getEventsForWeek(weekStart) : [];
  const monthEvents = view === 'month' ? events : [];

  // Day event count for the modal's default day (for soft cap warning)
  const modalDayEventCount = (() => {
    const targetDate = modalDefaultDate ?? (editingEvent
      ? (editingEvent.start_time ? new Date(editingEvent.start_time) : editingEvent.end_time ? new Date(editingEvent.end_time) : null)
      : currentDate);
    if (!targetDate) return undefined;
    return getEventsForDay(targetDate).length;
  })();

  const headerLabel = getHeaderLabel(view, currentDate, weekStart);

  // ── Event handlers ──

  const openCreateModal = useCallback((date?: Date, time?: string) => {
    setEditingEvent(null);
    setModalDefaultDate(date);
    setModalDefaultTime(time);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((event: TimetableEvent) => {
    if (event.event_source !== 'user') return; // external events can't be edited

    // Check if this is a recurring instance
    if (event.id.includes('::') && event.is_recurring) {
      const [baseId, instanceDate] = event.id.split('::');
      setRecurringChoice({ event, baseId, instanceDate });
      return;
    }

    setEditingEvent(event);
    setModalDefaultDate(undefined);
    setModalDefaultTime(undefined);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async (data: TimetableEventFormData) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
    } else {
      await createEvent(data);
    }
    setModalOpen(false);
  }, [editingEvent, createEvent, updateEvent]);

  const handleDelete = useCallback(async () => {
    if (!editingEvent) return;
    await deleteEvent(editingEvent.id);
    setModalOpen(false);
    setEditingEvent(null);
  }, [editingEvent, deleteEvent]);

  const handleToggleComplete = useCallback(async (id: string) => {
    await toggleComplete(id);
  }, [toggleComplete]);

  const handleDayClick = useCallback((date: Date) => {
    goToDate(date);
    setView('day');
  }, [goToDate, setView]);

  const handleSlotClick = useCallback((date: Date, time: string) => {
    const [h] = time.split(':').map(Number);
    const topPx = (h - 6) * slotHeight;
    setInlineCreate({ date, startTime: time, topPx });
    setEditingEvent(null);
    setModalDefaultDate(undefined);
    setModalDefaultTime(undefined);
  }, [slotHeight]);

  // ── Inline create submit ──
  const handleInlineSubmit = useCallback(async (title: string, eventType: TimetableEventType) => {
    if (!inlineCreate) return;
    const { date, startTime } = inlineCreate;
    const config = EVENT_TYPE_CONFIG[eventType];
    const [h, m] = startTime.split(':').map(Number);
    const endH = h + 1;
    const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    await createEvent({
      title,
      description: '',
      event_type: eventType,
      subject: '',
      location: '',
      time_mode: 'timed',
      date: formatDateLocal(date),
      start_time: startTime,
      end_time: endTime,
      color_code: config.color,
      is_todo: false,
      is_recurring: false,
      recurrence_rule: null,
    });

    setInlineCreate(null);
  }, [inlineCreate, createEvent]);

  const handleInlineExpand = useCallback(() => {
    // Open full modal with prefilled data from inline create
    if (!inlineCreate) return;
    setModalDefaultDate(inlineCreate.date);
    setModalDefaultTime(inlineCreate.startTime);
    setInlineCreate(null);
    setModalOpen(true);
  }, [inlineCreate]);

  // ── Recurring edit choice handlers ──
  const handleEditAllInSeries = useCallback(() => {
    if (!recurringChoice) return;
    // Find and edit the base event
    const baseEvent = events.find(e => e.id === recurringChoice.baseId);
    if (baseEvent) {
      setEditingEvent(baseEvent);
    } else {
      // Fallback: use the instance but strip the recurrence
      setEditingEvent({ ...recurringChoice.event, id: recurringChoice.baseId });
    }
    setRecurringChoice(null);
    setModalDefaultDate(undefined);
    setModalDefaultTime(undefined);
    setModalOpen(true);
  }, [recurringChoice, events]);

  const handleEditThisOnly = useCallback(async () => {
    if (!recurringChoice) return;
    // Create a one-off event for this specific instance date
    const { event, instanceDate } = recurringChoice;
    const startTime = event.start_time ? new Date(event.start_time) : null;
    const endTime = event.end_time ? new Date(event.end_time) : null;

    const startStr = startTime
      ? `${instanceDate}T${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}:00`
      : null;
    const endStr = endTime
      ? `${instanceDate}T${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}:00`
      : null;

    await createEvent({
      title: event.title,
      description: event.description ?? '',
      event_type: event.event_type,
      subject: event.subject ?? '',
      location: event.location ?? '',
      time_mode: event.all_day ? 'all_day' : (!event.start_time ? 'deadline' : 'timed'),
      date: instanceDate,
      start_time: startTime ? `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}` : '09:00',
      end_time: endTime ? `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}` : '10:00',
      color_code: event.color_code,
      is_todo: event.is_todo,
      is_recurring: false,
      recurrence_rule: null,
    });

    setRecurringChoice(null);
  }, [recurringChoice, createEvent]);

  const viewIcons: Record<TimetableView, React.ComponentType<{ size?: number; className?: string }>> = {
    day: CalendarDays,
    week: CalendarRange,
    month: LayoutGrid,
  };

  return (
    <div
      className="flex flex-col h-full min-h-screen"
      style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* ── Top Toolbar ── */}
      <div
        className="flex items-center gap-3 px-6 py-4 border-b shrink-0 flex-wrap"
        style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)', backgroundColor: 'var(--background)' }}
      >
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            id="timetable-nav-prev"
            onClick={() => navigate('prev')}
            className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-foreground/5 transition-all"
            title="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            id="timetable-nav-today"
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl text-sm font-medium text-foreground hover:text-foreground hover:bg-foreground/5 border border-border transition-all"
          >
            Today
          </button>
          <button
            id="timetable-nav-next"
            onClick={() => navigate('next')}
            className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-foreground/5 transition-all"
            title="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Date Label */}
        <h1 className="text-base font-semibold tracking-tight flex-1 truncate"
          style={{ color: 'var(--foreground)' }}>
          {headerLabel}
        </h1>

        {/* View Switcher */}
        <div
          className="flex items-center gap-0.5 rounded-xl p-1 border"
          style={{ backgroundColor: 'color-mix(in srgb, var(--border) 40%, transparent)', borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
        >
          {(['day', 'week', 'month'] as TimetableView[]).map(v => {
            const Icon = viewIcons[v];
            return (
              <button
                key={v}
                id={`timetable-view-${v}`}
                onClick={() => setView(v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
                style={{
                  backgroundColor: view === v ? 'color-mix(in srgb, var(--primary) 35%, transparent)' : 'transparent',
                  color: view === v ? 'var(--primary)' : 'var(--foreground-muted)',
                }}
              >
                <Icon size={14} />
                {v}
              </button>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl border"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--border) 40%, transparent)',
            borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)',
          }}
        >
          <button
            id="timetable-zoom-out"
            onClick={() => setZoom(zoomLevel - 10)}
            className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-foreground/5 transition-all"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <div className="flex items-center gap-1 min-w-[64px] justify-center">
            <input
              id="timetable-zoom-slider"
              type="range"
              min={50}
              max={200}
              step={5}
              value={zoomLevel}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-16 h-1 cursor-pointer accent-primary"
              style={{ accentColor: 'var(--primary)' }}
              title="Zoom level"
            />
            <span className="text-[10px] font-medium tabular-nums min-w-[32px] text-center"
              style={{ color: 'var(--foreground-muted)' }}>
              {zoomLevel}%
            </span>
          </div>
          <button
            id="timetable-zoom-in"
            onClick={() => setZoom(zoomLevel + 10)}
            className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-foreground/5 transition-all"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          {zoomMode === 'manual' && (
            <button
              id="timetable-zoom-fit"
              onClick={resetToFit}
              className="p-1 rounded-lg text-foreground-muted hover:text-primary hover:bg-foreground/5 transition-all ml-0.5"
              title="Fit to screen"
            >
              <Maximize2 size={12} />
            </button>
          )}
        </div>

        {/* Filter button */}
        <div className="relative">
          <button
            id="timetable-filter-btn"
            onClick={() => setFilterOpen(s => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all"
            style={{
              backgroundColor: filterOpen ? 'color-mix(in srgb, var(--primary) 30%, transparent)' : 'color-mix(in srgb, var(--border) 40%, transparent)',
              borderColor: filterOpen ? 'color-mix(in srgb, var(--primary) 55%, transparent)' : 'var(--border)',
              color: filterOpen ? 'var(--primary)' : 'var(--foreground-muted)',
            }}
          >
            <SlidersHorizontal size={14} />
            Filters
            {filters.eventTypes.length < 8 && (
              <span
                className="text-[10px] px-1 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: 'var(--primary)', color: 'white', minWidth: 16, textAlign: 'center' }}
              >
                {8 - filters.eventTypes.length}
              </span>
            )}
          </button>

          <TimetableFilters
            isOpen={filterOpen}
            onClose={() => setFilterOpen(false)}
            filters={filters}
            onToggleEventType={toggleEventTypeFilter}
            onToggleCompleted={() => setFilters({ ...filters, showCompleted: !filters.showCompleted })}
            onToggleExternalEvents={() => setFilters({ ...filters, showExternalEvents: !filters.showExternalEvents })}
            onResetFilters={() => setFilters(DEFAULT_TIMETABLE_FILTERS)}
          />
        </div>

        {/* Add Event Button */}
        <button
          id="timetable-add-event"
          onClick={() => openCreateModal(currentDate)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, white))',
            boxShadow: '0 4px 15px color-mix(in srgb, var(--primary) 45%, transparent)',
          }}
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>

      {/* ── Integration Banner ── */}
      {filters.showExternalEvents && (
        <div className="px-6 pt-3 shrink-0">
          <IntegrationBanner
            examCount={integrationCounts.exams}
            assignmentCount={integrationCounts.assignments}
            clubEventCount={integrationCounts.clubEvents}
            milestoneCount={integrationCounts.milestones}
          />
        </div>
      )}

      {/* ── Recurring Edit Choice Dialog ── */}
      {recurringChoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setRecurringChoice(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-6 space-y-4"
            style={{
              backgroundColor: 'var(--background-card)',
              borderColor: 'var(--border)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Recurring Event</h3>
              <p className="text-sm text-foreground-muted mt-1">
                &ldquo;{recurringChoice.event.title}&rdquo; is a recurring event. How would you like to edit it?
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleEditThisOnly}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-all text-left hover:bg-white/5"
                style={{
                  color: 'var(--primary)',
                  borderColor: 'color-mix(in srgb, var(--primary) 45%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                }}
              >
                <span className="font-semibold">Edit this event only</span>
                <span className="block text-xs text-foreground-muted mt-0.5">
                  Creates a separate one-off event for this date
                </span>
              </button>
              <button
                onClick={handleEditAllInSeries}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-all text-left hover:bg-white/5"
                style={{
                  color: 'var(--foreground)',
                  borderColor: 'var(--border)',
                }}
              >
                <span className="font-semibold">Edit all events in series</span>
                <span className="block text-xs text-foreground-muted mt-0.5">
                  Changes apply to all recurring instances
                </span>
              </button>
              <button
                onClick={() => setRecurringChoice(null)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar Body ── */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-hidden relative" ref={gridContainerRef}>
          {/* Inline quick-create overlay */}
          {inlineCreate && (view === 'day' || view === 'week') && (
            <div className="absolute left-16 right-0 z-30" style={{ top: 0 }}>
              <InlineCreate
                date={inlineCreate.date}
                startTime={inlineCreate.startTime}
                topPx={inlineCreate.topPx}
                onSubmit={handleInlineSubmit}
                onCancel={() => setInlineCreate(null)}
              />
              {/* "More options" link to open full modal */}
              <button
                onClick={() => {
                  setModalDefaultDate(inlineCreate.date);
                  setModalDefaultTime(inlineCreate.startTime);
                  setInlineCreate(null);
                  setModalOpen(true);
                }}
                className="absolute -bottom-7 left-2 text-[11px] text-foreground-muted hover:text-primary transition-colors"
              >
                More options…
              </button>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <div className="text-foreground-muted text-sm">Loading...</div>
            </div>
          )}

          {view === 'day' && (
            <div className="h-full overflow-hidden">
              <DayView
                currentDate={currentDate}
                events={dayEvents}
                slotHeight={slotHeight}
                isDragging={isDragging}
                onSlotClick={handleSlotClick}
                onEditEvent={openEditModal}
                onDeleteEvent={async (id) => { await deleteEvent(id); }}
                onToggleComplete={handleToggleComplete}
              />
            </div>
          )}

          {view === 'week' && (
            <div className="h-full overflow-hidden">
              <WeekView
                weekStart={weekStart}
                events={weekEvents}
                slotHeight={slotHeight}
                isDragging={isDragging}
                onSlotClick={handleSlotClick}
                onEditEvent={openEditModal}
                onDeleteEvent={async (id) => { await deleteEvent(id); }}
                onToggleComplete={handleToggleComplete}
              />
            </div>
          )}

          {view === 'month' && (
            <div className="h-full overflow-auto">
              <MonthView
                currentDate={currentDate}
                events={monthEvents}
                zoomLevel={zoomLevel}
                onDayClick={handleDayClick}
                onEditEvent={openEditModal}
                onDeleteEvent={async (id) => { await deleteEvent(id); }}
                onToggleComplete={handleToggleComplete}
              />
            </div>
          )}
        </div>

        {/* Drag Overlay — shows a ghost of the event being dragged */}
        <DragOverlay dropAnimation={null}>
          {activeDragEvent ? (
            <div
              className="rounded-md opacity-80 shadow-lg pointer-events-none"
              style={{
                width: 160,
                height: 36,
                backgroundColor: 'color-mix(in srgb, var(--primary) 45%, transparent)',
                border: '2px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: 'white',
                padding: '0 8px',
              }}
            >
              <span className="truncate font-medium">{activeDragEvent.title}</span>
              <span className="shrink-0 text-[10px] opacity-75 ml-auto">
                <span className="tabular-nums">{SNAP_MINUTES}&apos; snap</span>
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Event Modal ── */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEvent(null); }}
        onSave={handleSave}
        onDelete={editingEvent ? handleDelete : undefined}
        event={editingEvent}
        defaultDate={modalDefaultDate}
        defaultStartTime={modalDefaultTime}
        dayEventCount={modalDayEventCount}
      />
    </div>
  );
}
