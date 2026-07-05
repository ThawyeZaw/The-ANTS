// ──────────────────────────────────────────────────────────────────────────────
// Timetable Constants
// Colour configs, icons, and defaults for the Smart Timetable feature.
// ──────────────────────────────────────────────────────────────────────────────
import { TimetableEventType, TimetableFilters } from '@/types/timetable';

// ---------------------------------------------------------------------------
// Event Type Configuration
// ---------------------------------------------------------------------------

export interface EventTypeConfig {
  label: string;
  color: string;      // CSS hex colour for the event block
  bgColor: string;    // Tailwind-compatible rgba for block bg
  textColor: string;  // Tailwind text colour class
  icon: string;       // Lucide icon name
}

export const EVENT_TYPE_CONFIG: Record<TimetableEventType, EventTypeConfig> = {
  study: {
    label: 'Study Session',
    color: '#6366f1',
    bgColor: 'rgba(99,102,241,0.15)',
    textColor: 'text-indigo-400',
    icon: 'BookOpen',
  },
  class: {
    label: 'Class',
    color: '#0ea5e9',
    bgColor: 'rgba(14,165,233,0.15)',
    textColor: 'text-sky-400',
    icon: 'GraduationCap',
  },
  school: {
    label: 'School',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.15)',
    textColor: 'text-orange-400',
    icon: 'Building2',
  },
  gym: {
    label: 'Gym / Sport',
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.15)',
    textColor: 'text-green-400',
    icon: 'Dumbbell',
  },
  exam: {
    label: 'Exam',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.15)',
    textColor: 'text-red-400',
    icon: 'FileText',
  },
  break: {
    label: 'Break',
    color: '#a855f7',
    bgColor: 'rgba(168,85,247,0.15)',
    textColor: 'text-purple-400',
    icon: 'Coffee',
  },
  deadline: {
    label: 'Deadline',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.15)',
    textColor: 'text-amber-400',
    icon: 'AlertCircle',
  },
  club_event: {
    label: 'Club Event',
    color: '#ec4899',
    bgColor: 'rgba(236,72,153,0.15)',
    textColor: 'text-pink-400',
    icon: 'Users',
  },
};

/** All event types in display order */
export const ALL_EVENT_TYPES: TimetableEventType[] = [
  'study',
  'class',
  'school',
  'gym',
  'exam',
  'break',
  'deadline',
  'club_event',
];

// ---------------------------------------------------------------------------
// Colour Presets for the colour picker
// ---------------------------------------------------------------------------

export const COLOUR_PRESETS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#f97316', // orange
  '#22c55e', // green
  '#ef4444', // red
  '#a855f7', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#84cc16', // lime
  '#eab308', // yellow
];

// ---------------------------------------------------------------------------
// Time Grid Configuration
// ---------------------------------------------------------------------------

/** Start hour for the timetable grid (6 = 6:00 AM) */
export const GRID_START_HOUR = 6;

/** End hour for the timetable grid (23 = 11:00 PM) */
export const GRID_END_HOUR = 23;

/** Total hours displayed in the grid */
export const GRID_TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR + 1;

/** Height in pixels of one hour slot in the time grid */
export const HOUR_SLOT_HEIGHT = 64;

/** Minimum hour slot height for zoom-to-fit */
export const MIN_SLOT_HEIGHT = 28;

/** Snap increment in minutes for drag-and-drop positioning */
export const SNAP_MINUTES = 15;

/** All hour labels for the time grid */
export const GRID_HOURS: number[] = Array.from(
  { length: GRID_TOTAL_HOURS },
  (_, i) => GRID_START_HOUR + i
);

/** Format a hour number to a display label, e.g. 14 → "2:00 PM" */
export function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  const suffix = hour < 12 ? 'AM' : 'PM';
  const h = hour % 12;
  return `${h}:00 ${suffix}`;
}

/** Format a short hour label for the grid column, e.g. 14 → "2 PM" */
export function formatHourShort(hour: number): string {
  if (hour === 0 || hour === 24) return '12 AM';
  if (hour === 12) return '12 PM';
  const suffix = hour < 12 ? 'AM' : 'PM';
  const h = hour % 12;
  return `${h} ${suffix}`;
}

// ---------------------------------------------------------------------------
// Day Names
// ---------------------------------------------------------------------------

export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ---------------------------------------------------------------------------
// Default Filter State
// ---------------------------------------------------------------------------

export const DEFAULT_TIMETABLE_FILTERS: TimetableFilters = {
  eventTypes: [...ALL_EVENT_TYPES],
  showCompleted: true,
  showExternalEvents: true,
};

// ---------------------------------------------------------------------------
// Recurrence Display Labels
// ---------------------------------------------------------------------------

export const RECURRENCE_LABELS: Record<string, string> = {
  none: 'Does not repeat',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom',
};
