// ──────────────────────────────────────────────────────────────────────────────
// Timetable Layout Utilities
// Overlap detection and column assignment for side-by-side event rendering.
// ──────────────────────────────────────────────────────────────────────────────
import type { TimetableEvent } from '@/types/timetable';

export interface LayeredEvent extends TimetableEvent {
  /** Left position as percentage of column width */
  leftPct: number;
  /** Width as percentage of column width */
  widthPct: number;
}

/**
 * Assign left/width percentages to timed events so that overlapping events
 * share the column width side-by-side.
 *
 * Algorithm:
 * 1. Sort events by start time (then by duration descending for stability)
 * 2. For each event, find a "lane" (column) that is free
 * 3. Track the maximum number of simultaneous lanes → determines width
 * 4. Each event gets left = laneIndex * (100 / maxLanes), width = 100 / maxLanes
 */
export function layoutOverlappingEvents(events: TimetableEvent[]): LayeredEvent[] {
  if (events.length === 0) return [];

  // Sort: earlier start first, then longer duration first
  const sorted = [...events].sort((a, b) => {
    const aStart = a.start_time ? new Date(a.start_time).getTime() : 0;
    const bStart = b.start_time ? new Date(b.start_time).getTime() : 0;
    if (aStart !== bStart) return aStart - bStart;
    const aEnd = a.end_time ? new Date(a.end_time).getTime() : aStart + 3600000;
    const bEnd = b.end_time ? new Date(b.end_time).getTime() : bStart + 3600000;
    return bEnd - aEnd; // longer duration first
  });

  // Track which lane each event occupies
  const lanes: { event: TimetableEvent; lane: number }[] = [];
  let maxLanes = 0;

  for (const event of sorted) {
    const eStart = event.start_time ? new Date(event.start_time).getTime() : 0;
    const eEnd = event.end_time ? new Date(event.end_time).getTime() : eStart + 3600000;

    // Free up lanes where the event has ended
    const occupiedLanes = new Set<number>();
    for (const entry of lanes) {
      const entryEnd = entry.event.end_time
        ? new Date(entry.event.end_time).getTime()
        : new Date(entry.event.start_time!).getTime() + 3600000;
      if (eStart < entryEnd) {
        occupiedLanes.add(entry.lane);
      }
    }

    // Find the first free lane
    let lane = 0;
    while (occupiedLanes.has(lane)) lane++;

    lanes.push({ event, lane });
    maxLanes = Math.max(maxLanes, lane + 1);
  }

  // Build result with layout info
  return sorted.map(event => {
    const entry = lanes.find(l => l.event === event)!;
    const lane = entry.lane;
    const width = 100 / maxLanes;
    const left = lane * width;
    return { ...event, leftPct: left, widthPct: width };
  });
}
