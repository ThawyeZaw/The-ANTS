import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

// ── Standalone Quizzes & Live Sessions ──────────────────────────────────────

export interface QuizQuestionAnswer {
  questionIndex: number;
  answer: unknown;
  timeTakenMs: number;
}

// NOTE: Named `standalone_*` / `quiz_live_*` to avoid colliding with the
// legacy classroom-era `quizzes` / `quiz_attempts` tables in migration 0000.
export const standaloneQuizzes = pgTable('standalone_quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  questions: jsonb('questions').$type<unknown[]>().notNull().default([]),
  created_by: uuid('created_by').references(() => profiles.id, { onDelete: 'cascade' }),
  is_public: boolean('is_public').notNull().default(false),
  status: text('status').notNull().default('published'), // draft | published | archived
  share_code: text('share_code').unique(),
  curriculum_id: uuid('curriculum_id'),
  difficulty: text('difficulty'), // easy | medium | hard
  time_limit_minutes: integer('time_limit_minutes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const quizSessions = pgTable('quiz_live_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quiz_id: uuid('quiz_id')
    .references(() => standaloneQuizzes.id, { onDelete: 'cascade' })
    .notNull(),
  host_id: uuid('host_id').references(() => profiles.id, { onDelete: 'set null' }),
  join_code: text('join_code').notNull().unique(),
  status: text('status').notNull().default('waiting'), // waiting | in_progress | ended
  current_question_index: integer('current_question_index').notNull().default(-1),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const quizParticipants = pgTable('quiz_live_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  session_id: uuid('session_id')
    .references(() => quizSessions.id, { onDelete: 'cascade' })
    .notNull(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  display_name: text('display_name').notNull(),
  score: integer('score').notNull().default(0),
  answers: jsonb('answers').$type<QuizQuestionAnswer[]>().notNull().default([]),
  joined_at: timestamp('joined_at', { withTimezone: true }).defaultNow(),
});

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
