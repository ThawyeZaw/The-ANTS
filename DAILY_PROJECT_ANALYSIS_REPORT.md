# 🐜 The ANTS — Daily Project Analysis Report
**Date:** 2026-07-03  
**Analyst:** AI System Architect  
**Files Audited:** `README.md`, `schema.md`, `spec.md`, `src/types/index.ts`

---

## 1. 🔍 Discrepancies & Schema Mismatches (Errors & Mistakes)

### 🔴 Critical Schema Gaps

| # | Feature (README) | Schema Gap | Impact |
|---|---|---|---|
| **1** | Timetable — "Events can be a **to-do** or just an event" | `timetable_events` has **no `is_todo` / `is_event` field**. The `event_type` column exists but is text (nullable) with no enumerated constraint for `"todo"` vs `"event"`. | UI To-Do list rendering will have no reliable column to distinguish event types. The frontend will need to hack around with magic strings or filters, breaking the mock-data contract. |
| **2** | Pomodoro — "Customisable work/break intervals with **background music**" | `pomodoro_sessions` only logs completed sessions (duration, task_name, category, completed_at). **No session_config JSONB** to store interval preferences, and **no music_track_id or sound_preference column**. | Settings persistence for work/break intervals is impossible without a config table. Background music preference (track selection, volume) will be lost on page reload. User frustration when their "25/5 custom" resets every visit. |
| **3** | Clubs — "**Activity Timeline**" feature toggle | `club_events` exists for scheduled events, but **no `club_activity_log` table** for generic activity entries (member joined, project added, announcement posted). | The activity timeline tab in club detail will only show manually scheduled events, missing all organic community activity. Users will see a sparse, static timeline. |
| **4** | Grade Calculator — "Converts to correct grades using official boundary tables" | `grade_entries` stores per-component raw scores + predicted_grade. **No `grade_results` table** to store the calculated final grade (A*, A, B...) for a complete exam entry. | Each visit forces recalculation from raw scores. No ability to display "Your IGCSE Maths predicted grade: A*" persistently on dashboard. No historical tracking of grade improvement. |

### 🟡 Schema Design Concerns

| # | Issue | Details |
|---|---|---|
| **5** | **Data duplication risk** between `profiles` and `contributor_profiles` | `profiles` already has `bio`, `title`, `social_links` (JSONB with github/facebook/linkedin/website). `contributor_profiles` duplicates with `title`, `bio`, `website_url`, `facebook_url`, `linkedin_url`, `github_url`. Two write-paths = guaranteed sync bugs. When a contributor updates their bio in `profiles`, the `contributor_profiles.bio` becomes stale. |
| **6** | **Missing `user_role` PostgreSQL enum definition** | `schema.md` references `user_role` as the type for `profiles.role` and `role_upgrade_requests.current_role`/`requested_role`, but never defines it as a `CREATE TYPE user_role AS ENUM`. The `types/index.ts` defines it as a TS union, but the actual DB migration is undocumented. |
| **7** | **`classroom_resources` and `classroom_links` overlap** | The Links tab in classrooms is documented in `spec.md` §9.7 as being stored in `ClassroomResource` with `type: 'link'`. However, the schema's `classroom_resources` table has `curriculum_id` and `subject_id` columns irrelevant to links. This forces link-sharing entries into a table designed for educational resources, creating confusing nullable columns. |
| **8** | **Discussion topics can link to assignments** | `discussion_topics` has `assignment_id` (uuid, nullable) but this relationship is undocumented in both README and spec. If used, it creates an undocumented foreign key path that the mock facade won't support, breaking the `database.ts` contract. |

### ✅ Schema-UI Sync Status (No Issues)

