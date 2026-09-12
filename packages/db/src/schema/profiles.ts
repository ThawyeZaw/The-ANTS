import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { idText, textId, ts, tsNow, bool, jsonText } from './columns';
import {
  SocialLinksArraySchema,
  ProjectsArraySchema,
  ActivitiesArraySchema,
  AchievementsArraySchema,
  SectionVisibilitySchema,
  StudyGoalsMetadataSchema,
} from './zod';
import { z } from 'zod';

/** Valid role strings (CHECK enforced in SQL migration; column remains text). */
export const USER_ROLES = [
  'student',
  'tutor',
  'teacher',
  'contributor',
  'admin',
  'main_contributor',
] as const;

export const profiles = sqliteTable('profiles', {
  id: idText('id'),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  avatar_url: text('avatar_url'),
  created_at: tsNow('created_at'),
  updated_at: tsNow('updated_at'),
  role: text('role').default('student').notNull(),
  roles: jsonText<string[]>('roles')
    .notNull()
    .$defaultFn(() => ['student']),
  is_public: bool('is_public', true),
  bio: text('bio'),
  title: text('title'),
  social_links: jsonText<z.infer<typeof SocialLinksArraySchema>>('social_links'),
  projects: jsonText<z.infer<typeof ProjectsArraySchema>>('projects'),
  activities: jsonText<z.infer<typeof ActivitiesArraySchema>>('activities'),
  achievements: jsonText<z.infer<typeof AchievementsArraySchema>>('achievements'),
  pinned_item_id: text('pinned_item_id'),
  section_visibility: jsonText<z.infer<typeof SectionVisibilitySchema>>('section_visibility'),
  custom_url_slug: text('custom_url_slug').unique(),
  certification_ids: jsonText<string[]>('certification_ids'),
  timezone: text('timezone').default('UTC'),
  onboarding_completed: bool('onboarding_completed', true),
  preferred_name: text('preferred_name'),
  institution_name: text('institution_name'),
  telegram_chat_id: text('telegram_chat_id'),
  notification_preferences: jsonText<Record<string, unknown>>('notification_preferences'),
  founder_type: text('founder_type'),
});

export const studentProfiles = sqliteTable('student_profiles', {
  id: textId('id')
    .primaryKey()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  target_exam_year: integer('target_exam_year'),
  study_goals_metadata: jsonText<z.infer<typeof StudyGoalsMetadataSchema>>('study_goals_metadata'),
});

export const tutorProfiles = sqliteTable('tutor_profiles', {
  id: textId('id')
    .primaryKey()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  institution: text('institution'),
  department: text('department'),
  specialization: text('specialization'),
  telegram_handle: text('telegram_handle'),
  hourly_rate: text('hourly_rate'),
  teaching_curriculums: jsonText<string[]>('teaching_curriculums'),
  teaching_subjects: jsonText<string[]>('teaching_subjects'),
  availability_slots: jsonText<Record<string, unknown>>('availability_slots'),
  is_active: bool('is_active', true),
  verified: bool('verified', false),
});

export const teacherProfiles = tutorProfiles;

export const contributorProfiles = sqliteTable('contributor_profiles', {
  id: textId('id')
    .primaryKey()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  website_url: text('website_url'),
  linkedin_url: text('linkedin_url'),
  github_url: text('github_url'),
  contributor_level: text('contributor_level').default('contributor'),
  contributions_count: integer('contributions_count').default(0),
  rating: text('rating'),
  verified_at: ts('verified_at'),
});

export const certifications = sqliteTable('certifications', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  issuer: text('issuer').notNull(),
  issue_date: ts('issue_date').notNull(),
  expiry_date: ts('expiry_date'),
  credential_id: text('credential_id'),
  credential_url: text('credential_url'),
  certificate_url: text('certificate_url'),
  created_at: tsNow('created_at'),
});

export const roleUpgradeRequests = sqliteTable('role_upgrade_requests', {
  id: idText('id'),
  user_id: textId('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  current_role: text('current_role').notNull(),
  requested_role: text('requested_role').notNull(),
  reason: text('reason'),
  status: text('status').default('pending'),
  reviewer_id: textId('reviewer_id').references(() => profiles.id, { onDelete: 'set null' }),
  created_at: tsNow('created_at'),
  reviewed_at: ts('reviewed_at'),
});

export const roleUpgradeApplications = roleUpgradeRequests;
