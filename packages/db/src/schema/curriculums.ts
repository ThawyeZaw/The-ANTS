import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { idText, textId, ts, tsNow, jsonText } from './columns';
import { profiles } from './profiles';
import { GenericMetadataSchema } from './zod';
import { z } from 'zod';

export const curriculums = sqliteTable('curriculums', {
  id: idText('id'),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  icon_url: text('icon_url'),
  created_at: tsNow('created_at'),
});

export const subjects = sqliteTable('subjects', {
  id: idText('id'),
  curriculum_id: textId('curriculum_id')
    .references(() => curriculums.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  icon_url: text('icon_url'),
  color_code: text('color_code'),
  created_at: tsNow('created_at'),
});

export const topics = sqliteTable('topics', {
  id: idText('id'),
  subject_id: textId('subject_id')
    .references(() => subjects.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  order_index: integer('order_index').default(0),
  subtopics_count: integer('subtopics_count').default(0),
  difficulty_level: text('difficulty_level'),
  estimated_hours: integer('estimated_hours'),
  created_at: tsNow('created_at'),
  updated_at: tsNow('updated_at'),
});

export const userCurriculums = sqliteTable('user_curriculums', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  curriculum_id: textId('curriculum_id')
    .references(() => curriculums.id, { onDelete: 'cascade' })
    .notNull(),
  created_at: tsNow('created_at'),
});

export const topicProgress = sqliteTable('topic_progress', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  topic_id: textId('topic_id')
    .references(() => topics.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').default('not_started'),
  last_studied_at: ts('last_studied_at'),
  completed_at: ts('completed_at'),
  notes: text('notes'),
});

export const editorSubmissions = sqliteTable('editor_submissions', {
  id: idText('id'),
  title: text('title').notNull(),
  entity_type: text('entity_type').notNull(),
  entity_id: textId('entity_id'),
  submitted_by: textId('submitted_by')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  data: jsonText<z.infer<typeof GenericMetadataSchema>>('data').notNull(),
  status: text('status').default('pending'),
  created_at: tsNow('created_at'),
  reviewed_at: ts('reviewed_at'),
});
