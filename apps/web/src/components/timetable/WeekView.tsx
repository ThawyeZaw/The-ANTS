'use client';

import type { TimetableEvent } from '@/types/timetable';
import TimeGrid, { type InlineSlot } from './TimeGrid';

interface WeekViewProps {
  weekStart: Date;
  selectedDate: Date;
  events: TimetableEvent[];
  isDragging?: boolean;
  inlineCreate: InlineSlot | null;
  onSlotClick: (date: Date, time: string) => void;
  onEditEvent: (event: TimetableEvent) => void;
  onToggleComplete: (eventId: string) => void;
  onInlineSubmit: (title: string) => void;
  onInlineCancel: () => void;
  onInlineExpand: () => void;
  onDayHeaderClick: (date: Date) => void;
}

export default function WeekView({
  weekStart,
  selectedDate,
  events,
  isDragging,
  inlineCreate,
  onSlotClick,
  onEditEvent,
  onToggleComplete,
  onInlineSubmit,
  onInlineCancel,
  onInlineExpand,
  onDayHeaderClick,
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
      isDragging={isDragging}
      inlineCreate={inlineCreate}
      onSlotClick={onSlotClick}
      onEditEvent={onEditEvent}
      onToggleComplete={onToggleComplete}
      onInlineSubmit={onInlineSubmit}
      onInlineCancel={onInlineCancel}
      onInlineExpand={onInlineExpand}
      onDayHeaderClick={onDayHeaderClick}
    />
  );
}
