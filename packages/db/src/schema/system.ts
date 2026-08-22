import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import {
  VersionChangesArraySchema,
  ReviewFeedbackSchema,
  GenericMetadataSchema,
} from './zod';
import { z } from 'zod';

export const reviewQueue = pgTable('review_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  contributor_id: uuid('contributor_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  submission_type: text('submission_type').notNull(), // note, deck, curriculum, question
  entity_id: uuid('entity_id').notNull(),
  submitted_data: jsonb('submitted_data').$type<z.infer<typeof GenericMetadataSchema>>().notNull(),
  is_update: boolean('is_update').default(false),
  published_entity_id: uuid('published_entity_id'),
  status: text('status').default('pending'), // pending, approved, rejected
  reviewer_id: uuid('reviewer_id').references(() => profiles.id, { onDelete: 'set null' }),
  feedback: jsonb('feedback').$type<z.infer<typeof ReviewFeedbackSchema>>(),
  submitted_at: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
});

export const versionHistory = pgTable('version_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  entity_type: text('entity_type').notNull(),
  entity_id: uuid('entity_id').notNull(),
  version_number: integer('version_number').notNull(),
  changes: jsonb('changes').$type<z.infer<typeof VersionChangesArraySchema>>().notNull().default([]),
  changed_by: uuid('changed_by').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  review_item_id: uuid('review_item_id'),
  changed_at: timestamp('changed_at', { withTimezone: true }).defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // announcement, reminder, review, system, social
  title: text('title').notNull(),
  content: text('content'),
  link_url: text('link_url'),
  is_read: boolean('is_read').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const notificationQueue = pgTable('notification_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  channel: text('channel').notNull().default('telegram'), // telegram, email, in_app
  payload: jsonb('payload').$type<z.infer<typeof GenericMetadataSchema>>().notNull().default({}),
  status: text('status').notNull().default('pending'), // pending, processing, sent, failed
  attempts: integer('attempts').notNull().default(0),
  last_error: text('last_error'),
  scheduled_for: timestamp('scheduled_for', { withTimezone: true }).defaultNow(),
  sent_at: timestamp('sent_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull().unique(),
  email_enabled: boolean('email_enabled').default(true),
  telegram_enabled: boolean('telegram_enabled').default(false),
  in_app_enabled: boolean('in_app_enabled').default(true),
  channels: jsonb('channels').$type<z.infer<typeof GenericMetadataSchema>>().default({}),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const activityFeed = pgTable('activity_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  action_type: text('action_type').notNull(),
  entity_type: text('entity_type').notNull(),
  entity_id: uuid('entity_id').notNull(),
  metadata: jsonb('metadata').$type<z.infer<typeof GenericMetadataSchema>>().default({}),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
