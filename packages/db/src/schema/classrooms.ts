import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { curriculums, subjects } from './curriculums';
import { QuizQuestionsArraySchema, QuizAnswersSchema, GenericMetadataSchema } from './zod';
import { z } from 'zod';

export const classrooms = pgTable('classrooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  teacher_id: uuid('teacher_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  is_archived: boolean('is_archived').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const classroomMembers = pgTable('classroom_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  classroom_id: uuid('classroom_id').references(() => classrooms.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').default('student'), // student, assistant, co-teacher
  joined_at: timestamp('joined_at', { withTimezone: true }).defaultNow(),
});

export const classroomCurriculums = pgTable('classroom_curriculums', {
  id: uuid('id').primaryKey().defaultRandom(),
  classroom_id: uuid('classroom_id').references(() => classrooms.id, { onDelete: 'cascade' }).notNull(),
  curriculum_id: uuid('curriculum_id').references(() => curriculums.id, { onDelete: 'cascade' }).notNull(),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
});

export const assignments = pgTable('assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  classroom_id: uuid('classroom_id').references(() => classrooms.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  due_date: timestamp('due_date', { withTimezone: true }),
  total_points: integer('total_points').default(100),
  attachment_urls: text('attachment_urls').array(),
  created_by: uuid('created_by').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const assignmentSubmissions = pgTable('assignment_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignment_id: uuid('assignment_id').references(() => assignments.id, { onDelete: 'cascade' }).notNull(),
  student_id: uuid('student_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  content: text('content'),
  attachment_urls: text('attachment_urls').array(),
  submitted_at: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  grade: integer('grade'),
  feedback: text('feedback'),
  graded_by: uuid('graded_by').references(() => profiles.id, { onDelete: 'set null' }),
  graded_at: timestamp('graded_at', { withTimezone: true }),
});

export const quizzes = pgTable('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  classroom_id: uuid('classroom_id').references(() => classrooms.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  questions: jsonb('questions').$type<z.infer<typeof QuizQuestionsArraySchema>>().notNull().default([]),
  time_limit_minutes: integer('time_limit_minutes'),
  total_points: integer('total_points').default(100),
  created_by: uuid('created_by').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  is_published: boolean('is_published').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  quiz_id: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  student_id: uuid('student_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  answers: jsonb('answers').$type<z.infer<typeof QuizAnswersSchema>>().notNull().default({}),
  score: integer('score'),
  started_at: timestamp('started_at', { withTimezone: true }).defaultNow(),
  submitted_at: timestamp('submitted_at', { withTimezone: true }),
});

export const discussionTopics = pgTable('discussion_topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  classroom_id: uuid('classroom_id').references(() => classrooms.id, { onDelete: 'cascade' }).notNull(),
  author_id: uuid('author_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  is_pinned: boolean('is_pinned').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const discussionReplies = pgTable('discussion_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  topic_id: uuid('topic_id').references(() => discussionTopics.id, { onDelete: 'cascade' }).notNull(),
  author_id: uuid('author_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  parent_reply_id: uuid('parent_reply_id'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const classroomResources = pgTable('classroom_resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  classroom_id: uuid('classroom_id').references(() => classrooms.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  resource_type: text('resource_type').notNull(),
  created_by: uuid('created_by').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
