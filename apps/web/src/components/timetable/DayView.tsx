'use client';

import type { ReactNode } from 'react';
import type { TimetableEvent } from '@/types/timetable';
import TimeGrid, { type GridEditor, type InlineSlot } from './TimeGrid';

interface DayViewProps {
  currentDate: Date;
  events: TimetableEvent[];
  isDragging?: boolean;
  slotHeight?: number;
  inlineCreate: InlineSlot | null;
  onSlotClick: (date: Date, time: string) => void;
  onEditEvent: (event: TimetableEvent) => void;
  onToggleComplete: (eventId: string) => void;
  onInlineSubmit: (title: string) => void;
  onInlineCancel: () => void;
  onInlineExpand: (title: string) => void;
  editor?: GridEditor | null;
  renderEditor?: () => ReactNode;
}

export default function DayView({
  currentDate,
  events,
  isDragging,
  slotHeight,
  inlineCreate,
  onSlotClick,
  onEditEvent,
  onToggleComplete,
  onInlineSubmit,
  onInlineCancel,
  onInlineExpand,
  editor,
  renderEditor,
}: DayViewProps) {
  return (
    <TimeGrid
      days={[currentDate]}
      events={events}
      selectedDate={currentDate}
      slotHeight={slotHeight}
      isDragging={isDragging}
      inlineCreate={inlineCreate}
      onSlotClick={onSlotClick}
      onEditEvent={onEditEvent}
      onToggleComplete={onToggleComplete}
      onInlineSubmit={onInlineSubmit}
      onInlineCancel={onInlineCancel}
      onInlineExpand={onInlineExpand}
      editor={editor}
      renderEditor={renderEditor}
    />
  );
}
