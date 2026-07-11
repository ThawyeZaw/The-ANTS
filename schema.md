# The ANTs — Database Schema Reference

> **Quick Sync Check** — This file is the single source of truth for all PostgreSQL table schemas. It must stay in sync with `src/types/index.ts` and `src/lib/mock/database.ts`. When tables, columns, or types change in the code, update this file.
>
> **Last audit (2026-07-09):** 51 tables defined. Cross-referenced against `src/types/index.ts` and `src/lib/mock/database.ts`.
> - **10 tables lack TypeScript types** — `student_profiles`, `teacher_profiles`, `curriculums`, `subjects`, `user_curriculums`, `topic_progress`, `resources` (general), `editor_submissions`, `pomodoro_sessions`, `grade_entries`. These are support/auxiliary tables — their data is embedded in other types or accessed via JSONB fields in the facade.
> - **6 tables have column drift** — `decks`, `exams`, `notes`, `exam_countdowns`, `topics`, `card_reviews`. The TypeScript types have evolved with library-system features (`exam_board`, `visibility`, `share_token`, `library_status`, `syllabus_code` etc.) that are not yet reflected in this schema doc.
> - **`contributor_profiles`** has column naming drift (`website` vs `website_url`, `linkedin` vs `linkedin_url`, `github` vs `github_url`) between schema and TypeScript.
> - **Mock DB coverage:** Core domains (classrooms, clubs, flashcards, notes, profiles, review queue) are fully covered. 18 auxiliary domains have partial or no CRUD functions — see `design-system/mock-db-audit.md` for details.

---

## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `text` |  Unique |
| `name` | `text` |  |
| `username` | `text` |  Unique |
| `avatar_url` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |
| `role` | `user_role` |  Nullable |
| `is_public` | `bool` |  Nullable |
| `bio` | `text` |  Nullable |
| `title` | `text` |  Nullable |
| `social_links` | `jsonb` |  Nullable |
| `projects` | `jsonb` |  Nullable |
| `activities` | `jsonb` |  Nullable |
| `achievements` | `jsonb` |  Nullable |
| `pinned_item_id` | `text` |  Nullable |
| `section_visibility` | `jsonb` |  Nullable |
| `custom_url_slug` | `text` |  Nullable Unique |
| `show_club_memberships` | `bool` |  Default: true |
| `show_club_projects` | `bool` |  Default: true |
| `show_club_activity` | `bool` |  Default: true |
| `certification_ids` | `uuid[]` |  Nullable |

> **`social_links` JSONB structure:** Array of `{ id, platform: ("github" | "facebook" | "linkedin" | "website" | "twitter" | "instagram" | "youtube" | "custom"), label, url, visible: bool, order? }`

> **`projects` JSONB structure:** Array of `{ id, title, description, role?, technologies?: string[], links?: { github?, live?, website?, other? }, media?: string[], isHidden?, order? }`
> **`activities` JSONB structure:** Array of `{ id, name, organization, role, start_date, end_date?, description?, verification_link?, isHidden?, order? }`
> **`achievements` JSONB structure:** Array of `{ id, title, description?, date?, issuer?, link?, isHidden?, order? }`

---

## Table `student_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `target_exam_year` | `int4` |  Nullable |
| `study_goals_metadata` | `jsonb` |  Nullable |

---

## Table `teacher_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_name` | `text` |  Nullable |
| `is_verified_teacher` | `bool` |  Nullable |

---

## Table `contributor_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  Nullable |
| `bio` | `text` |  Nullable |
| `website` | `text` |  Nullable |
| `facebook_url` | `text` |  Nullable |
| `linkedin` | `text` |  Nullable |
| `github` | `text` |  Nullable |
| `verification_documents_url` | `text` |  Nullable |
| `specialisations` | `text[]` |  Nullable |
| `qualifications` | `text[]` |  Nullable |
| `published_notes_count` | `int4` |  Nullable |
| `published_curriculums_count` | `int4` |  Nullable |
| `availability` | `text` |  Nullable |

---

