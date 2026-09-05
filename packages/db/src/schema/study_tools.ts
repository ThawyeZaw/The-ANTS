import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, real } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { curriculums, subjects, topics } from './curriculums';
import {
  RecurrenceRuleSchema,
  GenericMetadataSchema,
} from './zod';
import { z } from 'zod';

export const timetableEvents = pgTable('timetable_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  event_type: text('event_type').default('study'), // study, class, exam, assignment, personal
  start_time: timestamp('start_time', { withTimezone: true }).notNull(),
  end_time: timestamp('end_time', { withTimezone: true }).notNull(),
  all_day: boolean('all_day').default(false),
  is_recurring: boolean('is_recurring').default(false),
  recurrence_pattern: jsonb('recurrence_pattern').$type<z.infer<typeof RecurrenceRuleSchema>>(),
  color_code: text('color_code'),
  metadata: jsonb('metadata').$type<z.infer<typeof GenericMetadataSchema>>().default({}),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const pomodoroSessions = pgTable('pomodoro_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  topic_id: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
  duration_minutes: integer('duration_minutes').notNull(),
  session_type: text('session_type').default('focus'), // focus, short_break, long_break
  started_at: timestamp('started_at', { withTimezone: true }).notNull(),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
});

export const exams = pgTable('exams', {
  id: uuid('id').primaryKey().defaultRandom(),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  curriculum_id: uuid('curriculum_id').references(() => curriculums.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  exam_board: text('exam_board'),
  qualification_type: text('qualification_type'), // IGCSE, A_LEVEL, EDEXCEL, etc.
  syllabus_code: text('syllabus_code'),
  season: text('season'), // May/June, Oct/Nov, Jan
  series: text('series'),
  paper_number: text('paper_number'),
  exam_date: timestamp('exam_date', { withTimezone: true }),
  duration_minutes: integer('duration_minutes'),
  total_marks: integer('total_marks'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const examCountdowns = pgTable('exam_countdowns', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  exam_id: uuid('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  exam_board: text('exam_board'),
  paper_name: text('paper_name'),
  exam_date: timestamp('exam_date', { withTimezone: true }).notNull(),
  color_code: text('color_code'),
  target_grade: text('target_grade'),
  is_mock: boolean('is_mock').default(false),
  is_pinned: boolean('is_pinned').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const gradeBoundaries = pgTable('grade_boundaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  exam_id: uuid('exam_id').references(() => exams.id, { onDelete: 'cascade' }),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
  exam_board: text('exam_board'),
  series: text('series'),
  boundaries: jsonb('boundaries').$type<z.infer<typeof GenericMetadataSchema>>().notNull().default({}),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const gradeEntries = pgTable('grade_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  exam_id: uuid('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  score: real('score').notNull(),
  max_score: real('max_score').notNull(),
  percentage: real('percentage'),
  grade: text('grade'),
  exam_date: timestamp('exam_date', { withTimezone: true }).defaultNow(),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const userEnrollments = pgTable('user_enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  curriculum_id: uuid('curriculum_id').references(() => curriculums.id, { onDelete: 'cascade' }).notNull(),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  exam_id: uuid('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  enrolled_at: timestamp('enrolled_at', { withTimezone: true }).defaultNow(),
});

export const userExamOverrides = pgTable('user_exam_overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  exam_id: uuid('exam_id').references(() => exams.id, { onDelete: 'cascade' }).notNull(),
  custom_title: text('custom_title'),
  custom_exam_series: text('custom_exam_series'),
  custom_exam_date: timestamp('custom_exam_date', { withTimezone: true }),
});

export const userExamHistory = pgTable('user_exam_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  curriculum_id: uuid('curriculum_id').references(() => curriculums.id, { onDelete: 'cascade' }).notNull(),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  exam_id: uuid('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  exam_date: timestamp('exam_date', { withTimezone: true }).notNull(),
  result: text('result'),
  is_mock: boolean('is_mock').default(false),
  notes: text('notes'),
  recorded_at: timestamp('recorded_at', { withTimezone: true }).defaultNow(),
});

export const examSchedules = pgTable('exam_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  exam_id: uuid('exam_id').references(() => exams.id, { onDelete: 'cascade' }).notNull(),
  paper_name: text('paper_name').notNull(),
  start_time: timestamp('start_time', { withTimezone: true }).notNull(),
  end_time: timestamp('end_time', { withTimezone: true }).notNull(),
  venue: text('venue'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