| Feature | Status | Reason |
|---|---|---|
| Flashcards (SM-2/FSRS) | ✅ Pass | `card_reviews` columns (interval_days, ease_factor, next_review_date, last_rating) fully support SM-2. FSRS handled in `src/lib/srs/algorithm.ts`. |
| Notes + Gatekeeper Review | ✅ Pass | `notes` (status: draft→pending_review→approved→rejected) + `editor_submissions` + reviewer columns all align. |
| Classrooms (all 7 tabs) | ✅ Pass | Full lifecycle tables: `assignments` → `assignment_submissions`, `quizzes` → `quiz_attempts`, `discussion_topics` → `discussion_replies`, `classroom_resources`, `classroom_members`, `classroom_curriculums`. |
| Role Upgrade Flow | ✅ Pass | `role_upgrade_requests` fully covers current_role, requested_role, status, reviewer_id. |
| Exam Countdown | ✅ Pass | `exam_countdowns` has all required fields (exam_id, custom_title, target_date, priority_indicator, qualification_group). |
| Cross-Feature Linking | ✅ Pass | No schema needed — query-based feature using curriculum_id/subject_id/topic_id joins across tables. |

---

## 2. 🛡️ Directory Boundary & Role Gate Audits

### 🔴 Orphaned Directories (No Owner)

| Directory/Files | Files | Risk |
|---|---|---|
| **`src/components/notes/`** | 13 files (AIPromptGenerator, BlockEditor, NoteViewer, etc.) | **No lock owner** in spec.md §7. PM is not assigned. BMK/ABC (who own classrooms + editor) is not assigned. If two devs touch these, merge conflicts guaranteed. |
| **`src/hooks/useNotes.ts`** | 1 hook | No owner lock. |
| **`src/actions/notes.ts`** | 1 server action file | No owner lock. |
| **`supabase/seed.sql`** | Dev seed data | Listed in directory tree but not assigned to PM or any dev. Seed data drift will break mock facade parity. |

**Recommendation:** Assign `src/components/notes/`, `useNotes.ts`, and `actions/notes.ts` to **BMK & ABC** since they own the Curriculum & Notes Editor (`src/app/(app)/editor/notes/page.tsx`). Assign `supabase/seed.sql` to **PM (TYZ)** as DB gatekeeper.

### 🟡 Role Gate Vulnerabilities

| Route | Intended Access | Issue |
|---|---|---|
| `/editor` (curriculum + notes + exam) | Contributor+ | The URL exists at `src/app/(app)/editor/`. NavBar hides the link from Students/Teachers, but a user could **navigate directly** to `/editor` via URL bar. No `useRole()` guard documented in the page files. |
| `/review` | Main Contributor only | Same issue — route exists, NavBar hides it, but direct URL access bypasses the gate. |
| `/main-contributor/add-contributor` | Main Contributor only | No documented middleware or page-level role check. |
| `/main-contributor/role-upgrades` | Main Contributor only | Same risk. |

**Remediation:** Every sensitive route must start with `'use client';` and wrap content in:
```tsx
const { role } = useRole();
if (role !== 'main_contributor') return <Unauthorized />;
```

### 🟡 Missing Server Action: `pomodoro`

| Developer | Has Action File? | Missing |
|---|---|---|
| PPP | `src/actions/timetable.ts` ✅ | **No `src/actions/pomodoro.ts`** listed in directory tree. If pomodoro sessions persist to Supabase later, there's no server action boundary. Create a placeholder. |
| AKT | `src/actions/clubs.ts` ✅ | **No `src/actions/calculator.ts` or `src/actions/grade-calculator.ts`** listed. Grade entries need server actions for CRUD. |

### ✅ Correctly Assigned

| Developer | Routes, Hooks, Actions | Status |
|---|---|---|
| PPP | timetable, pomodoro, usePomodoro, useTimetable, TimerContext, constants | ✅ Complete |
| BMK & ABC | lessons, courses, classrooms, editor, useClassroom, actions | ✅ Complete (except notes ownership gap) |
| ZLH | flashcards, countdown, exam-editor, useFlashcardSRS, useCountdown, actions | ✅ Complete |
| AKT | clubs, calculator, useClub, gradeBoundaries | ✅ Complete (except missing calculator actions) |
| PM (TYZ) | auth, explore, profiles, settings, dashboard, review, main-contributor, ui, layout, hooks, context, actions/roles, constants/qualifications, all lib/, all types/ | ✅ Comprehensive |