## Table `curriculums`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `qualification` | `text` |  Nullable |
| `exam_board` | `text` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `status` | `text` |  Nullable |
| `is_public` | `bool` |  Nullable |
| `created_at` | `timestamp` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |

---

## Table `subjects`

### Columns

| Name            | Type   | Constraints |
| -----------------| --------| -------------|
| `id`            | `uuid` | Primary     |
| `curriculum_id` | `uuid` |             |
| `title`         | `text` |             |
| `description`   | `text` | Nullable    |
| `order_no`      | `int4` | Nullable    |

---

## Table `topics`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `subject_id` | `uuid` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `order_no` | `int4` |  Nullable |

---

## Table `user_curriculums`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `curriculum_id` | `uuid` |  |
| `subject_id` | `uuid` |  Nullable |
| `started_at` | `timestamp` |  Nullable |
| `completed_at` | `timestamp` |  Nullable |

---

## Table `topic_progress`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `topic_id` | `uuid` |  |
| `confidence_level` | `int4` |  Nullable |
| `status` | `text` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |

---

## Table `resources`

### Columns

| Name             | Type        | Constraints |
| ------------------| -------------| -------------|
| `id`             | `uuid`      | Primary     |
| `curriculum_id`  | `uuid`      | Nullable    |
| `contributor_id` | `uuid`      | Nullable    |
| `title`          | `text`      |             |
| `content`        | `text`      | Nullable    |
| `resource_type`  | `text`      | Nullable    |
| `status`         | `text`      | Nullable    |
| `is_public`      | `bool`      | Nullable    |
| `created_at`     | `timestamp` | Nullable    |
| `updated_at`     | `timestamp` | Nullable    |

---

## Table `editor_submissions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `contributor_id` | `uuid` |  |
| `submission_type` | `text` |  Nullable |
| `entity_id` | `uuid` |  Nullable |
| `status` | `text` |  Nullable |
| `reviewer_id` | `uuid` |  Nullable |
| `feedback` | `text` |  Nullable |
| `submitted_at` | `timestamp` |  Nullable |
| `reviewed_at` | `timestamp` |  Nullable |

---

## Table `classrooms`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `description` | `text` |  Nullable |
| `invite_code` | `text` |  Nullable Unique |
| `curriculum_ids` | `text[]` |  Nullable |
| `enabled_features` | `jsonb` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

> **`enabled_features` JSONB structure:** Array of `{ key: ("assignments" | "quizzes" | "resources" | "discussions" | "links"), enabled: bool }`. Default: all features except quizzes, discussions, and links.

---

## Table `classroom_members`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `classroom_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `role` | `text` |  |
| `joined_at` | `timestamp` |  Nullable |

> **`role` values:** `"teacher"` | `"student"` — classrooms support multiple teachers.

---

## Table `classroom_curriculums`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `classroom_id` | `uuid` |  |
| `curriculum_id` | `uuid` |  |

---

## Table `assignments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `classroom_id` | `uuid` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `due_date` | `timestamp` |  |
| `priority` | `text` |  |
| `status` | `text` |  Default: 'draft' |
| `total_points` | `int4` |  Nullable |
| `attachment_urls` | `text[]` |  Nullable |
| `created_by` | `uuid` |  |
| `created_at` | `timestamp` |  |
| `updated_at` | `timestamp` |  |

> **`priority` values:** `"low"` | `"medium"` | `"high"`
> **`status` values:** `"draft"` | `"published"` | `"closed"`

---

## Table `assignment_submissions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `assignment_id` | `uuid` |  |
| `student_id` | `uuid` |  |
| `content` | `text` |  Nullable |
| `attachment_urls` | `text[]` |  Nullable |
| `submitted_at` | `timestamp` |  Nullable |
| `grade` | `numeric` |  Nullable |
| `feedback` | `text` |  Nullable |
| `graded_at` | `timestamp` |  Nullable |

---

## Table `quizzes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `classroom_id` | `uuid` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `time_limit_minutes` | `int4` |  Nullable |
| `due_date` | `timestamp` |  Nullable |
| `status` | `text` |  |
| `questions` | `jsonb` |  |
| `created_by` | `uuid` |  |
| `created_at` | `timestamp` |  |

