# Supabase Integration Readiness Spec

## Why

The existing `spec.md` and `schema.md` describe feature behavior and database tables in detail, but lack the critical Supabase-specific infrastructure specifications needed for a smooth production integration: Row-Level Security (RLS) policies, database indexes, Storage bucket configuration, Realtime channel architecture, seed data, and a complete migration plan. Without these, the transition from mock data (`src/lib/mock/database.ts`) to live Supabase will encounter schema conflicts, missing RLS policies, data leaks, and performance issues.

## What Changes

### 1. Add RLS Policy Specification (Section 25 in spec.md)
- Define per-table RLS policies covering all 4 roles (student, teacher, contributor, main_contributor)
- Specify `FOR ALL` vs `FOR SELECT` vs `FOR INSERT/UPDATE/DELETE` policies
- Document the `auth.uid()` usage pattern for row-level ownership
- Cover edge cases: creator-only access, admin-override, public-read rows

### 2. Add Database Index Specification (Section 26 in spec.md)
- Define composite indexes for high-traffic query patterns (classroom lookups, club membership, flashcards due)
- Define partial indexes for filtered queries (published notes, active decks)
- Define foreign key indexes for all JOIN columns
- Follow Supabase best practices: `query-composite-indexes.md`, `query-covering-indexes.md`, `query-missing-indexes.md`, `query-partial-indexes.md`

### 3. Add Storage Bucket Configuration (Section 27 in spec.md)
- Define buckets: `avatars`, `notes-images`, `role-upgrade-evidence`, `assignment-attachments`
- Set bucket-level RLS policies (public-read for avatars, owner-only write)
- File size limits and MIME type restrictions per bucket
- Supabase Storage folder path conventions

### 4. Add Realtime Subscriptions Architecture (Section 28 in spec.md)
- Define Realtime channel for club chat (`club:{club_id}`)
- Define Realtime channel for classroom notifications (`classroom:{classroom_id}`)
- Define presence tracking for online status
- Permission boundaries: only channel members can subscribe

### 5. Add Auth & Middleware Integration (Section 29 in spec.md)
- Supabase session refresh strategy for Next.js
- Middleware route protection using Supabase Auth helpers
- Role-based redirect (dashboard vs public)
- Custom JWT claims for role information via `custom_access_token` hook

### 6. Add Seed Data Strategy (Section 30 in spec.md)
- Seed data for development: sample profiles, classrooms, clubs, flashcards
- Seed data for demo: exam schedules, grade boundaries, curriculums
- Supabase `seed.sql` file structure and loading order
- Environment-specific seed variants (dev, staging, production)

### 7. Resolve Schema Inconsistencies Between spec.md and schema.md
- Align `profiles` / `contributor_profiles` fields (spec.md expects `specialisations`, `qualifications` but schema.md has different fields)
- Align `exams` table fields (spec.md expects `exam_board`, `paper_code`, `session` but schema.md uses `curriculum_id`, `subject_id`, `exam_series`)
- Align `card_reviews` fields (spec.md uses `ease_factor`, `interval`, `repetitions` but schema.md has `interval_days`, `last_rating`)
- Align `grade_boundaries` structure (spec.md uses per-grade columns but schema.md uses individual rows per grade)
- Align `user_curriculums` (spec.md has `subject_id`, `started_at`, `completed_at` but schema.md has only `curriculum_id`, `selected_at`)
- Add missing tables to schema.md: `club_messages`, `club_announcements`, `club_links`, `club_projects`, `club_events`, `user_saved_notes`
- Add missing tables to spec.md's Section 6: `pomodoro_sessions`, `version_history`, `review_queue`, `user_enrollments`, `user_exam_overrides`, `user_exam_history`, `club_curriculums`, `club_subjects`, `student_profiles`, `teacher_profiles`

### 8. Add Connection Pooling Configuration (Section 31 in spec.md)
- Supabase connection pooler settings (transaction mode, pool size)
- Application-side connection management (pgBouncer awareness)
- Prepared statement considerations for pooled connections

### 9. Add Migration File Strategy (Section 32 in spec.md)
- Migration file naming convention (timestamp_descriptive_name.sql)
- Ordered list of all required migration files
- Migration review and testing process before applying to production

### 10. Update Main spec.md with All New Sections
- Insert new Sections 25-32 after current Section 24
- Update the table of contents in Section 6 (Database Schema Map)
- Add supabase-postgres-best-practices compliance notes throughout

## Impact
- **Affected specs**: Main `c:\Users\USER\Desktop\The-ANTS\spec.md` (insert new sections), `c:\Users\USER\Desktop\The-ANTS\schema.md` (align field definitions)
- **Affected code**: `src/lib/supabase/client.ts` (RLS-aware queries), `src/lib/supabase/server.ts` (server-side auth), `supabase/seed.sql` (new file), `supabase/migrations/*.sql` (new migration files)
- **Supabase config**: `supabase/config.toml` (storage buckets, realtime channels)

## ADDED Requirements

### Requirement: RLS Policy Coverage
The system SHALL define Row-Level Security policies on every table that contains user-specific data.

#### Scenario: Student reads own data
- **WHEN** a student queries `topic_progress` for their user_id
- **THEN** RLS policy `topic_progress_owner_policy` permits the read using `auth.uid() = user_id`
- **AND** querying with a different user_id returns zero rows

