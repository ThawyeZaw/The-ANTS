import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { curriculums, subjects } from './curriculums';
import { ClubFeaturesSchema, ClubLinksArraySchema, GenericMetadataSchema } from './zod';
import { z } from 'zod';

export const clubs = pgTable('clubs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon_url: text('icon_url'),
  banner_url: text('banner_url'),
  is_public: boolean('is_public').default(true),
  join_mode: text('join_mode').default('open'), // open, request, invite_only, closed
  owner_id: uuid('owner_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  enabled_features: jsonb('enabled_features').$type<z.infer<typeof ClubFeaturesSchema>>().default({
    chat: true,
    announcements: true,
    resources: true,
    milestones: true,
    projects: true,
    events: true,
  }),
  stats: jsonb('stats').$type<z.infer<typeof GenericMetadataSchema>>().default({}),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const clubMembers = pgTable('club_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  club_id: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').default('member'), // owner, admin, moderator, member
  joined_at: timestamp('joined_at', { withTimezone: true }).defaultNow(),
});

export const clubCurriculums = pgTable('club_curriculums', {
  id: uuid('id').primaryKey().defaultRandom(),
  club_id: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  curriculum_id: uuid('curriculum_id').references(() => curriculums.id, { onDelete: 'cascade' }).notNull(),
});

export const clubSubjects = pgTable('club_subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  club_id: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
});

export const clubMessages = pgTable('club_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  club_id: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  attachment_urls: text('attachment_urls').array(),
  parent_id: uuid('parent_id'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const clubAnnouncements = pgTable('club_announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  club_id: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  author_id: uuid('author_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  is_pinned: boolean('is_pinned').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const clubLinks = pgTable('club_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  club_id: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  label: text('label').notNull(),
  url: text('url').notNull(),
  icon: text('icon'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const clubJoinRequests = pgTable('club_join_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  club_id: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').default('pending'), // pending, approved, rejected
  message: text('message'),
  reviewed_by: uuid('reviewed_by').references(() => profiles.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
});

export const clubProjects = pgTable('club_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  club_id: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('active'),
  links: jsonb('links').$type<z.infer<typeof ClubLinksArraySchema>>().default([]),
  created_by: uuid('created_by').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const clubEvents = pgTable('club_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  club_id: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  event_type: text('event_type').default('meeting'),
  start_time: timestamp('start_time', { withTimezone: true }).notNull(),
  end_time: timestamp('end_time', { withTimezone: true }),
  location: text('location'),
  meeting_url: text('meeting_url'),
  created_by: uuid('created_by').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const clubMilestones = pgTable('club_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  club_id: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  target_date: timestamp('target_date', { withTimezone: true }),
  is_completed: boolean('is_completed').default(false),
  created_by: uuid('created_by').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const clubMemberContributions = pgTable('club_member_contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  club_id: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  contribution_type: text('contribution_type').notNull(),
  points: integer('points').default(1),
  details: jsonb('details').$type<z.infer<typeof GenericMetadataSchema>>().default({}),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