> **`status` values:** `"draft"` | `"published"` | `"closed"`
> **`questions` JSONB structure:** Array of `{ id, type, question_text, options?: string[], correct_answer, points, order }` where `type` is `"multiple_choice"` | `"true_false"` | `"short_answer"`.

---

## Table `quiz_attempts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `quiz_id` | `uuid` |  |
| `student_id` | `uuid` |  |
| `answers` | `jsonb` |  |
| `score` | `numeric` |  Nullable |
| `total_points` | `int4` |  |
| `started_at` | `timestamp` |  |
| `submitted_at` | `timestamp` |  Nullable |

> **`answers` JSONB structure:** Array of `{ question_id, answer, is_correct?: bool }`. The `is_correct` field is set server-side after submission.

---

## Table `discussion_topics`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `classroom_id` | `uuid` |  |
| `title` | `text` |  |
| `content` | `text` |  |
| `assignment_id` | `uuid` |  Nullable |
| `is_pinned` | `bool` |  Default: false |
| `is_locked` | `bool` |  Default: false |
| `created_by` | `uuid` |  |
| `created_at` | `timestamp` |  |
| `updated_at` | `timestamp` |  |

---

## Table `discussion_replies`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `topic_id` | `uuid` |  |
| `content` | `text` |  |
| `created_by` | `uuid` |  |
| `created_at` | `timestamp` |  |
| `updated_at` | `timestamp` |  |

---

## Table `classroom_resources`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `classroom_id` | `uuid` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `type` | `text` |  |
| `url` | `text` |  |
| `curriculum_id` | `uuid` |  Nullable |
| `subject_id` | `uuid` |  Nullable |
| `uploaded_by` | `uuid` |  |
| `created_at` | `timestamp` |  |

> **`type` values:** `"pdf"` | `"video"` | `"document"` | `"link"` | `"image"`

---

## Table `clubs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `description` | `text` |  Nullable |
| `created_by` | `uuid` |  |
| `join_mode` | `text` |  Nullable |
| `invite_code` | `text` |  Nullable |
| `enabled_features` | `jsonb` |  Nullable |
| `cover_image_url` | `text` |  Nullable |
| `tagline` | `text` |  Nullable |
| `custom_domain_slug` | `text` |  Nullable Unique |
| `is_showcase` | `bool` |  Default: false |
| `created_at` | `timestamp` |  Nullable |

> **`enabled_features` JSONB structure:** Array of `{ key: ("chat" | "announcements" | "links" | "members" | "projects" | "activity_timeline" | "leaderboard"), enabled: bool, public_visible: bool }`. Default: `["chat", "announcements", "links", "members"]` with all enabled and publicly visible.

---

## Table `club_members`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `role` | `text` |  Nullable |
| `membership_status` | `text` |  Nullable |
| `joined_at` | `timestamp` |  Nullable |

> **`role` values:** `"admin"` | `"moderator"` | `"member"`
> **`membership_status` values:** `"active"` | `"pending"` | `"rejected"`

---

## Table `club_curriculums`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `curriculum_id` | `uuid` |  |

---

## Table `club_subjects`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `subject_id` | `uuid` |  |

---

## Table `club_messages`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `sender_id` | `uuid` |  |
| `message` | `text` |  |
| `created_at` | `timestamp` |  Nullable |

---

## Table `club_announcements`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `created_by` | `uuid` |  |
| `title` | `text` |  Nullable |
| `content` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

---

## Table `club_links`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `title` | `text` |  Nullable |
| `url` | `text` |  Nullable |
| `shared_by` | `uuid` |  |
| `created_at` | `timestamp` |  Nullable |

---

## Table `club_join_requests`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `status` | `text` |  |
| `requested_at` | `timestamp` |  |

> **`status` values:** `"pending"` | `"approved"` | `"rejected"`

---

## Table `club_projects`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `created_by` | `uuid` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `status` | `text` |  Default: 'active' |
| `cover_image_url` | `text` |  Nullable |
| `links` | `jsonb` |  Nullable |
| `contributors` | `uuid[]` |  Nullable |
| `tags` | `text[]` |  Nullable |
| `created_at` | `timestamp` |  |
| `updated_at` | `timestamp` |  Nullable |