---

## 3. 💡 High-Yield Feature Suggestions (User-Focused)

### 🎯 Feature 1: "Exam Heatmap" Dashboard Widget

**Target users:** All Myanmar international students (CAIE, Edexcel, OSSD, SAT, IELTS, Duolingo)

**How it works:** A miniature GitHub-style contribution heatmap on the dashboard that shows **study activity density** by combining:
- `pomodoro_sessions.completed_at` (daily focus minutes)
- `card_reviews.next_review_date` (flashcard study activity)
- `topic_progress.updated_at` (lesson study activity)

**Schema required:** **Zero new columns.** Pure query aggregation across 3 existing tables.

**Impact:** Students preparing for CAIE IGCSEs or IELTS can see at a glance if they've been consistent. The heatmap creates a "don't break the streak" dopamine loop — critical for long exam preparation cycles (6-18 months).

**Implementation:** Dashboard `page.tsx` (PM-owned) → new `src/hooks/useStudyHeatmap.ts` → mock facade query. `<Heatmap />` component in `src/components/ui/`.

---

### 🎯 Feature 2: "Confidence Gap Analyzer" for Lesson Tracker

**Target users:** Students tracking progress across multiple subjects (CAIE A Level, Edexcel IAL)

**How it works:** When viewing the Lesson Tracker, a small panel highlights topics where:
- `topic_progress.confidence_level` < 3 (low confidence)
- AND `topic_progress.updated_at` is > 7 days old (not recently studied)
- AND the parent subject has an upcoming exam in `exam_countdowns`

Each gap shows a **"Quick Study"** button that links directly to relevant flashcards (joining `subjects.id` → `decks.subject_id` → `cards`) and notes (joining `subjects.id` → `notes.subject_id`).

**Schema required:** **Zero new columns.** Leverages existing relationships:
- `subject_id` on `decks` + `notes` + `topics`
- `topic_progress.confidence_level`
- `exam_countdowns` for urgency context

**Impact:** Instead of manually cross-referencing "what am I bad at" vs "what exam is coming up", the system surfaces it automatically. For a student juggling 5 CAIE IGCSE subjects, this saves ~30 min/week in planning overhead.

---

### 🎯 Feature 3: "Smart Pomodoro + Timetable Sync" 

**Target users:** Students using both Timetable and Pomodoro features

**How it works:** When a student clicks a study block in their timetable, the Pomodoro timer auto-launches with:
- **Task name pre-filled** from `timetable_events.title`
- **Category pre-set** from `timetable_events.event_type`
- **Duration suggested** based on the event's `start_time` / `end_time` block length
- **Session logged** back to `pomodoro_sessions` with the `metadata` JSONB containing `{ source_event_id: timetable_events.id }`

**Schema required:** **Zero new columns.** Uses existing `pomodoro_session.metadata` (already JSONB nullable) or `timetable_events.metadata` (already JSONB nullable).

**Impact:** Students doing CAIE Physics revision blocks no longer need to manually configure the Pomodoro — they click their study block and the timer is ready. Creates a tight feedback loop: "I planned 2 hours for Chemistry → timer ran for 4 pomodoros → logged as 2 hours of Chemistry study."

---

## 4. 📝 Next-Step Developer Context Shield

### For BMK & ABC (Classrooms + Notes Editor)

