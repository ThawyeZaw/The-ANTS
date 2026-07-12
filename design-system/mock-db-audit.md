# Mock Database vs Schema Audit

**Date:** 2026-07-07
**Scope:** `src/lib/mock/database.ts` vs `schema.md`
**Purpose:** Identify gaps between MVP mock data facade and target PostgreSQL schema. No fixes applied — identification only.

---

## Summary

| Metric | Count |
|---|---|
| Schema tables defined | **51** |
| Schema tables covered by mock | **49** |
| Schema tables missing in mock | **1** |
| Mock entities without schema tables | **2** |
| Schema tables referenced in RLS but absent from table list | **2** |

**Overall coverage: 96%**

---

## Gap 1: `timetable_events` — Missing from Mock Database

**Severity:** Medium
**Schema reference:** `schema.md` line 624, RLS policy at line 1480

The `timetable_events` table is defined in the schema with a rich column set (event_type enum, recurrence_rule JSONB, cross-feature virtual events, etc.) but has **no corresponding mock data or query functions** in `src/lib/mock/database.ts`.

**Mitigation:** The timetable feature uses its own separate mock module at `src/lib/mock/timetable.ts` rather than the central `database.ts` facade. This is an architectural inconsistency — all other features use the unified facade.

**Recommendation:** Either:
- A) Migrate `mock/timetable.ts` into `mock/database.ts` for consistency, or
- B) Document this as an intentional exception in the timetable spec (Section 12.6 already references `src/lib/mock/timetable.ts`).

---

## Gap 2: `notifications` — Mock Data Without Schema Table

**Severity:** Low
**Mock reference:** `mockNotifications` (line 3032)

The mock database defines `mockNotifications` with fields (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) but `schema.md` has **no corresponding `notifications` table**.

**Status:** This is a planned feature not yet spec'd. The mock data anticipates a future notification system (currently MVP uses NavBar badge counts only).

**Recommendation:** Add a `notifications` table to `schema.md` when the notification feature is spec'd (referenced in Sections 17, 19, 22 for reminders, review status, and upgrade status).

---

## Gap 3: `activity_feed` — Mock Data Without Schema Table

**Severity:** Low
**Mock reference:** `mockActivityFeed` (line 3055)

The mock database defines `mockActivityFeed` with fields (`id`, `user_id`, `activity_type`, `description`, `created_at`) but `schema.md` has **no corresponding `activity_feed` table**.

**Status:** Used by role landing pages for recent activity display. Currently in-memory only.

**Recommendation:** Add an `activity_feed` table to `schema.md` when the activity tracking feature is formalized.

---

## Gap 4: `exam_schedules` — Referenced in RLS But Not in Table List

**Severity:** Low
**RLS reference:** `schema.md` lines 1497-1499

The RLS policy section (25.7) defines policies for `exam_schedules` (contributor_all, public_select), but the main schema table list (Section 6 / schema.md tables) does not include an `exam_schedules` table definition. It is also referenced in Section 30 (Seed Data Strategy, order 15).

**Recommendation:** Add `exam_schedules` table definition to the schema table list.

---

## Gap 5: `role_upgrade_applications` — Referenced in RLS But Not in Table List

**Severity:** Low
**RLS reference:** `schema.md` lines 1535-1536

The RLS policy section (25.9) defines policies for `role_upgrade_applications`, but the main table list only includes `role_upgrade_requests`. It also appears in the migration strategy (Section 32, order 9).

**Recommendation:** Add `role_upgrade_applications` table definition or clarify that `role_upgrade_requests` serves both purposes.

---

## Coverage Matrix