> **Permission:** Any active club member can add projects.
> **`status` values:** `"active"` | `"completed"` | `"archived"`
> **`links` JSONB structure:** Array of `{ label, url }` for project-related links (GitHub, live demo, documentation, etc.)

---

## Table `club_events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `created_by` | `uuid` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `event_date` | `timestamp` |  |
| `created_at` | `timestamp` |  |

> **Permission:** Only club leaders (admins and moderators) can schedule events.

---

## Table `club_milestones`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` | FK → clubs.id |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `status` | `text` |  Default: 'planned' |
| `target_date` | `timestamp` |  Nullable |
| `completed_at` | `timestamp` |  Nullable |
| `created_by` | `uuid` | FK → profiles.id |
| `created_at` | `timestamp` |  |
| `order_no` | `int4` |  Nullable |

> **`status` values:** `"planned"` | `"in_progress"` | `"completed"`
> **Permission:** Club leaders (admins and moderators) can create, edit, and delete milestones.

---

## Table `club_member_contributions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` | FK → clubs.id |
| `user_id` | `uuid` | FK → profiles.id |
| `contribution_type` | `text` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `metadata` | `jsonb` |  Nullable |
| `created_at` | `timestamp` |  |

> **`contribution_type` values:** `"project"` | `"event"` | `"milestone_completed"` | `"discussion"` | `"other"`
> **`metadata` JSONB structure:** Flexible object for linked entity IDs (e.g., `{ project_id, event_id, milestone_id }`).
> **Permission:** Club leaders can view all member contributions. Members can view their own contributions.

---

## Table `certifications`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` | FK → profiles.id |
| `type` | `text` |  |
| `subject` | `text` |  Nullable |
| `exam_board` | `text` |  Nullable |
| `grade` | `text` |  Nullable |
| `year` | `int4` |  Nullable |
| `certificate_url` | `text` |  Nullable |
| `is_verified` | `bool` |  Default: false |
| `verified_by` | `uuid` |  Nullable |
| `is_hidden` | `bool` |  Default: false |
| `order_no` | `int4` |  Nullable |
| `created_at` | `timestamp` |  |

> **`type` values:** `"igcse"` | `"as_level"` | `"a_level"` | `"ielts"` | `"toefl"` | `"sat"` | `"other"`
> **Permission:** Users can CRUD their own certifications. Main Contributors can toggle `is_verified` and set `verified_by`. Public profiles show only non-hidden certifications.

---

## Table `timetable_events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` | FK → profiles.id |
| `title` | `text` | |
| `description` | `text` | Nullable |
| `event_type` | `text` | Nullable |
| `subject` | `text` | Nullable |
| `location` | `text` | Nullable |
| `start_time` | `timestamp` | Nullable |
| `end_time` | `timestamp` | Nullable |
| `all_day` | `bool` | Default: false |
| `is_recurring` | `bool` | Default: false |
| `recurrence_rule` | `jsonb` | Nullable |
| `color_code` | `text` | Nullable |
| `is_todo` | `bool` | Default: false |
| `is_completed` | `bool` | Default: false |
| `completed_at` | `timestamp` | Nullable |
| `event_source` | `text` | Default: 'user' |
| `source_id` | `text` | Nullable |
| `metadata` | `jsonb` | Nullable |
| `created_at` | `timestamp` | Nullable |

> **`event_type` values:** `"study"` | `"class"` | `"school"` | `"gym"` | `"exam"` | `"break"` | `"deadline"` | `"club_event"`

> **`event_source` values:** `"user"` (default, user-created) | `"exam_countdown"` (sourced from exam_countdowns) | `"assignment"` (sourced from assignments) | `"club_event"` (sourced from club_events) | `"club_milestone"` (sourced from club_milestones). Events with a non-`"user"` source are **read-only** on the timetable — they cannot be moved or deleted via the timetable UI.

