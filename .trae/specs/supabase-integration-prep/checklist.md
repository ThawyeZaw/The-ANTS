# Checklist - Supabase Integration Readiness

## RLS Policies
- [x] Section 25 added to spec.md with per-table RLS policy definitions
- [x] Every user-specific table has at least one RLS policy
- [x] Each policy specifies the target role (student/teacher/contributor/main_contributor)
- [x] Public-read tables (curriculums, published notes) have explicit `FOR SELECT` policies for `anon` role
- [x] Creator-ownership pattern implemented for all user-owned tables
- [x] `auth.uid()` used consistently for user identification
- [x] RLS policies for `profiles` table allow users to read/update own profile only
- [x] RLS policies for `contributor_profiles` allow contributors to edit own, others read-only
- [x] RLS policies for `classrooms` allow teachers to manage, students to join
- [x] RLS policies for `assignments`/`quizzes` enforce classroom membership-based access
- [x] RLS policies for `clubs` enforce club membership-based access
- [x] RLS policies for `club_messages` restrict to active club members
- [x] RLS policies for flashcard feature enforce deck ownership
- [x] RLS policies for `editor_submissions`/`review_queue` restrict reviews to main_contributors
- [x] RLS policies for `role_upgrade_requests` respect role upgrade hierarchy

## Database Indexes
- [x] Section 26 added to spec.md with index definitions
- [x] Composite index on `classroom_members(classroom_id, user_id)`
- [x] Composite index on `card_reviews(user_id, next_review_date)`
- [x] Composite index on `assignments(classroom_id, status)`
- [x] Composite index on `club_messages(club_id, created_at)`
- [x] Composite index on `topic_progress(user_id, topic_id)`
- [x] Partial index on `notes where status = 'published'`
- [x] Partial index on `decks where is_public = true`
- [x] Partial index on `editor_submissions where status = 'pending_review'`
- [x] Foreign key indexes on all referencing columns (classroom_id, user_id, deck_id, etc.)

## Storage Buckets
- [x] Section 27 added to spec.md with bucket definitions
- [x] `avatars` bucket: public read, owner write, 5MB limit, image/jpeg+png+webp
- [x] `notes-images` bucket: authenticated read, owner write, 10MB limit
- [x] `role-upgrade-evidence` bucket: main_contributor+owner read, owner write, 20MB limit
- [x] `assignment-attachments` bucket: classroom member read, teacher write, 50MB limit
- [x] Supabase Storage folder path convention documented

## Realtime Subscriptions
- [x] Section 28 added to spec.md with channel architecture
- [x] Club chat channel defined: `club:{club_id}` on `club_messages`
- [x] Classroom notification channel defined: `classroom:{classroom_id}`
- [x] Presence tracking for online status documented
- [x] Subscription authorization rules documented

## Auth & Middleware
- [x] Section 29 added to spec.md with auth integration
- [x] Supabase session refresh strategy with Next.js documented
- [x] Middleware route protection using Supabase Auth helpers documented
- [x] `custom_access_token` hook for role in JWT documented
- [x] Role-based redirect logic documented

## Seed Data
- [x] Section 30 added to spec.md with seed data strategy
- [x] Dev seed data includes profiles for all 4 roles
- [x] Demo seed data includes exam schedules and grade boundaries
- [x] Seed loading order respects foreign key dependencies
- [ ] `supabase/seed.sql` file created with proper INSERT statements (spec documented; file creation deferred to implementation)

## Connection Pooling
- [x] Section 31 added to spec.md with pooling configuration
- [x] Supabase connection pooler settings documented
- [x] Prepared statement considerations documented
- [x] Max connections per feature documented

## Migration Strategy
- [x] Section 32 added to spec.md with migration strategy
- [x] Migration file naming convention documented
- [x] Required migration files listed in order

## Schema Consistency
- [x] All spec.md → schema.md field inconsistencies resolved
- [x] `profiles` fields match between spec.md and schema.md
- [x] `contributor_profiles` fields match (specialisations, qualifications, etc.)
- [x] `exams` table fields match (exam_board, paper_code, session, series, year)
- [x] `card_reviews` fields match (ease_factor, interval, repetitions, next_review_date)
- [x] `grade_boundaries` structure matches (per-grade columns vs per-row)
- [x] `user_curriculums` fields match (subject_id, started_at, completed_at)
- [x] Missing tables added to schema.md: club_messages, club_announcements, club_links, club_projects, club_events, user_saved_notes
- [x] Missing tables added to spec.md Section 6: pomodoro_sessions, version_history, review_queue, user_enrollments, user_exam_overrides, user_exam_history, club_curriculums, club_subjects, student_profiles, teacher_profiles

## Final Document Integrity
- [x] Section numbering is sequential from 1 to 32
- [x] All cross-references point to valid section numbers
- [x] All tables use consistent markdown formatting
- [x] Consistent heading style across all sections
