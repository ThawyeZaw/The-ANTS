import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { idText, textId, ts, tsNow, bool, jsonText } from './columns';
import { profiles } from './profiles';
import { curriculums, subjects, topics } from './curriculums';
import { RecurrenceRuleSchema, GenericMetadataSchema } from './zod';
import { z } from 'zod';

export const timetableEvents = sqliteTable('timetable_events', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  event_type: text('event_type').default('study'),
  start_time: ts('start_time').notNull(),
  end_time: ts('end_time').notNull(),
  all_day: bool('all_day', false),
  is_recurring: bool('is_recurring', false),
  recurrence_pattern: jsonText<z.infer<typeof RecurrenceRuleSchema>>('recurrence_pattern'),
  color_code: text('color_code'),
  metadata: jsonText<z.infer<typeof GenericMetadataSchema>>('metadata').$defaultFn(() => ({})),
  created_at: tsNow('created_at'),
});

export const pomodoroUserSettings = sqliteTable('pomodoro_user_settings', {
  user_id: textId('user_id')
    .primaryKey()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  settings: jsonText<Record<string, unknown>>('settings')
    .notNull()
    .$defaultFn(() => ({})),
  updated_at: tsNow('updated_at'),
});

export const pomodoroSessions = sqliteTable('pomodoro_sessions', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  subject_id: textId('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  topic_id: textId('topic_id').references(() => topics.id, { onDelete: 'set null' }),
  duration_minutes: integer('duration_minutes').notNull(),
  session_type: text('session_type').default('focus'),
  started_at: ts('started_at').notNull(),
  completed_at: ts('completed_at'),
  notes: text('notes'),
});

