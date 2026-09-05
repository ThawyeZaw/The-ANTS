import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { GenericMetadataSchema } from './zod';
import { z } from 'zod';

export const curriculums = pgTable('curriculums', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  icon_url: text('icon_url'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  curriculum_id: uuid('curriculum_id').references(() => curriculums.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  icon_url: text('icon_url'),
  color_code: text('color_code'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const topics = pgTable('topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  order_index: integer('order_index').default(0),
  subtopics_count: integer('subtopics_count').default(0),
  difficulty_level: text('difficulty_level'),
  estimated_hours: integer('estimated_hours'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const userCurriculums = pgTable('user_curriculums', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  curriculum_id: uuid('curriculum_id').references(() => curriculums.id, { onDelete: 'cascade' }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const topicProgress = pgTable('topic_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  topic_id: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').default('not_started'), // not_started, in_progress, completed
  last_studied_at: timestamp('last_studied_at', { withTimezone: true }),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
});

export const editorSubmissions = pgTable('editor_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  entity_type: text('entity_type').notNull(), // curriculum, subject, topic, exam
  entity_id: uuid('entity_id'),
  submitted_by: uuid('submitted_by').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  data: jsonb('data').$type<z.infer<typeof GenericMetadataSchema>>().notNull(),
  status: text('status').default('pending'), // pending, approved, rejected
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
});