> *"You are building inside `src/components/classrooms/`, `src/components/Lessons/`, `src/components/notes/`, and `src/app/(app)/classrooms/`, `src/app/(app)/lessons/`, `src/app/(app)/courses/`, `src/app/(app)/editor/`. You must respect the project architecture constraints detailed in `spec.md`, use the database typing declarations in `types/index.ts`, and pull data operations exclusively through the shared mock database facade at `src/lib/mock/database.ts`. Do not invent custom database properties, unmapped relational paths, or arbitrary styling elements (e.g. hardcoded pixels like `p-[13px]`) that cause utility bloat. All interactive UI (classroom tabs, lesson tracker, quiz creator, notes block editor) must start with the `'use client';` directive. The app uses four roles: `student`, `teacher`, `contributor`, `main_contributor` — use `useRole()` from `src/hooks/useRole.ts` for any role-gated logic in classroom settings and the notes gatekeeper workflow. Classrooms support multiple teachers; the `classroom_members.role` column uses `"teacher" | "student"` values, not the global role enum. The notes `status` workflow is `draft → pending_review → approved/rejected`, and the `visibility` column uses `"private" | "link" | "public"` — do not conflate the two."

### For ZLH (Flashcards + Exam Countdown + Exam Data Editor)

> *"You are building inside `src/components/flashcards/`, `src/components/countdown/`, `src/app/(app)/flashcards/`, `src/app/(app)/countdown/`, and `src/app/(app)/editor/exam/`. You must respect the project architecture constraints detailed in `spec.md`, use the database typing declarations in `types/index.ts`, and pull data operations exclusively through the shared mock database facade at `src/lib/mock/database.ts`. Do not invent custom database properties, unmapped relational paths, or arbitrary styling elements. All interactive UI (study session, card flipping, countdown management, exam data editor) must start with the `'use client';` directive. The SRS algorithm lives in `src/lib/srs/algorithm.ts` — import it directly; do not reimplement SM-2/FSRS logic inside components. The `card_reviews.last_rating` uses `"again" | "hard" | "good" | "easy"` matching the `SRSRating` type — these are the only valid values. For exam data editing, follow the `exams → grade_boundaries` relationship: one exam has many boundary rows (grade + min_mark + max_mark). Exam countdowns link to exams via `exam_countdowns.exam_id` but also allow standalone `custom_title` + `target_date` for user-created countdowns."

### For AKT (Grade Calculator + Clubs)

> *"You are building inside `src/components/clubs/`, `src/app/(app)/clubs/`, `src/app/(app)/calculator/`, and should create `src/actions/calculator.ts` for grade entry server actions. You must respect the project architecture constraints detailed in `spec.md`, use the database typing declarations in `types/index.ts`, and pull data operations exclusively through the shared mock database facade at `src/lib/mock/database.ts`. Do not invent custom database properties, unmapped relational paths, or arbitrary styling elements. All interactive UI (club chat, member management, grade entry forms) must start with the `'use client';` directive. Clubs use a three-tier role system (`admin | moderator | member`) stored in `club_members.role` — completely separate from the global `user_role` enum. Join modes are `"open" | "invite_link" | "approval_based"`. The grade calculator must support weighted multi-component calculations using `grade_entries.weight` (numeric, nullable) against `grade_boundaries` (min_mark/max_mark per grade per exam). Official boundary reference data lives in `src/constants/gradeBoundaries.ts` — do not hardcode boundary values."

### For PPP (Timetable + Pomodoro)

> *"You are building inside `src/app/(app)/timetable/`, `src/app/(app)/pomodoro/`, and `src/components/timetable/` (create if needed), plus `src/actions/pomodoro.ts` (create for persistence). You must respect the project architecture constraints detailed in `spec.md`, use the database typing declarations in `types/index.ts`, and pull data operations exclusively through the shared mock database facade at `src/lib/mock/database.ts`. Do not invent custom database properties, unmapped relational paths, or arbitrary styling elements. All interactive UI (drag-and-drop timetable, pomodoro countdown, audio controls) must start with the `'use client';` directive. The Pomodoro timer uses `TimerContext.tsx` for global state — do not create a second context. Timetable events use `event_type` (text) for classification — note that the schema currently has **no `is_todo` boolean**; if you need to distinguish events from to-dos, use the `metadata` JSONB column with `{ type: "event" | "todo" }` as a convention until the PM adds the column. Background music files are in `public/sounds/` — reference them via URL paths, not imports."