| # | Schema Table | Mock Coverage | Notes |
|---|---|---|---|
| 1 | `profiles` | Full | mockProfiles, CRUD functions |
| 2 | `student_profiles` | Full | mockStudentProfiles |
| 3 | `teacher_profiles` | Full | mockTeacherProfiles |
| 4 | `contributor_profiles` | Full | mockContributorProfiles |
| 5 | `curriculums` | Full | mockCurriculums, getCurriculum |
| 6 | `subjects` | Full | mockSubjects, getSubjectsByCurriculum |
| 7 | `topics` | Full | mockTopics, CRUD functions |
| 8 | `user_curriculums` | Full | mockUserCurriculums |
| 9 | `topic_progress` | Full | mockTopicProgress |
| 10 | `resources` | Full | mockResources |
| 11 | `editor_submissions` | Full | mockEditorSubmissions |
| 12 | `classrooms` | Full | mockClassrooms, CRUD functions |
| 13 | `classroom_members` | Full | mockClassroomMembers, query functions |
| 14 | `classroom_curriculums` | Full | mockClassroomCurriculums |
| 15 | `assignments` | Full | mockAssignments, query functions |
| 16 | `assignment_submissions` | Full | mockAssignmentSubmissions, CRUD |
| 17 | `quizzes` | Full | mockQuizzes, query functions |
| 18 | `quiz_attempts` | Full | mockQuizAttempts, CRUD |
| 19 | `discussion_topics` | Full | mockDiscussionTopics, query functions |
| 20 | `discussion_replies` | Full | mockDiscussionReplies, CRUD |
| 21 | `classroom_resources` | Full | mockClassroomResources, query functions |
| 22 | `clubs` | Full | mockClubs, getUserClubs |
| 23 | `club_members` | Full | mockClubMembers |
| 24 | `club_curriculums` | Full | mockClubCurriculums |
| 25 | `club_subjects` | Full | mockClubSubjects |
| 26 | `club_messages` | Full | mockClubMessages |
| 27 | `club_announcements` | Full | mockClubAnnouncements |
| 28 | `club_links` | Full | mockClubLinks |
| 29 | `club_join_requests` | Full | mockClubJoinRequests |
| 30 | `club_projects` | Full | mockClubProjects, CRUD |
| 31 | `club_events` | Full | mockClubEvents, CRUD |
| 32 | `club_milestones` | Full | mockClubMilestones, CRUD |
| 33 | `club_member_contributions` | Full | mockMemberContributions, CRUD |
| 34 | `certifications` | Full | mockCertifications, CRUD |
| 35 | `timetable_events` | **MISSING** | Separate `mock/timetable.ts` module |
| 36 | `pomodoro_sessions` | Full | mockPomodoroSessions |
| 37 | `decks` | Full | mockDecks |
| 38 | `cards` | Full | mockFlashCards |
| 39 | `card_reviews` | Full | mockCardReviews, query functions |
| 40 | `exams` | Full | mockExams |
| 41 | `exam_countdowns` | Full | mockExamCountdowns |
| 42 | `grade_boundaries` | Full | mockGradeBoundaries, save function |
| 43 | `grade_entries` | Full | mockGradeEntries |
| 44 | `user_enrollments` | Full | mockUserEnrollments |
| 45 | `user_exam_overrides` | Full | mockUserExamOverrides |
| 46 | `user_exam_history` | Full | mockUserExamHistory |
| 47 | `review_queue` | Full | mockReviewQueue, stats, query functions |
| 48 | `version_history` | Full | mockVersionHistory |
| 49 | `role_upgrade_requests` | Full | mockRoleUpgradeRequests, CRUD functions |
| 50 | `notes` | Full | mockNotes, full CRUD |
| 51 | `user_saved_notes` | Full | mockUserSavedNotes, full CRUD |

---

## Additional Mock Entities (No Schema Table)

| Mock Entity | Purpose | Recommendation |
|---|---|---|
| `mockNotifications` | In-app notifications | Add `notifications` table to schema |
| `mockActivityFeed` | Activity timeline | Add `activity_feed` table to schema |
| `mockContributorStats` | Derived contributor profile stats | Keep as computed — no table needed |
| `mockReviewQueueStats` | Derived review queue stats | Keep as computed — no table needed |
| `mockPasswords` | Auth mock (dev only) | Never use in production; handled by Supabase Auth |

---

## Notes

- The mock database follows the unified facade pattern as specified in `spec.md` Section 3, Rule 2. All features correctly import from `@/lib/mock/database`.
- The `timetable_events` gap is architectural: the timetable feature predates the unified facade and has its own mock module. This should be reconciled during the Supabase migration phase.
- RLS policies reference two tables (`exam_schedules`, `role_upgrade_applications`) not listed in the main schema table definitions — these appear to be legitimate tables that were added to the RLS/migration specs but missed in the table index of `schema.md`.