#### Scenario: Contributor edits own notes
- **WHEN** a contributor queries `notes` with their own contributor_id
- **THEN** RLS policy `notes_owner_policy` permits all operations (SELECT, INSERT, UPDATE, DELETE)
- **AND** querying notes from another contributor returns only rows with `visibility = 'public'` or `status = 'approved'`

#### Scenario: Main contributor reviews all submissions
- **WHEN** a main_contributor queries `editor_submissions`
- **THEN** RLS policy `editor_submissions_reviewer_policy` permits SELECT on all rows, UPDATE on rows in `pending_review` status

#### Scenario: Unauthenticated user reads public data
- **WHEN** an unauthenticated user queries `clubs` table
- **THEN** RLS policy `clubs_public_read_policy` permits SELECT where `is_public = true`

### Requirement: Database Index Coverage
The system SHALL define indexes covering all high-frequency query patterns.

#### Scenario: Classroom member lookup
- **WHEN** a query filters `classroom_members` by `classroom_id` and `user_id`
- **THEN** a composite index `idx_classroom_members_classroom_user` on `(classroom_id, user_id)` SHALL exist

#### Scenario: Due flashcard review query
- **WHEN** a query filters `card_reviews` by `user_id` and `next_review_date <= now()`
- **THEN** a composite index `idx_card_reviews_user_next_review` on `(user_id, next_review_date)` SHALL exist

#### Scenario: Classroom assignments by status
- **WHEN** a query filters `assignments` by `classroom_id` and `status`
- **THEN** a composite index `idx_assignments_classroom_status` on `(classroom_id, status)` SHALL exist

### Requirement: Storage Bucket Configuration
The system SHALL configure Supabase Storage buckets with appropriate access controls.

#### Scenario: Avatar upload and read
- **WHEN** a user uploads an avatar image
- **THEN** the file SHALL be stored in the `avatars` bucket under `{userId}/avatar.{ext}`
- **AND** the bucket SHALL allow public read, but only owner-write
- **AND** file size SHALL be limited to 5MB, MIME types to `image/jpeg`, `image/png`, `image/webp`

#### Scenario: Note image upload
- **WHEN** a contributor uploads an image in the block editor
- **THEN** the file SHALL be stored in the `notes-images` bucket under `{userId}/{noteId}/{filename}`
- **AND** the bucket SHALL allow authenticated read, owner-only write
- **AND** file size SHALL be limited to 10MB

### Requirement: Realtime Channel Architecture
The system SHALL define Realtime subscriptions for live features.

#### Scenario: Club chat messages
- **WHEN** a club member opens the chat tab
- **THEN** the client SHALL subscribe to Realtime channel `club:{clubId}` on the `club_messages` table
- **AND** only active club members SHALL be authorized to subscribe

#### Scenario: Classroom notification
- **WHEN** a teacher publishes a new assignment
- **THEN** the system SHALL broadcast an event on channel `classroom:{classroomId}`
- **AND** all classroom members subscribed to the channel SHALL receive the notification

### Requirement: Auth & Middleware Integration
The system SHALL integrate Supabase Auth with Next.js middleware for route protection.

#### Scenario: Authenticated route access
- **WHEN** an unauthenticated user navigates to `/dashboard`
- **THEN** middleware SHALL redirect to `/login`
- **AND** the original URL SHALL be preserved in the redirect query string for post-login redirect

#### Scenario: Role claim in JWT
- **WHEN** a user's role is upgraded
- **THEN** a `custom_access_token` hook SHALL add the `user_role` claim to the JWT
- **AND** the `useRole()` hook SHALL read this claim rather than querying the database

### Requirement: Schema Consistency
The system SHALL resolve all field-level inconsistencies between `spec.md` (feature specifications) and `schema.md` (database schema reference).

#### Scenario: Profiles and contributor_profiles alignment
- **GIVEN** spec.md Section 20 expects `contributor_profiles` with fields: `specialisations`, `qualifications`, `published_notes_count`, `published_curriculums_count`, `website`, `github`, `linkedin`, `availability`
- **WHEN** schema.md is updated
- **THEN** `contributor_profiles` SHALL contain all those fields
- **AND** existing fields in schema.md that are not in spec.md SHALL be reviewed (keep if used by existing code, deprecate if unused)

#### Scenario: Exams table alignment
- **GIVEN** spec.md Section 17 and 24 expect `exams` with fields: `subject`, `exam_board`, `paper_code`, `date`, `start_time`, `duration`, `session`, `series`, `year`
- **WHEN** schema.md is updated
- **THEN** the `exams` table SHALL include all those fields
- **AND** `exam_schedules` (from existing migration) SHALL be merged into `exams` as JSONB or additional columns

## MODIFIED Requirements

### Requirement: Existing Section 6 - Database Schema Map
**Change**: Add references to tables currently missing:
- `pomodoro_sessions`, `version_history`, `review_queue`, `user_enrollments`
- `user_exam_overrides`, `user_exam_history`
- `club_curriculums`, `club_subjects`, `student_profiles`, `teacher_profiles`

### Requirement: Existing Section 2 - User Roles & Permissions
**Change**: Add a subsection referencing the custom_access_token hook that embeds role in JWT claims, removing the need for a database query on every request.
