// ──────────────────────────────────────────────────────────────────────────────
// Timetable Mock Database
// Rich mock data + full CRUD + cross-feature integration helpers.
// Synced with: schema.md (timetable_events table), src/types/timetable.ts
// ──────────────────────────────────────────────────────────────────────────────
import type { TimetableEvent, TimetableEventType, TimetableEventSource, RecurrenceRule } from '@/types/timetable';
import {
  mockExamCountdowns,
  mockExams,
  mockAssignments,
  mockClubEvents,
  mockClubMilestones,
  mockClubMembers,
} from '@/lib/mock/database';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

export let mockTimetableEvents: TimetableEvent[] = [
  // ── User Study & Class Events ─────────────────────────────────────────────
  {
    id: 'te-1',
    user_id: 'user-student-001',
    title: 'Physics Revision',
    description: 'Cover chapters 3–5: Waves, Electricity, and Magnetism',
    event_type: 'study',
    subject: 'Physics',
    location: null,
    start_time: '2026-07-07T14:00:00Z',
    end_time: '2026-07-07T16:00:00Z',
    all_day: false,
    is_recurring: true,
    recurrence_rule: { frequency: 'weekly', interval: 1, days_of_week: [1], end_date: '2026-08-31' }, // Every Monday
    color_code: '#6366f1',
    is_todo: false,
    is_completed: false,
    completed_at: null,
    event_source: 'user',
    source_id: null,
    metadata: {},
    created_at: '2026-06-10T00:00:00Z',
  },
  {
    id: 'te-2',
    user_id: 'user-student-001',
    title: 'Maths Class',
    description: 'Year 11 Mathematics — Calculus unit',
    event_type: 'class',
    subject: 'Mathematics',
    location: 'Room 204',
    start_time: '2026-07-07T08:00:00Z',
    end_time: '2026-07-07T09:30:00Z',
    all_day: false,
    is_recurring: true,
    recurrence_rule: { frequency: 'weekly', interval: 1, days_of_week: [1, 3, 5], end_date: '2026-12-20' }, // Mon/Wed/Fri
    color_code: '#0ea5e9',
    is_todo: false,
    is_completed: false,
    completed_at: null,
    event_source: 'user',
    source_id: null,
    metadata: {},
    created_at: '2026-06-10T00:00:00Z',
  },
  {
    id: 'te-3',
    user_id: 'user-student-001',
    title: 'Biology Lab',
    description: 'Practical: Osmosis in plant cells',
    event_type: 'class',
    subject: 'Biology',
    location: 'Science Lab B',
    start_time: '2026-07-08T10:00:00Z',
    end_time: '2026-07-08T12:00:00Z',
    all_day: false,
    is_recurring: true,
    recurrence_rule: { frequency: 'weekly', interval: 1, days_of_week: [2], end_date: '2026-12-20' }, // Every Tuesday
    color_code: '#0ea5e9',
    is_todo: false,
    is_completed: false,
    completed_at: null,
    event_source: 'user',
    source_id: null,
    metadata: {},
    created_at: '2026-06-10T00:00:00Z',
  },
  {
    id: 'te-4',
    user_id: 'user-student-001',
    title: 'Morning Gym',
    description: 'Upper body + cardio',
    event_type: 'gym',
    subject: null,
    location: 'City Fitness Centre',
    start_time: '2026-07-07T06:30:00Z',
    end_time: '2026-07-07T07:30:00Z',
    all_day: false,
    is_recurring: true,
    recurrence_rule: { frequency: 'weekly', interval: 1, days_of_week: [1, 3, 5], end_date: null }, // Mon/Wed/Fri forever
    color_code: '#22c55e',
    is_todo: false,
    is_completed: false,
    completed_at: null,
    event_source: 'user',
    source_id: null,
    metadata: {},
    created_at: '2026-06-10T00:00:00Z',
  },
  {
    id: 'te-5',
    user_id: 'user-student-001',
    title: 'Chemistry Essay Draft',
    description: 'Write first draft of Le Chatelier essay for Mr. Hassan',
    event_type: 'study',
    subject: 'Chemistry',
    location: null,
    start_time: null,
    end_time: '2026-07-10T23:59:00Z',  // deadline only
    all_day: false,
    is_recurring: false,
    recurrence_rule: null,
    color_code: '#6366f1',
    is_todo: true,
    is_completed: false,
    completed_at: null,
    event_source: 'user',
    source_id: null,
    metadata: {},
    created_at: '2026-07-05T00:00:00Z',
  },
  {
    id: 'te-6',
    user_id: 'user-student-001',
    title: 'Read Physics Chapter 6',
    description: 'Nuclear Physics and Radioactivity — pre-read before lecture',
    event_type: 'study',
    subject: 'Physics',
    location: null,
    start_time: '2026-07-09T19:00:00Z',
    end_time: '2026-07-09T20:30:00Z',
    all_day: false,
    is_recurring: false,
    recurrence_rule: null,
    color_code: '#6366f1',
    is_todo: true,
    is_completed: true,
    completed_at: '2026-07-09T20:15:00Z',
    event_source: 'user',
    source_id: null,
    metadata: {},
    created_at: '2026-07-05T00:00:00Z',
  },
  {
    id: 'te-7',
    user_id: 'user-student-001',
    title: 'School Sports Day',
    description: 'Annual sports day — no regular classes',
    event_type: 'school',
    subject: null,
    location: 'School Sports Field',
    start_time: null,
    end_time: null,
    all_day: true,
    is_recurring: false,
    recurrence_rule: null,
    color_code: '#f97316',
    is_todo: false,
    is_completed: false,
    completed_at: null,
    event_source: 'user',
    source_id: null,
    metadata: {},
    created_at: '2026-07-01T00:00:00Z',
  },
  {
    id: 'te-8',
    user_id: 'user-student-001',
    title: 'Lunch Break',
    description: null,
    event_type: 'break',
    subject: null,
    location: 'Cafeteria',
    start_time: '2026-07-07T12:00:00Z',
    end_time: '2026-07-07T13:00:00Z',
    all_day: false,
    is_recurring: true,
    recurrence_rule: { frequency: 'daily', interval: 1, end_date: null }, // Daily
    color_code: '#a855f7',
    is_todo: false,
    is_completed: false,
    completed_at: null,
    event_source: 'user',
    source_id: null,
    metadata: {},
    created_at: '2026-06-10T00:00:00Z',
  },
  {
    id: 'te-9',
    user_id: 'user-student-001',
    title: 'CS Mock Exam',
    description: 'Internal mock — Paper 1 theory section',
    event_type: 'exam',
    subject: 'Computer Science',
    location: 'Exam Hall A',
    start_time: '2026-07-14T09:00:00Z',
    end_time: '2026-07-14T11:00:00Z',
    all_day: false,
    is_recurring: false,
    recurrence_rule: null,
    color_code: '#ef4444',
    is_todo: false,
    is_completed: false,
    completed_at: null,
    event_source: 'user',
    source_id: null,
    metadata: {},
    created_at: '2026-07-01T00:00:00Z',
  },
  {
    id: 'te-10',
    user_id: 'user-student-001',
    title: 'Review Flashcards',
    description: 'SRS review — Physics deck (due cards only)',
    event_type: 'study',
    subject: 'Physics',
    location: null,
    start_time: '2026-07-07T20:00:00Z',
    end_time: '2026-07-07T20:30:00Z',
    all_day: false,
    is_recurring: true,
    recurrence_rule: { frequency: 'daily', interval: 1, end_date: null },
    color_code: '#6366f1',
    is_todo: true,
    is_completed: false,
    completed_at: null,
    event_source: 'user',
    source_id: null,
    metadata: {},
    created_at: '2026-06-15T00:00:00Z',
  },
  {
    id: 'te-11',
    user_id: 'user-student-001',
    title: 'Study Group — Chemistry',
    description: 'Weekly online study group with Zanele and Mai',
    event_type: 'study',
    subject: 'Chemistry',
    location: 'Google Meet',
    start_time: '2026-07-10T16:00:00Z',
    end_time: '2026-07-10T18:00:00Z',
    all_day: false,
    is_recurring: true,
    recurrence_rule: { frequency: 'weekly', interval: 1, days_of_week: [5], end_date: null }, // Every Friday
    color_code: '#6366f1',
    is_todo: false,
    is_completed: false,
    completed_at: null,
    event_source: 'user',
    source_id: null,
    metadata: {},
    created_at: '2026-06-20T00:00:00Z',
  },
  {
    id: 'te-12',
    user_id: 'user-student-002',
    title: 'IELTS Writing Practice',
    description: 'Task 2: Academic essay practice — 40 mins timed',
    event_type: 'study',
    subject: 'IELTS',
    location: null,
    start_time: '2026-07-07T17:00:00Z',
    end_time: '2026-07-07T18:00:00Z',
    all_day: false,
    is_recurring: true,
    recurrence_rule: { frequency: 'weekly', interval: 1, days_of_week: [1, 4], end_date: null }, // Mon/Thu
    color_code: '#6366f1',
    is_todo: false,
    is_completed: false,
    completed_at: null,
    event_source: 'user',
    source_id: null,
    metadata: {},
    created_at: '2026-06-20T00:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Recurrence Expansion Helper
// ---------------------------------------------------------------------------

/**
 * Expands a recurring event into concrete instances within [rangeStart, rangeEnd].
 * Returns an array of concrete TimetableEvent objects with unique ids (suffixed by date).
 */
export function expandRecurringEvents(
  event: TimetableEvent,
  rangeStart: Date,
  rangeEnd: Date
): TimetableEvent[] {
  if (!event.is_recurring || !event.recurrence_rule) return [event];

  const rule = event.recurrence_rule;
  const results: TimetableEvent[] = [];

  // Parse the original event's start date
  const originalStart = event.start_time ? new Date(event.start_time) : null;
  const originalEnd = event.end_time ? new Date(event.end_time) : null;
  if (!originalStart && !event.all_day) return [event]; // can't expand without anchor

  const duration = originalStart && originalEnd
    ? originalEnd.getTime() - originalStart.getTime()
    : 0;

  const anchor = originalStart || rangeStart;
  const endDate = rule.end_date ? new Date(rule.end_date) : rangeEnd;
  const effectiveEnd = endDate < rangeEnd ? endDate : rangeEnd;

  const cursor = new Date(anchor);

  // Step the cursor to the range start or keep it at anchor, whichever is later
  while (cursor < rangeStart) {
    stepCursor(cursor, rule);
  }

  let iterations = 0;
  while (cursor <= effectiveEnd && iterations < 500) {
    iterations++;
    // Check days_of_week filter for weekly rules
    if (rule.days_of_week && rule.days_of_week.length > 0) {
      if (!rule.days_of_week.includes(cursor.getDay())) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
    }

    if (cursor >= rangeStart && cursor <= effectiveEnd) {
      const instanceStart = new Date(cursor);
      instanceStart.setHours(anchor.getHours(), anchor.getMinutes(), 0, 0);
      const instanceEnd = duration > 0 ? new Date(instanceStart.getTime() + duration) : null;

      const dateStr = instanceStart.toISOString().split('T')[0];
      results.push({
        ...event,
        id: `${event.id}::${dateStr}`,
        start_time: event.start_time ? instanceStart.toISOString() : null,
        end_time: event.end_time && instanceEnd ? instanceEnd.toISOString() : null,
      });
    }

    stepCursor(cursor, rule);
  }

  return results;
}

function stepCursor(cursor: Date, rule: RecurrenceRule): void {
  switch (rule.frequency) {
    case 'daily':
      cursor.setDate(cursor.getDate() + (rule.interval || 1));
      break;
    case 'weekly':
      if (rule.days_of_week && rule.days_of_week.length > 0) {
        cursor.setDate(cursor.getDate() + 1);
      } else {
        cursor.setDate(cursor.getDate() + 7 * (rule.interval || 1));
      }
      break;
    case 'monthly':
      cursor.setMonth(cursor.getMonth() + (rule.interval || 1));
      break;
    case 'custom':
      cursor.setDate(cursor.getDate() + (rule.interval || 1));
      break;
    default:
      cursor.setDate(cursor.getDate() + 1);
  }
}

// ---------------------------------------------------------------------------
// Integration: Virtual Events from Other Features
// ---------------------------------------------------------------------------

/**
 * Build read-only virtual timetable events from exam countdowns (for a given user).
 * These are NOT stored in timetable_events — computed at query time.
 */
export function getExamCountdownVirtualEvents(userId: string): TimetableEvent[] {
  const userCountdowns = mockExamCountdowns.filter(ec => ec.user_id === userId);

  return userCountdowns.map(ec => {
    const exam = ec.exam_id ? mockExams.find(e => e.id === ec.exam_id) : null;
    const title = ec.custom_title || exam?.title || 'Exam';
    const targetDate = ec.custom_date_override || ec.target_date;

    return {
      id: `virtual-exam-${ec.id}`,
      user_id: userId,
      title,
      description: exam ? `${exam.exam_board} ${exam.qualification} — ${exam.exam_series ?? ''}` : 'Exam countdown',
      event_type: 'exam' as TimetableEventType,
      subject: exam?.subject_id ?? null,
      location: null,
      start_time: targetDate,
      end_time: targetDate,
      all_day: false,
      is_recurring: false,
      recurrence_rule: null,
      color_code: '#ef4444',
      is_todo: false,
      is_completed: false,
      completed_at: null,
      event_source: 'exam_countdown' as TimetableEventSource,
      source_id: ec.id,
      metadata: { priority: ec.priority_indicator },
      created_at: ec.created_at,
    };
  });
}

/**
 * Build read-only virtual timetable events from classroom assignments (for a given user).
 * Only published assignments from classrooms the user belongs to.
 */
export function getAssignmentVirtualEvents(userId: string): TimetableEvent[] {
  // Get all classroom IDs this user is enrolled in
  const { mockClassroomMembers, mockAssignments } = require('@/lib/mock/database');
  const userClassroomIds = mockClassroomMembers
    .filter((m: { user_id: string; classroom_id: string }) => m.user_id === userId)
    .map((m: { classroom_id: string }) => m.classroom_id);

  const userAssignments = mockAssignments.filter(
    (a: { classroom_id: string; status: string }) =>
      userClassroomIds.includes(a.classroom_id) && a.status === 'published'
  );

  return userAssignments.map((a: { id: string; title: string; description: string | null; due_date: string; priority: string; created_at: string }) => ({
    id: `virtual-assn-${a.id}`,
    user_id: userId,
    title: `📝 ${a.title}`,
    description: a.description,
    event_type: 'deadline' as TimetableEventType,
    subject: null,
    location: null,
    start_time: null,
    end_time: a.due_date,
    all_day: false,
    is_recurring: false,
    recurrence_rule: null,
    color_code: '#f59e0b',
    is_todo: false,
    is_completed: false,
    completed_at: null,
    event_source: 'assignment' as TimetableEventSource,
    source_id: a.id,
    metadata: { priority: a.priority },
    created_at: a.created_at,
  }));
}

/**
 * Build read-only virtual timetable events from club events (for a given user).
 * Only from clubs the user is an active member of.
 */
export function getClubEventVirtualEvents(userId: string): TimetableEvent[] {
  const userClubIds = mockClubMembers
    .filter(m => m.user_id === userId && m.membership_status === 'active')
    .map(m => m.club_id);

  return mockClubEvents
    .filter(ce => userClubIds.includes(ce.club_id))
    .map(ce => ({
      id: `virtual-club-evt-${ce.id}`,
      user_id: userId,
      title: `🐜 ${ce.title}`,
      description: ce.description,
      event_type: 'club_event' as TimetableEventType,
      subject: null,
      location: null,
      start_time: ce.event_date,
      end_time: ce.event_date,
      all_day: false,
      is_recurring: false,
      recurrence_rule: null,
      color_code: '#ec4899',
      is_todo: false,
      is_completed: false,
      completed_at: null,
      event_source: 'club_event' as TimetableEventSource,
      source_id: ce.id,
      metadata: { club_id: ce.club_id },
      created_at: ce.created_at,
    }));
}

/**
 * Build read-only virtual timetable events from club milestones with target dates.
 */
export function getClubMilestoneVirtualEvents(userId: string): TimetableEvent[] {
  const userClubIds = mockClubMembers
    .filter(m => m.user_id === userId && m.membership_status === 'active')
    .map(m => m.club_id);

  return mockClubMilestones
    .filter(ms => userClubIds.includes(ms.club_id) && ms.target_date)
    .map(ms => ({
      id: `virtual-milestone-${ms.id}`,
      user_id: userId,
      title: `🏆 ${ms.title}`,
      description: ms.description,
      event_type: 'deadline' as TimetableEventType,
      subject: null,
      location: null,
      start_time: null,
      end_time: ms.target_date ?? null,
      all_day: false,
      is_recurring: false,
      recurrence_rule: null,
      color_code: '#f59e0b',
      is_todo: false,
      is_completed: ms.status === 'completed',
      completed_at: ms.completed_at ?? null,
      event_source: 'club_milestone' as TimetableEventSource,
      source_id: ms.id,
      metadata: { club_id: ms.club_id, status: ms.status },
      created_at: ms.created_at,
    }));
}

// ---------------------------------------------------------------------------
// Main Query Functions
// ---------------------------------------------------------------------------

/** Get all raw (non-expanded) timetable events for a user */
export function getTimetableEvents(userId: string): TimetableEvent[] {
  return mockTimetableEvents.filter(e => e.user_id === userId);
}

/**
 * Get timetable events for a specific date range.
 * Expands recurring events into concrete instances within the range.
 */
export function getTimetableEventsInRange(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date
): TimetableEvent[] {
  const userEvents = getTimetableEvents(userId);
  const expanded: TimetableEvent[] = [];

  for (const event of userEvents) {
    if (event.is_recurring) {
      const instances = expandRecurringEvents(event, rangeStart, rangeEnd);
      expanded.push(...instances);
    } else {
      // Check if the event falls within range
      const eventDate = event.start_time || event.end_time;
      if (eventDate) {
        const d = new Date(eventDate);
        if (d >= rangeStart && d <= rangeEnd) {
          expanded.push(event);
        }
      } else if (event.all_day) {
        // All-day events without a time — include if created in range (simplified)
        expanded.push(event);
      }
    }
  }

  return expanded;
}

/**
 * Get ALL timetable events including read-only virtual events from connected features.
 * This is the primary function for the timetable calendar view.
 */
export function getIntegratedTimetableEvents(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date,
  options: { showExternalEvents?: boolean } = {}
): TimetableEvent[] {
  const { showExternalEvents = true } = options;
  const userEvents = getTimetableEventsInRange(userId, rangeStart, rangeEnd);

  if (!showExternalEvents) return userEvents;

  const examEvents = getExamCountdownVirtualEvents(userId);
  const clubEvents = getClubEventVirtualEvents(userId);
  const milestoneEvents = getClubMilestoneVirtualEvents(userId);

  // assignment events via inline require to avoid circular import
  let assignmentEvents: TimetableEvent[] = [];
  try {
    assignmentEvents = getAssignmentVirtualEvents(userId);
  } catch {
    // ignore if not available
  }

  // Filter external events to range
  const allExternal = [...examEvents, ...assignmentEvents, ...clubEvents, ...milestoneEvents];
  const filteredExternal = allExternal.filter(e => {
    const d = e.start_time ? new Date(e.start_time) : e.end_time ? new Date(e.end_time) : null;
    return d ? (d >= rangeStart && d <= rangeEnd) : false;
  });

  return [...userEvents, ...filteredExternal];
}

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/** Create a new timetable event */
export function createTimetableEvent(
  userId: string,
  data: Omit<TimetableEvent, 'id' | 'user_id' | 'created_at'>
): { success: true; event: TimetableEvent } {
  const event: TimetableEvent = {
    ...data,
    id: `te-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  mockTimetableEvents.push(event);
  return { success: true, event };
}

/** Update an existing user-created timetable event */
export function updateTimetableEvent(
  eventId: string,
  userId: string,
  data: Partial<Omit<TimetableEvent, 'id' | 'user_id' | 'event_source' | 'source_id' | 'created_at'>>
): { success: true; event: TimetableEvent } | { success: false; error: string } {
  const idx = mockTimetableEvents.findIndex(e => e.id === eventId && e.user_id === userId);
  if (idx === -1) return { success: false, error: 'Event not found or not owned by user.' };

  const event = mockTimetableEvents[idx];
  if (event.event_source !== 'user') {
    return { success: false, error: 'External events cannot be edited from the timetable.' };
  }

  mockTimetableEvents[idx] = { ...event, ...data };
  return { success: true, event: mockTimetableEvents[idx] };
}

/** Delete a user-created timetable event */
export function deleteTimetableEvent(
  eventId: string,
  userId: string
): { success: true } | { success: false; error: string } {
  const idx = mockTimetableEvents.findIndex(e => e.id === eventId && e.user_id === userId);
  if (idx === -1) return { success: false, error: 'Event not found or not owned by user.' };

  const event = mockTimetableEvents[idx];
  if (event.event_source !== 'user') {
    return { success: false, error: 'External events cannot be deleted from the timetable.' };
  }

  mockTimetableEvents.splice(idx, 1);
  return { success: true };
}

/** Toggle the completion state of a to-do timetable event */
export function toggleTimetableEventComplete(
  eventId: string,
  userId: string
): { success: true; event: TimetableEvent } | { success: false; error: string } {
  // Handle both base IDs and instance IDs (recurring instances use "te-X::date" format)
  const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
  const idx = mockTimetableEvents.findIndex(e => e.id === baseId && e.user_id === userId);
  if (idx === -1) return { success: false, error: 'Event not found or not owned by user.' };

  const event = mockTimetableEvents[idx];
  if (!event.is_todo) return { success: false, error: 'Event is not a to-do item.' };

  const newCompleted = !event.is_completed;
  mockTimetableEvents[idx] = {
    ...event,
    is_completed: newCompleted,
    completed_at: newCompleted ? new Date().toISOString() : null,
  };
  return { success: true, event: mockTimetableEvents[idx] };
}

/**
 * Move a timetable event to a new time (drag-and-drop handler).
 * Updates start_time and end_time while preserving duration.
 */
export function moveTimetableEvent(
  eventId: string,
  userId: string,
  newStartTime: string,
  newEndTime: string | null
): { success: true; event: TimetableEvent } | { success: false; error: string } {
  const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
  const idx = mockTimetableEvents.findIndex(e => e.id === baseId && e.user_id === userId);
  if (idx === -1) return { success: false, error: 'Event not found.' };

  const event = mockTimetableEvents[idx];
  if (event.event_source !== 'user') {
    return { success: false, error: 'External events cannot be rescheduled.' };
  }

  mockTimetableEvents[idx] = {
    ...event,
    start_time: newStartTime,
    end_time: newEndTime,
  };
  return { success: true, event: mockTimetableEvents[idx] };
}

/** Get a summary of integration data counts for the IntegrationBanner */
export function getTimetableIntegrationSummary(userId: string): {
  examCount: number;
  assignmentCount: number;
  clubEventCount: number;
  milestoneCount: number;
} {
  const examEvents = getExamCountdownVirtualEvents(userId);
  const clubEvents = getClubEventVirtualEvents(userId);
  const milestones = getClubMilestoneVirtualEvents(userId);

  let assignmentCount = 0;
  try {
    assignmentCount = getAssignmentVirtualEvents(userId).length;
  } catch { /* ignore */ }

  return {
    examCount: examEvents.length,
    assignmentCount,
    clubEventCount: clubEvents.length,
    milestoneCount: milestones.length,
  };
}
