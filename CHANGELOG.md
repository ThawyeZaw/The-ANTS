# CHANGELOG — Legacy Resource System Teardown

Date: 2026-09-02  
Scope: Remove the in-app notes / flashcards / quizzes / classroom resource system in favour of an external Notion content pipeline. Neon (Drizzle) schema updated; Supabase not touched.

Decisions applied:
1. Lesson Tracker — strip note/deck UI (`strip`)
2. Drop curriculum `resources` table (`drop`)
3. Tear down standalone quizzes (`tear_down`)
4. Keep `/library` with courses / exams / tools (`keep_remaining`)
5. Remove note/deck contributor UI + review previews (`remove_contrib_ui`)
6. Drop legacy classroom tables on Neon (`drop`)
7. Keep dashboard pages; surgically remove note/deck/quiz sections (`keep`)

---

## Routes removed

| Route | Former purpose |
|---|---|
| `/my-notes` | Personal + saved notes library |
| `/my-notes/[noteId]` | Note reader |
| `/my-notes/editor` | Personal note editor |
| `/editor/notes` | Contributor notes editor |
| `/library/[noteId]` | Note deep-link / redirect |
| `/library/flashcards` | Flashcards library redirect |
| `/library/quizzes` | Quizzes library redirect |
| `/flashcards` | Deck library |
| `/flashcards/[deckId]` | Study session / deck editor |
| `/quizzes` | Standalone quiz hub |
| `/quizzes/[id]` | Quiz detail |
| `/quizzes/[id]/take` | Take quiz |
| `/quizzes/[id]/host` | Host live session |
| `/quizzes/join` | Join live session |
| `/quizzes/play/[sessionId]` | Play live session |
| `/share/note/[token]` | Shared note view |
| `/share/deck/[token]` | Shared deck view |
| `/resources` | Redirect stub → library exams |

Kept: `/library` (courses/exams/tools), `/share/countdown/[token]`, `/editor` (curriculum/exam/review-queue), `/contribute/countdown`, `/contribute/grade-calculator` (redirect stubs).

---

## API handlers removed

| Path | File |
|---|---|
| `/api/notes/*` | `apps/api/src/routes/notes.ts` |
| `/api/flashcards/*` | `apps/api/src/routes/flashcards.ts` |

Mounts removed from `apps/api/src/index.ts`.

---

## Frontend directories / files deleted

### Components
- `apps/web/src/components/notes/` (entire directory)
- `apps/web/src/components/flashcards/` (entire directory)
- `apps/web/src/components/quizzes/` (entire directory)
- `apps/web/src/components/library/FlashcardsLibraryBrowser.tsx`
- `apps/web/src/components/ui/RelatedContent.tsx`
- `apps/web/src/components/share/SharedNoteView.tsx`
- `apps/web/src/components/share/SharedDeckView.tsx`

### Hooks
- `apps/web/src/hooks/useNotes.ts`
- `apps/web/src/hooks/useUserNotes.ts`
- `apps/web/src/hooks/useFlashcardSRS.ts`
- `apps/web/src/hooks/useQuizSession.ts`
- `apps/web/src/hooks/useQuizSessionHost.ts`

### Actions / lib / types
- `apps/web/src/actions/notes.ts`
- `apps/web/src/actions/quizzes.ts`
- `apps/web/src/types/quiz.ts`
- `apps/web/src/lib/quiz-ai.ts`
- `apps/web/src/lib/srs/` (entire directory)

---

## Tables dropped (Neon migration `0003_drop_legacy_resources`)

### Active Drizzle tables
- `notes`
- `user_notes`
- `user_saved_notes`
- `decks`
- `cards`
- `card_reviews`
- `resources`
- `standalone_quizzes`
- `quiz_live_sessions`
- `quiz_live_participants`

### Column dropped
- `topics.resources_count`

### Soft-linked rows cleaned
- `review_queue` rows with `submission_type` in `note`, `deck`, `flashcard_deck`, `question`
- `editor_submissions` rows with `entity_type` in `note`, `deck`, `flashcard_deck`
- `version_history` / `activity_feed` rows for note/deck/quiz entity types

### Legacy classroom-era tables (from migration 0000; not in current Drizzle TS)
- `assignment_submissions`
- `assignments`
- `discussion_replies`
- `discussion_topics`
- `quiz_attempts`
- `quizzes`
- `classroom_resources`
- `classroom_curriculums`
- `classroom_members`
- `classrooms`

**Not dropped:** Clubs tables, Timetable, Pomodoro, Exam Countdown, Grade Calculator, Curriculum/Subjects/Topics, Auth, Profiles, Org content.

---

## Schema / package edits

- `packages/db/src/schema/study_tools.ts` — removed notes/decks/cards/card_reviews
- `packages/db/src/schema/curriculums.ts` — removed `resources` table + `resources_count`
- `packages/db/src/schema/community.ts` — removed standalone quiz tables; kept org_* tables
- `packages/db/src/schema/relations.ts` — removed related relations
- `packages/db/src/schema/zod.ts` — removed NoteBlock + Quiz JSON schemas
- `packages/db/src/schema/system.ts` — review submission_type comment updated
- `packages/db/drizzle/0003_drop_legacy_resources.sql` — new migration
- `packages/db/drizzle/meta/_journal.json` — journal entry `0003`
- `packages/shared-types/src/index.ts` — removed Note/Flashcard DTOs
- `schema.md` — documented removals

---

## Consumer UI surgically edited (pages kept)

- Library, NavBar, RelatedPagesSidebar — notes/flashcards/quizzes links removed
- Lesson Tracker `TopicCard` / `useLessons` — note/deck linking stripped
- ReviewQueue — note/deck preview UI removed
- Contributor profile / MyContributions / useContributions — notes/decks removed
- MyWorkspace, CourseSyncPanel, CurriculumDashboard, student/workspace pages
- useCourseSync, useCurriculumDashboard, useDashboardSync
- Editor hub — Notes Editor card removed
- Telegram notification prefs — assignments/quizzes toggles removed
- CountdownManager `/resources` → `/library?tab=exams`

---

## Apply migration

```bash
cd packages/db
npm run db:migrate
```

Or apply `packages/db/drizzle/0003_drop_legacy_resources.sql` against the Neon database.
