import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { idText, textId, ts, tsNow, bool, jsonText } from './columns';
import { profiles } from './profiles';
import {
  VersionChangesArraySchema,
  ReviewFeedbackSchema,
  GenericMetadataSchema,
} from './zod';
import { z } from 'zod';

export const reviewQueue = sqliteTable('review_queue', {
  id: idText('id'),
  contributor_id: textId('contributor_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  submission_type: text('submission_type').notNull(),
  entity_id: textId('entity_id').notNull(),
  submitted_data: jsonText<z.infer<typeof GenericMetadataSchema>>('submitted_data').notNull(),
  is_update: bool('is_update', false),
  published_entity_id: textId('published_entity_id'),
  status: text('status').default('pending'),
  reviewer_id: textId('reviewer_id').references(() => profiles.id, { onDelete: 'set null' }),
  feedback: jsonText<z.infer<typeof ReviewFeedbackSchema>>('feedback'),
  submitted_at: tsNow('submitted_at'),
  reviewed_at: ts('reviewed_at'),
});

export const versionHistory = sqliteTable('version_history', {
  id: idText('id'),
  entity_type: text('entity_type').notNull(),
  entity_id: textId('entity_id').notNull(),
  version_number: integer('version_number').notNull(),
  changes: jsonText<z.infer<typeof VersionChangesArraySchema>>('changes')
    .notNull()
    .$defaultFn(() => []),
  changed_by: textId('changed_by')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  review_item_id: textId('review_item_id'),
  changed_at: tsNow('changed_at'),
});

export const notifications = sqliteTable('notifications', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  link_url: text('link_url'),
  is_read: bool('is_read', false),
  created_at: tsNow('created_at'),
});

export const notificationQueue = sqliteTable('notification_queue', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  channel: text('channel').notNull().default('telegram'),
  payload: jsonText<z.infer<typeof GenericMetadataSchema>>('payload')
    .notNull()
    .$defaultFn(() => ({})),
  status: text('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  last_error: text('last_error'),
  scheduled_for: tsNow('scheduled_for'),
  sent_at: ts('sent_at'),
  created_at: tsNow('created_at'),
  updated_at: tsNow('updated_at'),
});

export const notificationPreferences = sqliteTable('notification_preferences', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  email_enabled: bool('email_enabled', true),
  telegram_enabled: bool('telegram_enabled', false),
  in_app_enabled: bool('in_app_enabled', true),
  channels: jsonText<z.infer<typeof GenericMetadataSchema>>('channels').$defaultFn(() => ({})),
  created_at: tsNow('created_at'),
  updated_at: tsNow('updated_at'),
});

export const activityFeed = sqliteTable('activity_feed', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  action_type: text('action_type').notNull(),
  entity_type: text('entity_type').notNull(),
  entity_id: textId('entity_id').notNull(),
  metadata: jsonText<z.infer<typeof GenericMetadataSchema>>('metadata').$defaultFn(() => ({})),
  created_at: tsNow('created_at'),
});
