# The ANTs — Database Schema Reference (`schema.md`)

> **Single Source of Truth:** Cloudflare **D1** (SQLite) + Drizzle ORM (`packages/db/src/schema/*`).  
> Historical Postgres SQL under `packages/db/drizzle/` is archive-only (Neon offline until Phase 5/6).  
> New migrations: `packages/db/drizzle-d1/`.  
> Note: some tables below may still list legacy Postgres type names; the live D1 schema uses text UUIDs, JSON-as-text, integer ms timestamps, and 0/1 booleans — see `docs/migration/d1.md`.

---

## 1. User Profiles & Multi-Role System

### Table `profiles`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `text` (UUID) | Primary Key |
| `email` | `text` | Unique, Not Null |
| `name` | `text` | Not Null |
| `username` | `text` | Unique, Not Null |
| `avatar_url` | `text` | Nullable (API/R2 public URL) |
| `role` | `text` | Primary / Active role (Default: `'student'`) |
| `roles` | `text` (JSON) | Multi-role list, e.g. `["student"]` |
| `is_public` | `integer` 0/1 | Default: `1` |
| `bio` | `text` | Nullable |
| `title` | `text` | Nullable (Headline/Specialization) |
| `social_links` | `text` (JSON) | Array of `{ id, platform, label, url, visible, order? }` |
| `projects` | `text` (JSON) | Array of `{ id, title, description, technologies, links }` |
| `activities` | `text` (JSON) | Array of `{ id, name, organization, role, start_date, end_date }` |
| `achievements` | `text` (JSON) | Array of `{ id, title, description, date, issuer }` |
| `section_visibility` | `text` (JSON) | Section show/hide flags |
| `timezone` | `text` | User timezone (Default: `'UTC'`) |
| `telegram_chat_id` | `text` | Nullable (Linked Telegram Chat ID for bot notifications) |
| `notification_preferences` | `text` (JSON) | Notification delivery toggles |
| `created_at` | `integer` (ms) | Default: now |
| `updated_at` | `timestamp with time zone` | Default: `now()` |

### Table `tutor_profiles`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `uuid` | Primary Key, FK $\rightarrow$ `profiles.id` (Cascade) |
| `institution` | `text` | University / Institution affiliation |
| `department` | `text` | Academic faculty / Department |
| `specialization` | `text` | Subject expertise headline |
| `telegram_handle` | `text` | Public Telegram username for student inquiries |
| `hourly_rate` | `text` | Hourly tutoring rate (e.g., `"20,000 MMK/hr"`, `"$25/hr"`) |
| `teaching_curriculums` | `text[]` | Array of syllabus exam boards (e.g., `["Cambridge IGCSE", "Edexcel"]`) |
| `teaching_subjects` | `text[]` | Array of subjects taught (e.g., `["Pure Math", "Chemistry"]`) |
| `availability_slots` | `jsonb` | Sunday–Saturday weekly timetable slots `{ [day]: { [hour]: "available" | "flexible" | "unavailable" } }` |
| `verified` | `boolean` | Default: `false` |
| `is_active` | `boolean` | Default: `true` |

### Table `contributor_profiles`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `uuid` | Primary Key, FK $\rightarrow$ `profiles.id` (Cascade) |
| `website_url` | `text` | Personal portfolio URL |
| `linkedin_url` | `text` | LinkedIn profile |
| `github_url` | `text` | GitHub profile |
| `contributor_level` | `text` | Default: `'contributor'` |
| `contributions_count` | `integer` | Count of published curriculum/exam contributions |
| `verified_at` | `timestamp with time zone` | Verification timestamp |

### Table `certifications`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `uuid` | Primary Key |
| `user_id` | `uuid` | FK $\rightarrow$ `profiles.id` (Cascade) |
| `title` | `text` | Qualification title |
| `issuer` | `text` | Issuing authority |
| `issue_date` | `timestamp with time zone` | Issue date |
| `expiry_date` | `timestamp with time zone` | Nullable expiry date |
| `credential_url` | `text` | Verification link |

---

## 2. Curriculum & Study Tools

### Table `curriculums`, `subjects`, `topics`
- `curriculums`: Board qualifications (`id`, `title`, `description`, `qualification`, `exam_board`).
- `subjects`: Syllabus subjects (`id`, `curriculum_id`, `title`, `description`, `order_no`).
- `topics`: Syllabus topics (`id`, `subject_id`, `title`, `description`, `order_no`).
- `topic_progress`: Student confidence & completion status (`user_id`, `topic_id`, `confidence_level`, `status`).

### Table `timetable_events`
- `id`, `user_id`, `title`, `event_type` (`'class'` | `'study'` | `'exam'` | `'general'`), `start_time`, `end_time`, `all_day`, `is_recurring`, `recurrence_pattern`, `color_code`, `metadata`.

### Table `exams`, `exam_countdowns`, `grade_boundaries`
- `exams`: Official syllabus exam series.
- `exam_countdowns`: User pinned target exam countdowns with Telegram notification reminders.
- `grade_boundaries`: Historical raw score to letter grade conversion tables.

> **Removed (migration `0003_drop_legacy_resources`):** `notes`, `user_notes`, `user_saved_notes`, `decks`, `cards`, `card_reviews`, `resources`, `standalone_quizzes`, `quiz_live_sessions`, `quiz_live_participants`, and legacy classroom tables (`classrooms`, `classroom_*`, `quizzes`, `quiz_attempts`, `assignments`, `assignment_submissions`, `discussion_*`). Study notes/flashcards are replaced by an external Notion content pipeline.

---

## 3. System & Authentication Tables
- `user`, `session`, `account`: Better Auth session management.
- `editor_submissions`: Contributor proposals and review queue history.
- `notification_queue`: Scheduled Telegram reminder dispatch queue.
