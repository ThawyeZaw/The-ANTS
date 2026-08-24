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
  'tutor',
  'teacher',
  'contributor',
  'admin',
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
  role: text('role').default('student').notNull(), // Active or primary role
  roles: text('roles').array().notNull().default(sql`ARRAY['student']::text[]`), // Multi-role array
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
  certification_ids: uuid('certification_ids').array(),
  timezone: text('timezone').default('UTC'),
  onboarding_completed: boolean('onboarding_completed').default(true),
  preferred_name: text('preferred_name'),
  institution_name: text('institution_name'),
  telegram_chat_id: text('telegram_chat_id'),
  notification_preferences: jsonb('notification_preferences'),
});

export const studentProfiles = pgTable('student_profiles', {
  id: uuid('id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  target_exam_year: integer('target_exam_year'),
  study_goals_metadata: jsonb('study_goals_metadata').$type<z.infer<typeof StudyGoalsMetadataSchema>>(),
});

export const tutorProfiles = pgTable('tutor_profiles', {
  id: uuid('id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  institution: text('institution'),
  department: text('department'),
  specialization: text('specialization'),
  telegram_handle: text('telegram_handle'),
  hourly_rate: text('hourly_rate'),
  teaching_curriculums: text('teaching_curriculums').array(),
  teaching_subjects: text('teaching_subjects').array(),
  availability_slots: jsonb('availability_slots'), // Sunday to Saturday slots: { [day: string]: { [hour: string]: 'available' | 'flexible' | 'unavailable' } }
  is_active: boolean('is_active').default(true),
  verified: boolean('verified').default(false),
});

export const teacherProfiles = tutorProfiles; // Alias for backward compatibility

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
  current_role: text('current_role').notNull(),
  requested_role: text('requested_role').notNull(),
  reason: text('reason'),
  status: text('status').default('pending'),
  reviewer_id: uuid('reviewer_id').references(() => profiles.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
});

export const roleUpgradeApplications = roleUpgradeRequests; // Alias for backward compatibility
