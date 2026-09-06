import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

// ── Organisation Content (About page / Mission / Team / Timeline) ───────────

export const orgMission = pgTable('org_mission', {
  id: text('id').primaryKey().default('org-mission'), // singleton row
  content: text('content').notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const orgTeamMembers = pgTable('org_team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  bio: text('bio'),
  photo_url: text('photo_url'),
  linked_profile_username: text('linked_profile_username'),
  order_index: integer('order_index').notNull().default(0),
  is_alumni: boolean('is_alumni').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const orgTimelineItems = pgTable('org_timeline_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  date_label: text('date_label').notNull(), // Display string e.g. "2024 Q1"
  category: text('category'), // workshop | competition | camp | community | other | milestone
  image_urls: jsonb('image_urls').$type<string[]>().notNull().default([]),
  location: text('location'),
  order_index: integer('order_index').notNull().default(0),
  show_on_timeline: boolean('show_on_timeline').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
