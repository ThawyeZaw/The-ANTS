# Course Manager Central Source of Truth — Implementation Plan

> **Status:** Awaiting review  
> **Prepared after:** Deep audit of Next.js frontend, TypeScript types, Supabase schema files, hooks, components, and all 19 migrations.

---

## Background & Problem Statement

The ANTs currently has a fragmented data model:

- **Course Manager** (`/courses`) manages `user_enrollments` (Curriculum + Subject + Exam target)
- **Lesson Tracker** (`/lessons`) independently fetches its own copy of `user_curriculums` (a **separate, older table**) + `topics` + `topic_progress`
- **Flashcards** (`/flashcards`) is still on **mock data** (`lib/mock/database.ts`) — no Supabase integration at all
- **Notes** (`/my-notes`) uses `useNotes` which filters by `curriculum_id`/`subject_id`/`topic_id` on the official `notes` table — but there is no concept of **user-authored personal notes**, only contributor-reviewed platform notes

The result: three tools talking to overlapping but inconsistent data sources, with **zero** cascade when a user changes their curriculum selection.

---

## Gap Analysis

### 1. Dual Enrollment Tables (Critical)

| Table | Used By | Contains |
|---|---|---|
| `user_curriculums` | `useLessons` hook | `(user_id, curriculum_id, subject_id?)` — the **old** enrollment table |
| `user_enrollments` | `useCourseManager` hook | `(user_id, curriculum_id, subject_id, exam_id?)` — the **new** enrollment table |

**The Lesson Tracker reads from `user_curriculums`. Course Manager writes to `user_enrollments`. They are entirely disconnected.** This means enrolling in Course Manager does NOT update the Lesson Tracker.

### 2. Missing "Lesson" Concept

The hierarchy the platform uses is `Curriculum → Subject → Topic`. Your required hierarchy is `Curriculum → Course → Lesson`. The current `topics` table is the conceptual equivalent of **Lesson**, and `subjects` is the conceptual equivalent of **Course**. No rename is needed at the database level (renaming would break all existing FK chains), but frontend labels and types should be updated to reflect this mapping.

### 3. No `topic_id` on `decks` (Flashcards gap)

`decks` has `curriculum_id` and `subject_id` FKs but **no `topic_id` FK**. User-created decks cannot be scoped to a specific lesson/topic.

### 4. No `topic_id` on notes (Personal Notes gap)

The official `notes` table already has `topic_id`. However there is **no separate table** for user-personal notes — a student cannot author a private note tied to a lesson. The `notes` table with `contributor_id` is for platform-level contributor content only. We need a new `user_notes` table.

### 5. No `topic_id` on `topic_progress` (indirect FK only)

`topic_progress` already correctly ties to `topics.id` (`topic_id` FK). **This is fine** — progress tracking already ties directly to lessons (topics).

### 6. Flashcards still on mock data

`DeckLibrary.tsx` calls `getDecksByUser()` from `lib/mock/database.ts`. `CreateDeckModal.tsx` calls `createDeck()` from mock. This entire module must be replaced with Supabase queries.

### 7. No shared curriculum/lesson context

Each feature (Lesson Tracker, Notes, Flashcards) independently initializes its own data fetch with no awareness of the active curriculum selection in other tabs. Switching curricula in Lesson Tracker has no effect on what Flashcards or Notes show.

---

## Architectural Decision: Lesson vs. Course Ownership

> **Decision: Lessons (topics) directly own Notes and Flashcard Decks.**

**Reasoning:**
- Notes already have `topic_id` FK on the `notes` table — the schema already encodes lesson-direct ownership.
- Progress tracking (`topic_progress`) already ties directly to topics.
- Lesson-direct ownership means a single JOIN from `topic_id` gives you all related content — no additional traversal through `subject_id`.
- Filtering by lesson gives the tightest scope (lowest false-positive rate when loading related content).

