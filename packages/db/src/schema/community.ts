import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { idText, tsNow, bool, jsonText } from './columns';

export const orgMission = sqliteTable('org_mission', {
  id: text('id').primaryKey().default('org-mission'),
  content: text('content').notNull(),
  updated_at: tsNow('updated_at'),
});

export const orgTeamMembers = sqliteTable('org_team_members', {
  id: idText('id'),
  name: text('name').notNull(),
  title: text('title').notNull(),
  bio: text('bio'),
  photo_url: text('photo_url'),
  linked_profile_username: text('linked_profile_username'),
  order_index: integer('order_index').notNull().default(0),
  is_alumni: bool('is_alumni', false).notNull(),
  created_at: tsNow('created_at'),
});

export const orgTimelineItems = sqliteTable('org_timeline_items', {
  id: idText('id'),
  title: text('title').notNull(),
  description: text('description'),
  date_label: text('date_label').notNull(),
  category: text('category'),
  image_urls: jsonText<string[]>('image_urls')
    .notNull()
    .$defaultFn(() => []),
  location: text('location'),
  order_index: integer('order_index').notNull().default(0),
  show_on_timeline: bool('show_on_timeline', true).notNull(),
  created_at: tsNow('created_at'),
});
