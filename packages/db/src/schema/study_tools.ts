import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, real } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { curriculums, subjects, topics } from './curriculums';
import {
  RecurrenceRuleSchema,
  NoteBlocksArraySchema,
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

export const decks = pgTable('decks', {
  id: uuid('id').primaryKey().defaultRandom(),
  owner_id: uuid('owner_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  topic_id: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  is_public: boolean('is_public').default(false),
  tags: text('tags').array(),
  card_count: integer('card_count').default(0),
  // Drift columns synced from library and exam additions
  exam_board: text('exam_board'),
  exam_series: text('exam_series'),
  exam_paper: text('exam_paper'),
  syllabus_code: text('syllabus_code'),
  library_status: text('library_status').default('draft'), // draft, published, archived
  share_token: text('share_token').unique(),
  forked_from_id: uuid('forked_from_id'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  deck_id: uuid('deck_id').references(() => decks.id, { onDelete: 'cascade' }).notNull(),
  front: text('front').notNull(),
  back: text('back').notNull(),
  order_index: integer('order_index').default(0),
  image_url: text('image_url'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const cardReviews = pgTable('card_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  card_id: uuid('card_id').references(() => cards.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  state: text('state').default('new'), // new, learning, review, relearning
  ease_factor: real('ease_factor').default(2.5),
  interval_days: integer('interval_days').default(0),
  due_date: timestamp('due_date', { withTimezone: true }).defaultNow(),
  lapses: integer('lapses').default(0),
  rating: integer('rating'), // 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
  review_duration_ms: integer('review_duration_ms'),
  reviewed_at: timestamp('reviewed_at', { withTimezone: true }).defaultNow(),
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

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  summary: text('summary'),
  curriculum_id: uuid('curriculum_id').references(() => curriculums.id, { onDelete: 'set null' }),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  topic_id: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
  syllabus_point: text('syllabus_point'),
  is_syllabus_based: boolean('is_syllabus_based').default(false),
  tags: text('tags').array(),
  blocks: jsonb('blocks').$type<z.infer<typeof NoteBlocksArraySchema>>().notNull().default([]),
  contributor_id: uuid('contributor_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').default('draft'), // draft, in_review, published, rejected
  visibility: text('visibility').default('private'), // private, public, classroom
  reviewer_feedback: text('reviewer_feedback'),
  reviewer_id: uuid('reviewer_id').references(() => profiles.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const userSavedNotes = pgTable('user_saved_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  note_id: uuid('note_id').references(() => notes.id, { onDelete: 'cascade' }).notNull(),
  saved_at: timestamp('saved_at', { withTimezone: true }).defaultNow(),
});

export const userNotes = pgTable('user_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  topic_id: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  curriculum_id: uuid('curriculum_id').references(() => curriculums.id, { onDelete: 'set null' }),
  title: text('title').notNull().default('Untitled Note'),
  content: text('content'),
  blocks: jsonb('blocks').$type<z.infer<typeof NoteBlocksArraySchema>>().notNull().default([]),
  tags: text('tags').array().default([]),
  color: text('color'),
  is_pinned: boolean('is_pinned').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
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
