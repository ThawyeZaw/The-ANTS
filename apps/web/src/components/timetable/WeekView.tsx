'use client';

import type { ReactNode } from 'react';
import type { TimetableEvent } from '@/types/timetable';
import TimeGrid, { type GridEditor, type InlineSlot } from './TimeGrid';

interface WeekViewProps {
  weekStart: Date;
  selectedDate: Date;
  events: TimetableEvent[];
  isDragging?: boolean;
  slotHeight?: number;
  colWidth?: number;
  onPinchZoom?: (delta: number) => void;
  inlineCreate: InlineSlot | null;
  onSlotClick: (date: Date, time: string) => void;
  onEditEvent: (event: TimetableEvent) => void;
  onToggleComplete: (eventId: string) => void;
  onInlineSubmit: (title: string) => void;
  onInlineCancel: () => void;
  onInlineExpand: (title: string) => void;
  onDayHeaderClick: (date: Date) => void;
  onResizeEvent?: (event: TimetableEvent, newEndIso: string) => void;
  editor?: GridEditor | null;
  renderEditor?: () => ReactNode;
}

export default function WeekView({
  weekStart,
  selectedDate,
  events,
  isDragging,
  slotHeight,
  colWidth,
  onPinchZoom,
  inlineCreate,
  onSlotClick,
  onEditEvent,
  onToggleComplete,
  onInlineSubmit,
  onInlineCancel,
  onInlineExpand,
  onDayHeaderClick,
  onResizeEvent,
  editor,
  renderEditor,
}: WeekViewProps) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  return (
    <TimeGrid
      days={days}
      events={events}
      selectedDate={selectedDate}
      slotHeight={slotHeight}
      colWidth={colWidth}
      onPinchZoom={onPinchZoom}
      isDragging={isDragging}
      inlineCreate={inlineCreate}
      onSlotClick={onSlotClick}
      onEditEvent={onEditEvent}
      onToggleComplete={onToggleComplete}
      onInlineSubmit={onInlineSubmit}
      onInlineCancel={onInlineCancel}
      onInlineExpand={onInlineExpand}
      onDayHeaderClick={onDayHeaderClick}
      onResizeEvent={onResizeEvent}
      editor={editor}
      renderEditor={renderEditor}
    />
  );
}
