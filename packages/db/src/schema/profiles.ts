import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  SocialLinksArraySchema,
  ProjectsArraySchema,
  ActivitiesArraySchema,
  AchievementsArraySchema,
  SectionVisibilitySchema,
  StudyGoalsMetadataSchema,
} from './zod';
import { z } from 'zod';

export const userRoleEnum = pgEnum('user_role', [
  'student',
  'teacher',
  'contributor',
  'main_contributor',
]);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  role: userRoleEnum('role').default('student').notNull(),
  is_public: boolean('is_public').default(true),
  bio: text('bio'),
  title: text('title'),
  social_links: jsonb('social_links').$type<z.infer<typeof SocialLinksArraySchema>>(),
  projects: jsonb('projects').$type<z.infer<typeof ProjectsArraySchema>>(),
  activities: jsonb('activities').$type<z.infer<typeof ActivitiesArraySchema>>(),
  achievements: jsonb('achievements').$type<z.infer<typeof AchievementsArraySchema>>(),
  pinned_item_id: text('pinned_item_id'),
  section_visibility: jsonb('section_visibility').$type<z.infer<typeof SectionVisibilitySchema>>(),
  custom_url_slug: text('custom_url_slug').unique(),
  show_club_memberships: boolean('show_club_memberships').default(true),
  show_club_projects: boolean('show_club_projects').default(true),
  show_club_activity: boolean('show_club_activity').default(true),
  certification_ids: uuid('certification_ids').array(),
  timezone: text('timezone').default('UTC'),
});

export const studentProfiles = pgTable('student_profiles', {
  id: uuid('id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  target_exam_year: integer('target_exam_year'),
  study_goals_metadata: jsonb('study_goals_metadata').$type<z.infer<typeof StudyGoalsMetadataSchema>>(),
});

export const teacherProfiles = pgTable('teacher_profiles', {
  id: uuid('id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  institution: text('institution'),
  department: text('department'),
  specialization: text('specialization'),
  verified: boolean('verified').default(false),
});

export const contributorProfiles = pgTable('contributor_profiles', {
  id: uuid('id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  website_url: text('website_url'),
  linkedin_url: text('linkedin_url'),
  github_url: text('github_url'),
  contributor_level: text('contributor_level').default('contributor'),
  contributions_count: integer('contributions_count').default(0),
  rating: text('rating'),
  verified_at: timestamp('verified_at', { withTimezone: true }),
});

export const certifications = pgTable('certifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  issuer: text('issuer').notNull(),
  issue_date: timestamp('issue_date', { withTimezone: true }).notNull(),
  expiry_date: timestamp('expiry_date', { withTimezone: true }),
  credential_id: text('credential_id'),
  credential_url: text('credential_url'),
  certificate_url: text('certificate_url'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const roleUpgradeRequests = pgTable('role_upgrade_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  current_role: userRoleEnum('current_role').notNull(),
  requested_role: userRoleEnum('requested_role').notNull(),
  reason: text('reason'),
  status: text('status').default('pending'),
  reviewer_id: uuid('reviewer_id').references(() => profiles.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
});

export const roleUpgradeApplications = pgTable('role_upgrade_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  target_role: userRoleEnum('target_role').notNull(),
  motivation: text('motivation'),
  portfolio_links: text('portfolio_links').array(),
  status: text('status').default('pending'),
  reviewer_id: uuid('reviewer_id').references(() => profiles.id, { onDelete: 'set null' }),
  reviewer_notes: text('reviewer_notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
});
