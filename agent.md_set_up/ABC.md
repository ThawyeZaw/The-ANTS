You are generating an AGENTS.md file for a frontend developer (ABC) working on **The ANTs** — a curriculum-aware academic productivity platform for Myanmar students. Copy the structure below and fill in the **Developer-owned** section.

[Project Overview, Executable Commands, and Code Style sections are IDENTICAL to Prompt 1 — copy them verbatim]

### PM-Locked (NEVER touch)
- Root files: `proxy.ts`, `spec.md`, `schema.md`, `README.md`, `AGENTS.md`, `package.json`, `package-lock.json`, `.env.local`
- Directories: `The-ANTS-1/`, `design-system/`, `supabase/`, `public/icons/`
- `src/app/` — all page/route files
- `src/components/ui/`
- `src/components/courses/`, `src/components/notes/`, `src/components/flashcards/`, `src/components/countdown/`, `src/components/exam-data/`, `src/components/exam-editor/`, `src/components/library/`, `src/components/share/`
- `src/components/clubs/`, `src/components/classrooms/`, `src/components/profile/`, `src/components/layout/`, `src/components/settings/`, `src/components/explore/`, `src/components/about/`
- `src/context/*`, `src/lib/*`, `src/types/*`
- `src/hooks/` — all hooks except those listed under "Developer-owned" below
- `src/constants/` — all files except `timetable.ts` and `pomodoro.ts`
- `src/actions/` — all files except those listed under "Developer-owned" below

### Developer-owned (ABC) — you MAY create, edit, and delete these
**Components:**
- `src/components/timetable/` — everything inside
- `src/components/pomodoro/` — everything inside
- `src/components/Lessons/` — everything inside
- `src/components/editor/` — everything inside
- `src/components/curriculum/` — everything inside
- `src/components/homepage/` — everything inside
- `src/components/auth/` — everything inside
- `src/components/onboarding/` — everything inside
- `src/components/workspace/` — everything inside
- `src/components/contributor-manager/` — everything inside
- `src/components/review-queue/` — everything inside

**Hooks:**
- `src/hooks/useTimetable.ts`
- `src/hooks/usePomodoro.ts`
- `src/hooks/useCurriculumDashboard.ts`
- `src/hooks/useRealtimePresence.ts`

**Actions:**
- `src/actions/timetable.ts`

**Constants:**
- `src/constants/timetable.ts`
- `src/constants/pomodoro.ts`

### Owned by OTHER developers — do NOT touch
- **ZLH:** `src/components/courses/`, `src/components/notes/`, `src/components/flashcards/`, `src/components/countdown/`, `src/components/exam-data/`, `src/components/exam-editor/`, `src/components/library/`, `src/components/share/`, plus their hooks and actions
- **TYZ:** `src/components/clubs/`, `src/components/classrooms/`, `src/components/profile/`, `src/components/layout/`, `src/components/settings/`, `src/components/explore/`, `src/components/about/`, plus their hooks and actions

[Hard Constraints and When Unsure sections are IDENTICAL to Prompt 1 — copy them verbatim]