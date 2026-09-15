import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
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

export const subjects = sqliteTable(
  'subjects',
  {
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
  },
  (table) => [
    index('idx_subjects_curriculum_id').on(table.curriculum_id),
    index('idx_subjects_code').on(table.code),
  ]
);

export const topics = sqliteTable(
  'topics',
  {
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
  },
  (table) => [
    index('idx_topics_subject_id').on(table.subject_id),
    index('idx_topics_subject_order').on(table.subject_id, table.order_index),
  ]
);

export const userCurriculums = sqliteTable(
  'user_curriculums',
  {
    id: idText('id'),
    user_id: textId('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    curriculum_id: textId('curriculum_id')
      .references(() => curriculums.id, { onDelete: 'cascade' })
      .notNull(),
    created_at: tsNow('created_at'),
  },
  (table) => [
    index('idx_user_curriculums_user_id').on(table.user_id),
  ]
);

export const topicProgress = sqliteTable(
  'topic_progress',
  {
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
  },
  (table) => [
    index('idx_topic_progress_user_id').on(table.user_id),
    index('idx_topic_progress_user_topic').on(table.user_id, table.topic_id),
    index('idx_topic_progress_user_status').on(table.user_id, table.status),
  ]
);