**Trade-off acknowledged:** A deck/note scoped to a *topic* cannot be easily surfaced at the *subject* level without an additional query. Mitigation: `decks` and `user_notes` retain `curriculum_id` and `subject_id` as denormalized FKs (populated automatically from the topic's parent chain) so subject-level queries remain a single `eq('subject_id', ...)` without a JOIN.

---

## Unified Data Model Assessment: Shared `LessonContext`

**Verdict: Viable and recommended.**

### How it works

A single React Context (`LessonContext`) is mounted at the `(app)/layout.tsx` level. It holds:

```typescript
interface LessonContextValue {
  // Enrollment & curriculum selection
  enrolledCurriculums: CurriculumItem[];
  activeCurriculumId: string | null;
  setActiveCurriculumId: (id: string) => void;

  // Derived tree (active curriculum only)
  subjects: SubjectItem[];         // = "Courses"
  topics: TopicItem[];              // = "Lessons" (flat list of active curriculum)
  
  // Progress
  progressRecords: TopicProgressRecord[];
  
  // Mutations (shared)
  updateProgress: (topicId: string, patch: Partial<TopicProgressRecord>) => void;
  
  // Loading
  isLoading: boolean;
}
```

All three features — Lesson Tracker, Notes, Flashcards — **consume this single context** instead of fetching curriculum/enrollment data themselves. They only fetch their own content (notes list, deck list) using `activeCurriculumId` as a reactive filter.

### Impact Analysis

| Concern | Assessment |
|---|---|
| **State reactivity** | When `setActiveCurriculumId` is called (from Course Manager or any tab), all consumers re-render with the new curriculum's data simultaneously. Zero stale-data windows. |
| **Component re-renders** | Use `React.memo` on leaf components (TopicCard, DeckCard, NoteCard). The context should be split: `LessonSelectionContext` (curriculum/subject/topic identity — changes infrequently) and `LessonProgressContext` (progress records — changes on every confidence update). This prevents all NoteCard components from re-rendering when a user marks a topic complete. |
| **API payload efficiency** | On curriculum switch: one parallel fetch for `topics` (scoped to new curriculum) + one fetch each for notes and decks (scoped by `curriculum_id`). Total: ~3 network requests vs. current ~5 (each module fetching its own enrollment + content). |
| **Enrollment table unification** | `useLessons` currently reads `user_curriculums`. After refactor, both `useLessons` and `useCourseManager` read from `user_enrollments` only. `user_curriculums` is deprecated and its data migrated. |

---

## Updated ERD

```
profiles
  └─ user_enrollments (user_id → profiles.id, curriculum_id, subject_id, exam_id)
  └─ topic_progress   (user_id → profiles.id, topic_id → topics.id)
  └─ user_notes       (user_id → profiles.id, topic_id → topics.id, subject_id, curriculum_id) [NEW]
  └─ decks            (owner_id → profiles.id, topic_id → topics.id, subject_id, curriculum_id) [MODIFIED]

curriculums
  └─ subjects         (curriculum_id → curriculums.id)
       └─ topics      (subject_id → subjects.id)
            ├─ topic_progress  (topic_id → topics.id)
            ├─ user_notes      (topic_id → topics.id)  [NEW]
            └─ decks           (topic_id → topics.id)  [MODIFIED: add FK]

notes  (official platform notes — contributor_id → profiles.id, topic_id → topics.id)
  └─ user_saved_notes  (user saves official notes)
```

---

## Required SQL Migrations

### Migration A: Unify Enrollment Tables

```sql
-- Migration: 20260712000001_unify_enrollment_tables.sql

-- 1. Copy any user_curriculums rows that don't already exist in user_enrollments
INSERT INTO public.user_enrollments (user_id, curriculum_id, subject_id, enrolled_at)
SELECT uc.user_id, uc.curriculum_id, uc.subject_id, uc.started_at
FROM public.user_curriculums uc
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_enrollments ue
  WHERE ue.user_id = uc.user_id
    AND ue.curriculum_id = uc.curriculum_id
    AND ue.subject_id = uc.subject_id
)
ON CONFLICT DO NOTHING;

-- 2. Drop old table (after data is verified in production)
-- NOTE: Only run this after verifying migration was successful
-- DROP TABLE IF EXISTS public.user_curriculums;
-- DROP POLICY IF EXISTS user_curriculums_owner_all ON public.user_curriculums;
```

> [!CAUTION]
> The `DROP TABLE` line is commented out intentionally. Run it manually only after you have verified the data migration in production and confirmed Lesson Tracker works off `user_enrollments`.

### Migration B: Add `topic_id` to `decks`

```sql
-- Migration: 20260712000002_add_topic_id_to_decks.sql

ALTER TABLE public.decks
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL;

-- Backfill existing decks: topic_id remains NULL (no data loss)
-- New decks created through the lesson-scoped flow will have topic_id set

-- Update index for efficient lesson-scoped queries
CREATE INDEX IF NOT EXISTS decks_topic_id_idx ON public.decks(topic_id);
CREATE INDEX IF NOT EXISTS decks_subject_id_idx ON public.decks(subject_id);
CREATE INDEX IF NOT EXISTS decks_curriculum_id_idx ON public.decks(curriculum_id);
```

### Migration C: Create `user_notes` Table (Personal Notes)

```sql
-- Migration: 20260712000003_create_user_notes.sql

CREATE TABLE IF NOT EXISTS public.user_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id        UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  subject_id      UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  curriculum_id   UUID REFERENCES public.curriculums(id) ON DELETE SET NULL,
  title           TEXT NOT NULL DEFAULT 'Untitled Note',
  content         TEXT,                        -- plain text / markdown
  blocks          JSONB NOT NULL DEFAULT '[]'::jsonb,  -- rich block editor (same NoteBlock type)
  tags            TEXT[],
  color           TEXT,                        -- optional highlight colour for card UI
  is_pinned       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at_user_notes ON public.user_notes;
CREATE TRIGGER set_updated_at_user_notes
  BEFORE UPDATE ON public.user_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- Users can CRUD only their own notes
DROP POLICY IF EXISTS user_notes_owner_all ON public.user_notes;
CREATE POLICY user_notes_owner_all ON public.user_notes
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS user_notes_user_id_idx        ON public.user_notes(user_id);
CREATE INDEX IF NOT EXISTS user_notes_topic_id_idx       ON public.user_notes(topic_id);
CREATE INDEX IF NOT EXISTS user_notes_curriculum_id_idx  ON public.user_notes(curriculum_id);
```

### Migration D: Update RLS on `decks` for Lesson-Scoped Queries

No policy changes needed — existing `decks_owner_all` policy (`owner_id = auth.uid()`) already covers personal decks. Public decks remain accessible via `decks_public_select`. The `topic_id` column addition doesn't break existing policies.

---

## RLS Policy Specification

### Content Isolation Rules

| Table | Type | RLS Pattern |
|---|---|---|
| `notes` | Official platform content | `contributor_id = auth.uid()` (owner write) OR `visibility = 'public' AND status = 'approved'` (public read) |
| `user_notes` | User-personal content | `user_id = auth.uid()` — strict owner-only, no public read ever |
| `decks` | User-personal content | `owner_id = auth.uid()` OR `is_public = true` |
| `cards` | Deck child content | Parent deck ownership check |
| `topic_progress` | User-personal tracking | `user_id = auth.uid()` — strict owner-only |

### New Policies for `user_notes`

```sql
-- SELECT: user can read only their own notes
CREATE POLICY user_notes_owner_select ON public.user_notes
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- INSERT: user can insert only rows where user_id = their uid
CREATE POLICY user_notes_owner_insert ON public.user_notes
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- UPDATE: user can update only their own notes, and cannot reassign user_id
CREATE POLICY user_notes_owner_update ON public.user_notes
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE: user can delete only their own notes  
CREATE POLICY user_notes_owner_delete ON public.user_notes
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

> [!IMPORTANT]
> `user_notes` must **never** have a public-read policy. These are private to the owning user only. The existing `notes` table (for official platform content) should not be conflated with personal notes.

---

## Frontend State Architecture

### Phase 1: Create `LessonContext`

**File:** `src/context/LessonContext.tsx` [NEW]

```typescript
// Responsibilities:
// 1. Fetch user_enrollments for the authenticated user (replaces both useCourseManager enrollment fetch and useLessons enrollment fetch)
// 2. Maintain activeCurriculumId in URL search params (?curriculum=<id>) for deep-linkability and cross-tab persistence
// 3. Expose enrolledCurriculums, subjects, topics, progressRecords
// 4. Expose setActiveCurriculumId, updateProgress mutations

// URL State strategy:
// Use Next.js useSearchParams + useRouter to read/write ?curriculum=<id>
// This means: selecting a curriculum in Course Manager persists the selection
// when navigating to /lessons, /flashcards, or /my-notes — the context
// re-reads the URL param and the correct curriculum is already active.
```

**Why URL state (not Zustand/Context-only):**
- Survives page refreshes
- Enables deep links (e.g., share `/lessons?curriculum=abc123`)
- No extra dependency (Next.js already has `useSearchParams`)
- Zustand would require a persistence plugin for the same effect

### Phase 2: Mount Context at App Shell

**File:** `src/app/(app)/layout.tsx` [MODIFY]

```tsx
// Wrap children with LessonProvider INSIDE PersonaProvider:
<PersonaProvider>
  <LessonProvider>
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 dash-grid-body">
        {children}
      </main>
    </div>
  </LessonProvider>
</PersonaProvider>
```

### Phase 3: Refactor `useLessons` Hook

**File:** `src/hooks/useLessons.ts` [MODIFY]

- Remove all internal enrollment fetching
- Consume `LessonContext` instead
- Retain `updateConfidence`, `updateStatus` mutations (they can delegate to `LessonContext.updateProgress`)
- Remove `selectedCurriculumId` / `setSelectedCurriculumId` local state — sourced from context

### Phase 4: Refactor `useCourseManager` Hook

**File:** `src/hooks/useCourseManager.ts` [MODIFY]

- Remove duplicate `allCurriculums`, `allSubjects` fetches (already in LessonContext)
- Retain exam/countdown management (these remain course-manager-specific)
- On successful `enroll()`: call `LessonContext.refetch()` to sync the shared tree

### Phase 5: Migrate Flashcards to Supabase

**File:** `src/components/flashcards/DeckLibrary.tsx` [MODIFY]
**File:** `src/components/flashcards/CreateDeckModal.tsx` [MODIFY]

- Replace all `getDecksByUser()` / `createDeck()` / `cloneDeck()` / `deleteDeck()` mock calls with `createClient()` Supabase queries
- `DeckLibrary` reads `activeCurriculumId` from `LessonContext` and filters decks by `curriculum_id`
- `CreateDeckModal` accepts optional pre-filled `topicId` / `subjectId` / `curriculumId` props from context (no longer requires user to manually select curriculum — it inherits the active one)

### Phase 6: Create Personal Notes System

**File:** `src/hooks/useUserNotes.ts` [NEW]

```typescript
// Responsibilities:
// - CRUD operations on user_notes table
// - Filter by activeCurriculumId from LessonContext
// - Optionally filter by topic_id (lesson-scoped view)

export function useUserNotes(topicId?: string) {
  const { activeCurriculumId } = useLessonContext();
  // fetch user_notes where user_id = me AND curriculum_id = activeCurriculumId
  // if topicId provided: further filter by topic_id = topicId
}
```

**File:** `src/app/(app)/my-notes/page.tsx` [MODIFY]
- Add tab: "My Notes" (personal, from `user_notes`) vs. "Library Notes" (official, from `notes` + `user_saved_notes`)

### Phase 7: Curriculum Cascade in Course Manager

**File:** `src/app/(app)/courses/page.tsx` [MODIFY]

- Add a "Set Active Curriculum" action on each enrolled curriculum card
- Clicking it calls `LessonContext.setActiveCurriculumId(id)` which writes `?curriculum=id` to the URL
- Display "Quick Links" after selection: → Lesson Tracker, → My Notes, → Flashcards
- The breadcrumb on these pages shows the active curriculum name

---

## Step-by-Step Execution Checklist

### 🔵 Phase 0 — Database (Do First)

- [ ] Create migration `20260712000001_unify_enrollment_tables.sql` — copy `user_curriculums` → `user_enrollments`
- [ ] Create migration `20260712000002_add_topic_id_to_decks.sql` — add `topic_id` FK + indexes
- [ ] Create migration `20260712000003_create_user_notes.sql` — new table + RLS + indexes
- [ ] Run `supabase db advisors` and fix any flagged issues
- [ ] Verify data API GRANT for `user_notes` table: `GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notes TO authenticated;`
- [ ] Verify `user_curriculums` data is fully present in `user_enrollments`

### 🔵 Phase 1 — Shared LessonContext

- [ ] Create `src/context/LessonContext.tsx`
  - [ ] Fetch `user_enrollments` (replaces both old hooks)
  - [ ] Fetch `curriculums`, `subjects`, `topics` for enrolled curricula
  - [ ] `activeCurriculumId` reads from `useSearchParams('curriculum')`
  - [ ] `setActiveCurriculumId` writes via `router.replace` with `?curriculum=<id>`
  - [ ] Expose `progressRecords` + `updateProgress` mutation
- [ ] Add `LessonProvider` to `src/app/(app)/layout.tsx`

### 🔵 Phase 2 — Fix Lesson Tracker

- [ ] Refactor `src/hooks/useLessons.ts` to consume `LessonContext`
- [ ] Remove standalone enrollment + curriculum fetches from `useLessons`
- [ ] Verify `LessonTracker.tsx` renders correctly from context
- [ ] Update `useLessons` to no longer call `user_curriculums` table at all

### 🔵 Phase 3 — Fix Course Manager

- [ ] Refactor `src/hooks/useCourseManager.ts`
  - [ ] Remove duplicate `curriculums`/`subjects` fetches (use context)
  - [ ] `enroll()` → call `context.refetch()` on success
  - [ ] Add `setActiveCurriculumId` call on enroll success
- [ ] Update `src/app/(app)/courses/page.tsx`
  - [ ] Add "Set Active" button per curriculum
  - [ ] Add Quick Links panel after selection

### 🔵 Phase 4 — Migrate Flashcards

- [ ] Create `src/hooks/useDecks.ts` [NEW] — Supabase CRUD for decks
- [ ] Refactor `DeckLibrary.tsx` — remove mock calls, use `useDecks` + context `activeCurriculumId`
- [ ] Refactor `CreateDeckModal.tsx` — remove mock `createDeck`, accept lesson context props
- [ ] Remove `getDecksByUser`, `createDeck`, `cloneDeck`, `deleteDeck` from `lib/mock/database.ts`

### 🔵 Phase 5 — Personal Notes

- [ ] Create `src/hooks/useUserNotes.ts` — CRUD on `user_notes`
- [ ] Create `src/components/notes/UserNoteCard.tsx` — UI for personal note
- [ ] Create `src/components/notes/UserNoteEditor.tsx` — simple text + blocks editor
- [ ] Update `src/app/(app)/my-notes/page.tsx` — add "My Notes" tab alongside "Library Notes"

### 🔵 Phase 6 — Type System Updates

- [ ] Add `UserNote` interface to `src/types/index.ts`
- [ ] Add `topic_id` to `Deck` type (or confirm it's picked up from Supabase types)
- [ ] Update `NoteFilters` to support filtering by `topic_id`
- [ ] Regenerate `src/types/supabase.ts` after migrations: `supabase gen types typescript --local > src/types/supabase.ts`

### 🔵 Phase 7 — schema.md & Documentation

- [ ] Update `schema.md` to add `user_notes` table
- [ ] Update `schema.md` to document `topic_id` on `decks`
- [ ] Add note that `user_curriculums` is deprecated

---

## Open Questions

> [!IMPORTANT]
> **Q1: What should happen to `user_curriculums` data?**
> The audit found that `useLessons` hook reads `user_curriculums` while `useCourseManager` writes `user_enrollments`. These are two separate tables with overlapping purpose. The migration plan copies `user_curriculums` data into `user_enrollments` before deprecation. **Confirm there is no data in `user_curriculums` that is not duplicated by `user_enrollments`** before dropping the old table.

> [!IMPORTANT]
> **Q2: Should "My Notes" (personal) and "Library Notes" (official platform notes) live on the same `/my-notes` route or separate routes?**
> Current `/my-notes` page is a shell with a loading skeleton and no real content. Proposed: single page with tab switcher. Alternative: `/my-notes` for personal, `/library` for official. Please confirm preference.

> [!IMPORTANT]
> **Q3: Flashcard decks — should user-created decks require a topic/lesson, or remain optional?**
> The plan makes `topic_id` on `decks` optional (nullable FK), so users can create general decks without a lesson scope. If you want to enforce lesson-scoped decks when created from the Lesson Tracker context, we can pass `topic_id` as a required prop to `CreateDeckModal` in that flow.

> [!NOTE]
> **Q4: The existing `notes` table uses `contributor_id` as the author column.** A student with role `student` cannot currently write to `notes` (the `notes_owner_all` RLS policy applies, but students cannot submit for review). The new `user_notes` table solves this for personal notes. Do you also want students to be able to submit official notes through the contributor flow, or is that strictly for contributors?

---

## Verification Plan

### Automated Tests
- After Phase 0: Run `supabase db advisors` — zero errors expected
- After Phase 1: Manually test `LessonContext` by navigating `/lessons?curriculum=<id>` — verify correct curriculum loads
- After Phase 4: Test deck CRUD end-to-end in Supabase dashboard

### Manual Verification
1. Enroll in a curriculum in Course Manager → navigate to `/lessons` → verify same curriculum is active
2. Switch curriculum tab in Lesson Tracker → navigate to `/flashcards` → verify deck list filters to new curriculum
3. Create a personal note from a topic → verify it does NOT appear in the public Notes Library
4. Create a personal flashcard deck from the Lesson Tracker (lesson context) → verify `topic_id` is set on the deck row in Supabase
5. Unenroll from a curriculum → verify Lesson Tracker, Notes, and Flashcards all update simultaneously
6. Verify `user_notes` RLS: attempt to read another user's note via the Supabase client — expect empty result (not 403, but empty set per RLS behaviour)
