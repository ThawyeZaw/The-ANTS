// ──────────────────────────────────────────────────────────────────────────────
// Smart Timetable — Type Definitions
// Synced with: schema.md (timetable_events table), src/lib/mock/database.ts
// ──────────────────────────────────────────────────────────────────────────────

/** The 8 colour-coded event categories for the timetable */
export type TimetableEventType =
  | 'study'       // self-study sessions
  | 'class'       // attending a class/lecture
  | 'school'      // school day / general school event
  | 'gym'         // physical activity / sports
  | 'exam'        // exam sitting
  | 'break'       // rest / break period
  | 'deadline'    // assignment or homework due date (deadline-only, no start time)
  | 'club_event'; // club activity / meeting

/** Where this timetable event originated */
export type TimetableEventSource =
  | 'user'            // created directly by the user in the timetable
  | 'exam_countdown'  // auto-sourced from exam_countdowns table (read-only)
  | 'assignment'      // auto-sourced from assignments table (read-only)
  | 'club_event'      // auto-sourced from club_events table (read-only)
  | 'club_milestone'; // auto-sourced from club_milestones table (read-only)

/** Frequency options for recurring events */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * Recurrence configuration stored as JSONB in `timetable_events.recurrence_rule`.
 * - `frequency`: how often the event repeats
 * - `interval`: repeat every N units (e.g. 1 = every week, 2 = every 2 weeks)
 * - `days_of_week`: for weekly recurrence — which days (0=Sun … 6=Sat)
 * - `end_date`: ISO date string when recurrence ends, or null for indefinite
 */
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  days_of_week?: number[];
  end_date?: string | null;
}

/** Maps to the `timetable_events` table */
export interface TimetableEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  event_type: TimetableEventType;
  /** Subject label for colour-coding and filtering (e.g. "Physics", "Maths") */
  subject?: string | null;
  /** Room, building, or online link for this event */
  location?: string | null;
  /** ISO datetime string — null for all-day or deadline-only events */
  start_time: string | null;
  /** ISO datetime string — null for all-day events; for deadline-only = due datetime */
  end_time: string | null;
  /** True when the event spans the entire day without a specific time */
  all_day: boolean;
  /** True when the event repeats on a schedule */
  is_recurring: boolean;
  /** Recurrence configuration — null if not recurring */
  recurrence_rule: RecurrenceRule | null;
  /** Hex colour code overriding the default type colour (e.g. "#6366f1") */
  color_code: string;
  /** True when this event also acts as a to-do item with a checkbox */
  is_todo: boolean;
  /** True when the to-do has been marked as complete */
  is_completed: boolean;
  /** ISO datetime when is_completed was set to true */
  completed_at: string | null;
  /**
   * Source of this event.
   * - 'user' events are fully editable.
   * - All other sources are read-only virtual events rendered from other tables.
   */
  event_source: TimetableEventSource;
  /** FK to the source entity (exam_countdown.id, assignment.id, etc.) */
  source_id: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

/** Active view mode for the timetable */
export type TimetableView = 'day' | 'week' | 'month';

/** UI filter state for the timetable */
export interface TimetableFilters {
  /** Which event types are currently visible */
  eventTypes: TimetableEventType[];
  /** Whether to show completed to-do events */
  showCompleted: boolean;
  /** Whether to show external events (exam countdowns, assignments, club events) */
  showExternalEvents: boolean;
}

/** Form values for creating or editing a timetable event */
export interface TimetableEventFormData {
  title: string;
  description: string;
  event_type: TimetableEventType;
  subject: string;
  location: string;
  /** 'timed' = has start+end, 'all_day' = full day, 'deadline' = end/due only */
  time_mode: 'timed' | 'all_day' | 'deadline';
  start_time: string;  // "HH:MM" local time string
  end_time: string;    // "HH:MM" local time string
  date: string;        // "YYYY-MM-DD" local date string
  color_code: string;
  is_todo: boolean;
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
}