> **`recurrence_rule` JSONB structure:** `{ frequency: ("daily" | "weekly" | "monthly" | "custom"), interval: number, days_of_week?: number[] (0=Sun…6=Sat, for weekly), end_date?: string | null }`. Example — every Monday: `{ frequency: "weekly", interval: 1, days_of_week: [1] }`. Every 2 weeks: `{ frequency: "custom", interval: 14 }`.

> **Integration note:** External events from `exam_countdowns`, `assignments`, `club_events`, and `club_milestones` are **not stored** in `timetable_events`. They are computed at query time by `getIntegratedTimetableEvents()` in the database facade and merged into the calendar view as virtual read-only events. This avoids duplication and ensures changes to the source entity are immediately reflected in the timetable.

---

## Table `pomodoro_sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `duration_minutes` | `int4` |  Nullable |
| `task_name` | `text` |  Nullable |
| `category` | `text` |  Nullable |
| `completed_at` | `timestamp` |  Nullable |

---

## Table `decks`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `owner_id` | `uuid` |  |
| `curriculum_id` | `uuid` |  Nullable |
| `subject_id` | `uuid` |  Nullable |
| `name` | `text` |  Nullable |
| `description` | `text` |  Nullable |
| `category` | `text` |  Nullable |
| `is_public` | `bool` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

---

## Table `cards`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `deck_id` | `uuid` |  |
| `front_text` | `text` |  Nullable |
| `back_text` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

---

## Table `card_reviews`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `card_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `ease_factor` | `numeric` |  Nullable |
| `interval` | `int4` |  Nullable |
| `repetitions` | `int4` |  Nullable |
| `next_review_date` | `timestamp` |  Nullable |
| `last_review_date` | `timestamp` |  Nullable |
| `quality` | `int4` |  Nullable |

---

## Table `exams`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `curriculum_id` | `uuid` |  Nullable |
| `subject_id` | `uuid` |  Nullable |
| `subject` | `text` |  |
| `exam_board` | `text` |  Nullable |
| `paper_code` | `text` |  Nullable |
| `date` | `date` |  |
| `start_time` | `time` |  Nullable |
| `duration` | `int4` |  Nullable |
| `session` | `text` |  Nullable |
| `series` | `text` |  Nullable |
| `year` | `int4` |  Nullable |
| `created_at` | `timestamp` |  |

---

## Table `exam_countdowns`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `exam_id` | `uuid` |  Nullable |
| `custom_title` | `text` |  Nullable |
| `target_date` | `timestamp` |  Nullable |
| `priority_indicator` | `text` |  Nullable |
| `qualification_group` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

---

## Table `grade_boundaries`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `exam_id` | `uuid` |  |
| `raw_mark_max` | `numeric` |  Nullable |
| `ums_max` | `numeric` |  Nullable |
| `grade_a` | `numeric` |  Nullable |
| `grade_b` | `numeric` |  Nullable |
| `grade_c` | `numeric` |  Nullable |
| `grade_d` | `numeric` |  Nullable |
| `grade_e` | `numeric` |  Nullable |
| `grade_f` | `numeric` |  Nullable |
| `grade_g` | `numeric` |  Nullable |
| `grade_u` | `numeric` |  Nullable |

---

## Table `grade_entries`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `exam_id` | `uuid` |  Nullable |
| `component_name` | `text` |  Nullable |
| `raw_score` | `numeric` |  Nullable |
| `max_score` | `numeric` |  Nullable |
| `weight` | `numeric` |  Nullable |
| `predicted_grade` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

---

## Table `user_enrollments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `curriculum_id` | `uuid` |  |
| `subject_id` | `uuid` |  |
| `exam_id` | `uuid` |  Nullable |
| `enrolled_at` | `timestamp` |  |

> Junction table linking a user to a subject within a curriculum, with an optional exam target.

---

## Table `user_exam_overrides`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `exam_id` | `uuid` |  |
| `custom_title` | `text` |  Nullable |
| `custom_exam_series` | `text` |  Nullable |
| `custom_exam_date` | `timestamp` |  Nullable |

