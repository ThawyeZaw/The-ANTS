# Tasks

- [x] Task 1: Insert new RLS Policy section (Section 25) into spec.md
  - [x] Write RLS policies for `profiles`, `contributor_profiles`, `student_profiles`, `teacher_profiles`
  - [x] Write RLS policies for `classrooms`, `classroom_members`, `classroom_curriculums`
  - [x] Write RLS policies for `assignments`, `assignment_submissions`
  - [x] Write RLS policies for `quizzes`, `quiz_attempts`
  - [x] Write RLS policies for `discussion_topics`, `discussion_replies`, `classroom_resources`
  - [x] Write RLS policies for `clubs`, `club_members`, `club_messages`, `club_announcements`, `club_links`, `club_join_requests`, `club_projects`, `club_events`, `club_curriculums`, `club_subjects`
  - [x] Write RLS policies for `timetable_events`, `pomodoro_sessions`
  - [x] Write RLS policies for `decks`, `cards`, `card_reviews`
  - [x] Write RLS policies for `exams`, `exam_countdowns`, `grade_boundaries`, `grade_entries`, `exam_schedules`, `user_enrollments`, `user_exam_overrides`, `user_exam_history`
  - [x] Write RLS policies for `notes`, `user_saved_notes`
  - [x] Write RLS policies for `editor_submissions`, `review_queue`, `version_history`
  - [x] Write RLS policies for `role_upgrade_requests`, `role_upgrade_applications`
  - [x] Write RLS policies for `curriculums`, `subjects`, `topics`, `resources`

- [x] Task 2: Insert new Database Index section (Section 26) into spec.md
  - [x] Define composite indexes for classroom feature
  - [x] Define composite indexes for club feature
  - [x] Define composite indexes for flashcard SRS queries
  - [x] Define composite indexes for exam/countdown feature
  - [x] Define composite indexes for lesson tracker/course manager
  - [x] Define partial indexes for status-filtered queries (published notes, active decks, pending reviews)
  - [x] Define foreign key indexes on all referencing columns

- [x] Task 3: Insert new Storage Bucket Configuration section (Section 27) into spec.md
  - [x] Define `avatars` bucket: public read, owner write, 5MB limit, image MIME types
  - [x] Define `notes-images` bucket: authenticated read, owner write, 10MB limit, image MIME types
  - [x] Define `role-upgrade-evidence` bucket: authenticated read (main_contributor + owner), owner write, 20MB limit
  - [x] Define `assignment-attachments` bucket: classroom member read, teacher/owner write, 50MB limit

- [x] Task 4: Insert new Realtime Subscriptions section (Section 28) into spec.md
  - [x] Define club chat channel: `club:{club_id}` on `club_messages` table
  - [x] Define classroom notification channel: `classroom:{classroom_id}` on assignments/quizzes tables
  - [x] Define presence tracking for online status
  - [x] Document subscription authorization rules

- [x] Task 5: Insert new Auth & Middleware Integration section (Section 29) into spec.md
  - [x] Document Supabase session refresh strategy
  - [x] Document middleware route protection using Supabase Auth helpers
  - [x] Document `custom_access_token` hook for embedding role in JWT
  - [x] Document role-based redirect logic

- [x] Task 6: Insert new Seed Data Strategy section (Section 30) into spec.md
  - [x] Define dev seed data: sample profiles (all 4 roles), classrooms, clubs, flashcards
  - [x] Define demo seed data: exam schedules, grade boundaries, curriculums
  - [x] Define seed loading order respecting foreign key dependencies
  - [ ] Create `supabase/seed.sql` file (documented in spec.md; file creation deferred to implementation phase)

- [x] Task 7: Insert new Connection Pooling section (Section 31) into spec.md
  - [x] Document Supabase connection pooler settings
  - [x] Document prepared statement considerations
  - [x] Document max connections per feature

- [x] Task 8: Insert new Migration Strategy section (Section 32) into spec.md
  - [x] Document migration file naming convention
  - [x] List all required migration files in order

- [x] Task 9: Resolve schema inconsistencies between spec.md and schema.md
  - [x] Align `profiles`/`contributor_profiles` fields
  - [x] Align `exams`/`exam_schedules` fields
  - [x] Align `card_reviews` fields
  - [x] Align `grade_boundaries` structure
  - [x] Align `user_curriculums` fields
  - [x] Add missing tables to schema.md: `club_messages`, `club_announcements`, `club_links`, `club_projects`, `club_events`, `user_saved_notes` (already existed)
  - [x] Add missing tables to spec.md Section 6: `pomodoro_sessions`, `version_history`, `review_queue`, `user_enrollments`, `user_exam_overrides`, `user_exam_history`, `club_curriculums`, `club_subjects`, `student_profiles`, `teacher_profiles`

- [x] Task 10: Update existing spec.md sections for Supabase readiness
  - [x] Update Section 2 (User Roles) to reference custom_access_token JWT claims
  - [x] Update Section 6 (Database Schema Map) with missing table references
  - [x] Update Section 4 (Guardrails) with RLS-aware development rules
  - [x] Run final cross-check of all section numbering (now 1-32)

# Task Dependencies
- [Task 9: Schema alignment] must be completed before [Task 1: RLS policies] because RLS policies depend on correct column names
- [Task 6: Seed data] depends on [Task 9: Schema alignment]
- Tasks 1-8 and Task 10 can be parallelized once Task 9 is complete
