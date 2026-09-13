import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
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

export const exams = sqliteTable('exams', {
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
});

export const examCountdowns = sqliteTable('exam_countdowns', {
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
  created_at: tsNow('created_at'),
});

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

export const userEnrollments = sqliteTable('user_enrollments', {
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
  enrolled_at: tsNow('enrolled_at'),
});

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

// ── Past Paper Tracker Catalog ───────────────────────────────────────────────

export const pastPapers = sqliteTable('past_papers', {
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
});

// ── Structured Grade Boundaries per Past Paper ──────────────────────────────

export const paperGradeBoundaries = sqliteTable('paper_grade_boundaries', {
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
});

// ── User Past Paper Tracking Records ────────────────────────────────────────

export interface ComponentMark {
  component: string;
  raw_mark: number;
  max_mark: number;
}

export const userPastPaperRecords = sqliteTable('user_past_paper_records', {
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
});

// ── Gamification Schema (XP Ledger, Badges, Streaks) ─────────────────────────

export const userXpLedger = sqliteTable('user_xp_ledger', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  xp_amount: integer('xp_amount').notNull(),
  source: text('source').notNull(), // 'past_paper' | 'pomodoro' | 'lesson' | 'timetable' | 'badge'
  source_id: text('source_id'),
  description: text('description'),
  earned_at: tsNow('earned_at'),
});

export const userBadges = sqliteTable('user_badges', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  badge_key: text('badge_key').notNull(), // 'first_paper_done', 'streak_7', etc.
  earned_at: tsNow('earned_at'),
});

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