> User-specific overrides for exam entries. Only overridden fields are stored; other fields are read from the library `exams` table. Null values mean "use library default".

---

## Table `user_exam_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `curriculum_id` | `uuid` |  |
| `subject_id` | `uuid` |  |
| `exam_id` | `uuid` |  Nullable |
| `exam_date` | `timestamp` |  |
| `result` | `text` |  Nullable |
| `is_mock` | `bool` |  Default: false |
| `notes` | `text` |  Nullable |
| `recorded_at` | `timestamp` |  |

> Completed exam records for the user's exam history. Exam countdowns that pass their target date are moved here automatically.

---

## Table `review_queue`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `contributor_id` | `uuid` |  |
| `submission_type` | `text` |  |
| `entity_id` | `uuid` |  |
| `submitted_data` | `jsonb` |  |
| `is_update` | `bool` |  Default: false |
| `published_entity_id` | `uuid` |  Nullable |
| `status` | `text` |  Default: 'pending' |
| `reviewer_id` | `uuid` |  Nullable |
| `feedback` | `jsonb` |  Nullable |
| `submitted_at` | `timestamp` |  |
| `reviewed_at` | `timestamp` |  Nullable |

> **`submission_type` values:** `"curriculum"` | `"subject"` | `"topic"` | `"note"` | `"resource"` | `"flashcard_deck"` | `"exam"`
> **`status` values:** `"pending"` | `"approved"` | `"rejected"`
> **`feedback` JSONB structure:** `{ categories: ("inaccurate_content" | "formatting_issues" | "missing_information" | "grammar_spelling" | "duplicate_entry" | "outdated_syllabus" | "other")[], note: string }`
> When `is_update` is true, `published_entity_id` refers to the existing published entity being edited (which remains visible during review).

---

## Table `version_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `entity_type` | `text` |  |
| `entity_id` | `uuid` |  |
| `version_number` | `int4` |  |
| `changes` | `jsonb` |  |
| `changed_by` | `uuid` |  |
| `review_item_id` | `uuid` |  Nullable |
| `changed_at` | `timestamp` |  |

> **`changes` JSONB structure:** Array of `{ field: string, old_value: any, new_value: any }` describing field-level diffs.
> **`version_number`** auto-increments per entity. Versions are kept indefinitely. Only `main_contributors` can rollback.

---

## Table `role_upgrade_requests`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `current_role` | `user_role` |  |
| `requested_role` | `user_role` |  |
| `reason` | `text` | Nullable |
| `status` | `text` | Nullable |
| `reviewer_id` | `uuid` | Nullable |
| `created_at` | `timestamp` | Nullable |
| `reviewed_at` | `timestamp` | Nullable |

> **`status` values:** `"pending"`, `"approved"`, `"rejected"`
> **Rule:** Roles can only be upgraded (student → teacher → contributor → main_contributor). Downgrades are not permitted. Only a `main_contributor` can approve or reject upgrade requests.

---

## Table `notes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  |
| `summary` | `text` | Nullable |
| `curriculum_id` | `uuid` | Nullable |
| `subject_id` | `uuid` | Nullable |
| `topic_id` | `uuid` | Nullable |
| `syllabus_point` | `text` | Nullable |
| `is_syllabus_based` | `bool` | Default: false |
| `tags` | `text[]` | Nullable |
| `blocks` | `jsonb` | |
| `contributor_id` | `uuid` | |
| `status` | `text` | Default: 'draft' |
| `visibility` | `text` | Default: 'private' |
| `reviewer_feedback` | `text` | Nullable |
| `reviewer_id` | `uuid` | Nullable |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

> **`blocks` JSONB structure:** Array of `NoteBlock` objects (`{ type, id, ... }` representing headings, paragraphs, latex, svgs, animations, images, code, tables, dividers, links).
> **`status` values:** `"draft"`, `"pending_review"`, `"approved"`, `"rejected"`
> **`visibility` values:** `"private"`, `"link"`, `"public"`. When approved, a note automatically becomes `"public"`.

---

## Table `user_saved_notes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` | |
| `note_id` | `uuid` | |
| `saved_at` | `timestamp` | |
