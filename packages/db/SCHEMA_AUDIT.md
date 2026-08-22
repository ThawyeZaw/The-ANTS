# Schema Audit & Drift Analysis Report — The ANTS

**Date:** 2026-08-22  
**Target Backend:** Neon Postgres + Drizzle ORM  
**Source Baseline:** `schema.md` (55 tables) vs `supabase/migrations/` (34 migrations) and Next.js frontend code

---

## 1. Executive Summary

This audit cross-references all 55 tables from `schema.md`, the 34 Supabase SQL migration files, and active frontend usage in `apps/web/src/`. All tables and columns have been modeled in Drizzle ORM (`packages/db/src/schema/`) with corresponding Zod validation schemas for all JSONB columns.

- **Total Tables in Drizzle Schema**: 59 tables (55 domain tables + 4 Better Auth tables: `user`, `session`, `account`, `verification`).
- **Tables with Resolved Column Drift**: 6 tables (`decks`, `exams`, `notes`, `exam_countdowns`, `topics`, `card_reviews`).
- **Tables Missing Dedicated Types in Old Schema**: 10 auxiliary tables now have complete first-class Drizzle schemas.
- **Mock DB Status**: All mock facades (`src/lib/mock/database.ts`, `src/lib/mock/timetable.ts`) were confirmed removed; 100% of data access is actively backed by real database tables.

---

## 2. Detailed Audit for the 6 Tables with Column Drift

| Table | Status in `schema.md` | Actual Columns in Database & Code | Resolution in Drizzle Schema |
|---|---|---|---|
| **`decks`** | Missing library & exam link columns | `exam_board`, `exam_series`, `exam_paper`, `syllabus_code`, `library_status`, `share_token`, `forked_from_id` added in migration `20260718000000_add_exam_columns_to_decks.sql` | Added all 7 columns to `decks` in `packages/db/src/schema/study_tools.ts`. |
| **`exams`** | Basic exam properties only | `exam_board`, `qualification_type`, `syllabus_code`, `season`, `series`, `paper_number` used in exam editor and schedule inputs | Full exam metadata columns included in `packages/db/src/schema/study_tools.ts`. |
| **`notes`** | Single generic note table | Dedicated private student notes moved to `user_notes` table (`20260717000000_create_user_notes.sql`); `notes` retained for public/community notes with `is_syllabus_based`, `syllabus_point`, `status`, `visibility` | Modeled both `notes` (community) and `user_notes` (private personal notes) in `packages/db/src/schema/study_tools.ts`. |
| **`exam_countdowns`** | Minimal timer fields | `exam_board`, `paper_name`, `color_code`, `target_grade`, `is_mock`, `is_pinned` used by `CountdownManager.tsx` | Added all display and target fields in `packages/db/src/schema/study_tools.ts`. |
| **`topics`** | Basic hierarchical unit | Extended with `subtopics_count`, `resources_count`, `difficulty_level`, `estimated_hours` (`20260706023110_add_curriculum_extended_columns.sql`) | Added all extended analytics columns in `packages/db/src/schema/curriculums.ts`. |
| **`card_reviews`** | Simple review score | Extended for SM-2/FSRS algorithm: `state` (`new`/`learning`/`review`/`relearning`), `ease_factor`, `interval_days`, `due_date`, `lapses`, `rating`, `review_duration_ms` | Modeled with precision types (real `ease_factor`, integer intervals) in `packages/db/src/schema/study_tools.ts`. |

---

## 3. Auxiliary Tables Formally Typed in Drizzle (Previously Untyped in `schema.md`)

| Table Name | Schema File | Primary Purpose |
|---|---|---|
| `student_profiles` | `profiles.ts` | Student-specific target exam years and study goals metadata. |
| `teacher_profiles` | `profiles.ts` | Teacher verification, institution, department, and specialization. |
| `curriculums` | `curriculums.ts` | Curriculum frameworks (Cambridge IGCSE, Edexcel, Myanmar Matriculation). |
| `subjects` | `curriculums.ts` | Academic subjects linked to curriculums with color codes. |
| `user_curriculums` | `curriculums.ts` | Student curriculum enrollments. |
| `topic_progress` | `curriculums.ts` | Topic completion tracking (`not_started`, `in_progress`, `completed`). |
| `resources` | `curriculums.ts` | Global educational resources (PDFs, links, videos). |
| `editor_submissions` | `curriculums.ts` | Curriculum/content editor change proposals. |
| `pomodoro_sessions` | `study_tools.ts` | Focus session logs and subject/topic attribution. |
| `grade_entries` | `study_tools.ts` | Student grade logs with raw score, percentage, and letter grade. |

---

## 4. JSONB Columns and Associated Zod Validation Schemas

All JSONB fields have explicit Zod validation schemas colocated in `packages/db/src/schema/zod.ts`:

1. **`profiles.social_links`** → `SocialLinksArraySchema` (`platform`, `label`, `url`, `visible`, `order`)
2. **`profiles.projects`** → `ProjectsArraySchema` (`title`, `description`, `role`, `technologies`, `links`, `media`)
3. **`profiles.activities`** → `ActivitiesArraySchema` (`name`, `organization`, `role`, `start_date`, `end_date`, `verification_link`)
4. **`profiles.achievements`** → `AchievementsArraySchema` (`title`, `description`, `date`, `issuer`, `link`)
5. **`profiles.section_visibility`** → `SectionVisibilitySchema`
6. **`student_profiles.study_goals_metadata`** → `StudyGoalsMetadataSchema`
7. **`clubs.enabled_features`** → `ClubFeaturesSchema` (`chat`, `announcements`, `resources`, `milestones`, `projects`, `events`)
8. **`clubs.stats`** → `GenericMetadataSchema`
9. **`club_projects.links`** → `ClubLinksArraySchema`
10. **`timetable_events.recurrence_pattern`** → `RecurrenceRuleSchema` (`frequency`, `interval`, `byDay`, `until`, `count`)
11. **`notes.blocks` & `user_notes.blocks`** → `NoteBlocksArraySchema` (`type`, `content`, `properties`, `children`)
12. **`quizzes.questions`** → `QuizQuestionsArraySchema` (`prompt`, `type`, `options`, `points`, `explanation`)
13. **`quiz_attempts.answers`** → `QuizAnswersSchema`
14. **`review_queue.feedback`** → `ReviewFeedbackSchema`
15. **`version_history.changes`** → `VersionChangesArraySchema` (`field`, `old_value`, `new_value`, `timestamp`)

---

## 5. Better Auth Database Tables

To support the Phase 2 authentication migration, the following standard Better Auth tables are defined in `packages/db/src/schema/auth.ts`:
- **`user`**: `id`, `name`, `email`, `email_verified`, `image`, `role` (custom session role), `created_at`, `updated_at`.
- **`session`**: `id`, `user_id`, `token`, `expires_at`, `ip_address`, `user_agent`, `created_at`, `updated_at`.
- **`account`**: `id`, `user_id`, `account_id`, `provider_id`, `access_token`, `refresh_token`, `password`, `created_at`, `updated_at`.
- **`verification`**: `id`, `identifier`, `value`, `expires_at`, `created_at`, `updated_at`.
