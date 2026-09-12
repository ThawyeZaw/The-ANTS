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