export const exams = sqliteTable(
  'exams',
  {
    id: idText('id'),
    subject_id: textId('subject_id')
      .references(() => subjects.id, { onDelete: 'cascade' })
      .notNull(),
    curriculum_id: textId('curriculum_id').references(() => curriculums.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    exam_board: text('exam_board'),
    qualification_type: text('qualification_type'),
    syllabus_code: text('syllabus_code'),
    season: text('season'),
    series: text('series'),
    paper_number: text('paper_number'),
    exam_date: ts('exam_date'),
    duration_minutes: integer('duration_minutes'),
    total_marks: integer('total_marks'),
    created_at: tsNow('created_at'),
  },
  (table) => [
    index('idx_exams_subject_id').on(table.subject_id),
    index('idx_exams_curriculum_id').on(table.curriculum_id),
    index('idx_exams_exam_date').on(table.exam_date),
  ]
);

export const examCountdowns = sqliteTable(
  'exam_countdowns',
  {
    id: idText('id'),
    user_id: textId('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    exam_id: textId('exam_id').references(() => exams.id, { onDelete: 'set null' }),
    subject_id: textId('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    exam_board: text('exam_board'),
    paper_name: text('paper_name'),
    exam_date: ts('exam_date').notNull(),
    color_code: text('color_code'),
    target_grade: text('target_grade'),
    is_mock: bool('is_mock', false),
    is_pinned: bool('is_pinned', false),
    /** true = user-created custom date; false = auto-created from enrollment */
    is_custom: bool('is_custom', false),
    created_at: tsNow('created_at'),
  },
  (table) => [
    index('idx_exam_countdowns_user_id').on(table.user_id),
    index('idx_exam_countdowns_user_exam').on(table.user_id, table.exam_id),
    index('idx_exam_countdowns_user_subject').on(table.user_id, table.subject_id),
  ]
);

export const gradeBoundaries = sqliteTable('grade_boundaries', {
  id: idText('id'),
  exam_id: textId('exam_id').references(() => exams.id, { onDelete: 'cascade' }),
  subject_id: textId('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
  exam_board: text('exam_board'),
  series: text('series'),
  boundaries: jsonText<z.infer<typeof GenericMetadataSchema>>('boundaries')
    .notNull()
    .$defaultFn(() => ({})),
  created_at: tsNow('created_at'),
});

export const gradeEntries = sqliteTable('grade_entries', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  exam_id: textId('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  subject_id: textId('subject_id')
    .references(() => subjects.id, { onDelete: 'cascade' })
    .notNull(),
  score: real('score').notNull(),
  max_score: real('max_score').notNull(),
  percentage: real('percentage'),
  grade: text('grade'),
  exam_date: tsNow('exam_date'),
  notes: text('notes'),
  created_at: tsNow('created_at'),
});

export const userEnrollments = sqliteTable(
  'user_enrollments',
  {
    id: idText('id'),
    user_id: textId('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    curriculum_id: textId('curriculum_id')
      .references(() => curriculums.id, { onDelete: 'cascade' })
      .notNull(),
    subject_id: textId('subject_id')
      .references(() => subjects.id, { onDelete: 'cascade' })
      .notNull(),
    exam_id: textId('exam_id').references(() => exams.id, { onDelete: 'set null' }),
    /** Canonical session label, e.g. 'May/June 2026' */
    target_series: text('target_series'),
    target_grade: text('target_grade'),
    /** 'core' | 'extended' | null */
    tier: text('tier'),
    /** 'AS' | 'A Level' | null — CAIE A Level (and IAL cash-in grouping) */
    award_level: text('award_level'),
    /** Student paper-route prefs (mathsRoute, appliedUnits, variantPreference, …) */
    paper_preferences: jsonText<{
      mathsRoute?: string;
      sciencePractical?: string;
      appliedUnits?: string[];
      variantPreference?: string | null;
      preferRPaper?: boolean;
    }>('paper_preferences'),
    /** 'per_subject' | 'per_paper' — copied from qualification plugin */
    countdown_mode: text('countdown_mode'),
    enrolled_at: tsNow('enrolled_at'),
  },
  (table) => [
    index('idx_user_enrollments_user_id').on(table.user_id),
    index('idx_user_enrollments_user_curriculum').on(table.user_id, table.curriculum_id),
    index('idx_user_enrollments_user_subject').on(table.user_id, table.subject_id),
  ]
);

export const userExamOverrides = sqliteTable('user_exam_overrides', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  exam_id: textId('exam_id')
    .references(() => exams.id, { onDelete: 'cascade' })
    .notNull(),
  custom_title: text('custom_title'),
  custom_exam_series: text('custom_exam_series'),
  custom_exam_date: ts('custom_exam_date'),
});

export const userExamHistory = sqliteTable('user_exam_history', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  curriculum_id: textId('curriculum_id')
    .references(() => curriculums.id, { onDelete: 'cascade' })
    .notNull(),
  subject_id: textId('subject_id')
    .references(() => subjects.id, { onDelete: 'cascade' })
    .notNull(),
  exam_id: textId('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  exam_date: ts('exam_date').notNull(),
  result: text('result'),
  is_mock: bool('is_mock', false),
  notes: text('notes'),
  recorded_at: tsNow('recorded_at'),
});

export const examSchedules = sqliteTable('exam_schedules', {
  id: idText('id'),
  exam_id: textId('exam_id')
    .references(() => exams.id, { onDelete: 'cascade' })
    .notNull(),
  paper_name: text('paper_name').notNull(),
  start_time: ts('start_time').notNull(),
  end_time: ts('end_time').notNull(),
  venue: text('venue'),
  created_at: tsNow('created_at'),
});

// ── Component routes (seed catalog) ─────────────────────────────────────────

export interface SubjectComponentRouteOptionalGroup {
  id: string;
  label: string;
  options: string[];
}

export const subjectComponentRoutes = sqliteTable(
  'subject_component_routes',
  {
    id: idText('id'),
    subject_id: textId('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
    cash_in_code: text('cash_in_code'),
    award_level: text('award_level'),
    route_key: text('route_key').notNull(),
    label: text('label').notNull(),
    required_paper_ids: jsonText<string[]>('required_paper_ids'),
    required_unit_codes: jsonText<string[]>('required_unit_codes'),
    optional_groups: jsonText<SubjectComponentRouteOptionalGroup[]>('optional_groups'),
    is_myanmar_default: bool('is_myanmar_default', false),
    created_at: tsNow('created_at'),
  },
  (table) => [
    index('idx_subject_component_routes_subject').on(table.subject_id),
    index('idx_subject_component_routes_cash_in').on(table.cash_in_code),
  ]
);

export const userCashInEnrollments = sqliteTable(
  'user_cash_in_enrollments',
  {
    id: idText('id'),
    user_id: textId('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    cash_in_code: text('cash_in_code').notNull(),
    award_level: text('award_level').notNull(),
    selected_units: jsonText<string[]>('selected_units').notNull(),
    applied_pair: jsonText<[string, string]>('applied_pair'),
    enrolled_at: tsNow('enrolled_at'),
  },
  (table) => [
    index('idx_user_cash_in_enrollments_user').on(table.user_id),
    index('idx_user_cash_in_enrollments_user_cash_in').on(table.user_id, table.cash_in_code),
  ]
);

export const userComponentSelections = sqliteTable(
  'user_component_selections',
  {
    id: idText('id'),
    user_id: textId('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    subject_id: textId('subject_id')
      .references(() => subjects.id, { onDelete: 'cascade' })
      .notNull(),
    award_level: text('award_level'),
    route_key: text('route_key').notNull(),
    paper_preferences: jsonText<{
      mathsRoute?: string;
      sciencePractical?: string;
      appliedUnits?: string[];
      variantPreference?: string | null;
      preferRPaper?: boolean;
    }>('paper_preferences'),
    updated_at: tsNow('updated_at'),
  },
  (table) => [
    index('idx_user_component_selections_user').on(table.user_id),
    index('idx_user_component_selections_user_subject').on(table.user_id, table.subject_id),
  ]
);

// ── Past Paper Tracker Catalog ───────────────────────────────────────────────

export const pastPapers = sqliteTable(
  'past_papers',
  {
    id: idText('id'),
    exam_board: text('exam_board').notNull(), // 'CAIE' | 'Edexcel'
    qualification: text('qualification').notNull(), // 'IGCSE' | 'IAL' | 'A Level'
    subject: text('subject').notNull(), // 'Mathematics'
    syllabus_code: text('syllabus_code').notNull(), // '0580'
    subject_id: textId('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
    curriculum_id: textId('curriculum_id').references(() => curriculums.id, { onDelete: 'set null' }),
    year: integer('year').notNull(), // 2023
    series: text('series').notNull(), // 'May/June' | 'Oct/Nov' | 'Jan'
    paper_number: text('paper_number').notNull(), // '1', '2', '3'
    variant: text('variant'), // '1', '2', '3' or null
    title: text('title'), // e.g. "Paper 2 (Extended)"
    total_marks: integer('total_marks'),
    duration_minutes: integer('duration_minutes'),
    created_at: tsNow('created_at'),
  },
  (table) => [
    index('idx_past_papers_subject_id').on(table.subject_id),
    index('idx_past_papers_curriculum_id').on(table.curriculum_id),
    index('idx_past_papers_lookup').on(table.subject_id, table.year, table.series),
  ]
);

// ── Structured Grade Boundaries per Past Paper ──────────────────────────────

/** Syllabus-level composite thresholds for a series (not a single paper). */
export const subjectGradeBoundaries = sqliteTable(
  'subject_grade_boundaries',
  {
    id: idText('id'),
    subject_id: textId('subject_id')
      .references(() => subjects.id, { onDelete: 'cascade' })
      .notNull(),
    year: integer('year').notNull(),
    series: text('series').notNull(), // 'May/June' | 'Oct/Nov' | 'Feb/March'
    variant: text('variant'),
    tier: text('tier'), // 'core' | 'extended' | null
    grade: text('grade').notNull(),
    min_mark: integer('min_mark').notNull(),
    max_mark: integer('max_mark'),
    created_at: tsNow('created_at'),
  },
  (table) => [
    index('idx_subject_grade_boundaries_lookup').on(table.subject_id, table.year, table.series),
  ]
);

export const paperGradeBoundaries = sqliteTable(
  'paper_grade_boundaries',
  {
    id: idText('id'),
    past_paper_id: textId('past_paper_id')
      .references(() => pastPapers.id, { onDelete: 'cascade' })
      .notNull(),
    grade: text('grade').notNull(), // 'A*', 'A', 'B', 'C', 'D', 'E', 'U'
    min_mark: integer('min_mark').notNull(),
    max_mark: integer('max_mark'),
    ums_min: integer('ums_min'), // Edexcel IAL only
    ums_max: integer('ums_max'), // Edexcel IAL only
    created_at: tsNow('created_at'),
  },
  (table) => [
    index('idx_paper_grade_boundaries_paper_id').on(table.past_paper_id),
  ]
);

// ── User Past Paper Tracking Records ────────────────────────────────────────

export interface ComponentMark {
  component: string;
  raw_mark: number;
  max_mark: number;
}

export const userPastPaperRecords = sqliteTable(
  'user_past_paper_records',
  {
    id: idText('id'),
    user_id: textId('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    past_paper_id: textId('past_paper_id')
      .references(() => pastPapers.id, { onDelete: 'cascade' })
      .notNull(),
    status: text('status').default('not_done').notNull(), // 'not_done' | 'done' | 'skipped'
    component_marks: jsonText<ComponentMark[]>('component_marks'),
    raw_score: real('raw_score'),
    max_score: real('max_score'),
    percentage: real('percentage'),
    calculated_grade: text('calculated_grade'),
    calculated_ums: integer('calculated_ums'),
    notes: text('notes'),
    completed_at: ts('completed_at'),
    created_at: tsNow('created_at'),
    updated_at: tsNow('updated_at'),
  },
  (table) => [
    index('idx_user_past_paper_records_user_id').on(table.user_id),
    index('idx_user_past_paper_records_user_paper').on(table.user_id, table.past_paper_id),
    index('idx_user_past_paper_records_status').on(table.user_id, table.status),
  ]
);

// ── Gamification Schema (XP Ledger, Badges, Streaks) ─────────────────────────

export const userXpLedger = sqliteTable(
  'user_xp_ledger',
  {
    id: idText('id'),
    user_id: textId('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    xp_amount: integer('xp_amount').notNull(),
    source: text('source').notNull(), // 'past_paper' | 'pomodoro' | 'lesson' | 'timetable' | 'badge'
    source_id: text('source_id'),
    description: text('description'),
    earned_at: tsNow('earned_at'),
  },
  (table) => [
    index('idx_user_xp_ledger_user_id').on(table.user_id),
  ]
);

export const userBadges = sqliteTable(
  'user_badges',
  {
    id: idText('id'),
    user_id: textId('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    badge_key: text('badge_key').notNull(), // 'first_paper_done', 'streak_7', etc.
    earned_at: tsNow('earned_at'),
  },
  (table) => [
    index('idx_user_badges_user_id').on(table.user_id),
  ]
);

export const userStreaks = sqliteTable('user_streaks', {
  user_id: textId('user_id')
    .primaryKey()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  current_streak: integer('current_streak').default(0).notNull(),
  longest_streak: integer('longest_streak').default(0).notNull(),
  last_activity_date: ts('last_activity_date'),
  total_xp: integer('total_xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  updated_at: tsNow('updated_at'),
});

