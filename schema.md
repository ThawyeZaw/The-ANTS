# The ANTs — Database Schema Reference (`schema.md`)

> **Single Source of Truth:** Neon Serverless PostgreSQL with Drizzle ORM (`packages/db/src/schema/*`).

---

## 1. User Profiles & Multi-Role System

### Table `profiles`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `uuid` | Primary Key |
| `email` | `text` | Unique, Not Null |
| `name` | `text` | Not Null |
| `username` | `text` | Unique, Not Null |
| `avatar_url` | `text` | Nullable (Cloudflare R2 URL) |
| `role` | `text` | Primary / Active role (Default: `'student'`) |
| `roles` | `text[]` | Multi-role permissions array (`ARRAY['student']::text[]`) |
| `is_public` | `boolean` | Default: `true` |
| `bio` | `text` | Nullable |
| `title` | `text` | Nullable (Headline/Specialization) |
| `social_links` | `jsonb` | Array of `{ id, platform, label, url, visible, order? }` |
| `projects` | `jsonb` | Array of `{ id, title, description, technologies, links }` |
| `activities` | `jsonb` | Array of `{ id, name, organization, role, start_date, end_date }` |
| `achievements` | `jsonb` | Array of `{ id, title, description, date, issuer }` |
| `section_visibility` | `jsonb` | Section show/hide flags |
| `timezone` | `text` | User timezone (Default: `'UTC'`) |
| `telegram_chat_id` | `text` | Nullable (Linked Telegram Chat ID for bot notifications) |
| `notification_preferences` | `jsonb` | Notification delivery toggles |
| `created_at` | `timestamp with time zone` | Default: `now()` |
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
| `contributions_count` | `integer` | Count of published notes & decks |
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

### Table `notes`, `user_saved_notes`, `user_notes`
- `notes`: Official verified curriculum notes with block data (`id`, `title`, `summary`, `curriculum_id`, `subject_id`, `topic_id`, `blocks`, `contributor_id`, `status`).
- `user_saved_notes`: Junction linking students to bookmarked official notes.
- `user_notes`: Personal student notes created in workspace.

### Table `decks`, `cards`, `card_reviews`
- `decks`: Flashcard deck metadata with SRS algorithm settings.
- `cards`: Individual flashcard front/back items.
- `card_reviews`: Review history with interval, ease factor, and recall rating.

### Table `exams`, `exam_countdowns`, `grade_boundaries`
- `exams`: Official syllabus exam series.
- `exam_countdowns`: User pinned target exam countdowns with Telegram notification reminders.
- `grade_boundaries`: Historical raw score to letter grade conversion tables.

---

## 3. System & Authentication Tables
- `user`, `session`, `account`: Better Auth session management.
- `editor_submissions`: Contributor proposals and review queue history.
- `notification_queue`: Scheduled Telegram reminder dispatch queue.
