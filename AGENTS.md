You are generating an AGENTS.md file for a frontend developer (TYZ) working on **The ANTs** — a curriculum-aware academic productivity platform for Myanmar students. Copy the structure below and fill in the **Developer-owned** section.

[Project Overview, Executable Commands, and Code Style sections are IDENTICAL to Prompt 1 above — copy them verbatim]

### PM-Locked (NEVER touch)
- Root files: `proxy.ts`, `spec.md`, `schema.md`, `README.md`, `AGENTS.md`, `package.json`, `package-lock.json`, `.env.local`
- Directories: `The-ANTS-1/`, `design-system/`, `supabase/`, `public/icons/`
- `src/app/` — all page/route files
- `src/components/ui/`, `src/components/auth/`, `src/components/contributor-manager/`, `src/components/homepage/`, `src/components/review-queue/`, `src/components/workspace/`, `src/components/onboarding/`
- `src/components/courses/`, `src/components/notes/`, `src/components/flashcards/`, `src/components/countdown/`, `src/components/exam-data/`, `src/components/exam-editor/`, `src/components/library/`, `src/components/share/`
- `src/components/timetable/`, `src/components/pomodoro/`, `src/components/Lessons/`, `src/components/editor/`, `src/components/curriculum/`
- `src/context/*`, `src/lib/*`, `src/types/*`
- `src/hooks/` — all hooks except those listed under "Developer-owned" below
- `src/constants/` — all files
- `src/actions/` — all files except those listed under "Developer-owned" below

### Developer-owned (TYZ) — you MAY create, edit, and delete these
**Components:**
- `src/components/clubs/` — everything inside
- `src/components/classrooms/` — everything inside
- `src/components/profile/` — everything inside
- `src/components/layout/` — everything inside (NavBar, DashboardLayout, Footer)
- `src/components/settings/` — everything inside
- `src/components/explore/` — everything inside
- `src/components/about/` — everything inside

**Hooks:**
- `src/hooks/useClub.ts`
- `src/hooks/useRealtimeChat.ts`
- `src/hooks/useClassroom.ts`
- `src/hooks/useRealtimeClassroom.ts`
- `src/hooks/useProfile.ts`

**Actions:**
- `src/actions/clubs.ts`
- `src/actions/classrooms.ts`

### Owned by OTHER developers — do NOT touch
- **ZLH:** `src/components/courses/`, `src/components/notes/`, `src/components/flashcards/`, `src/components/countdown/`, `src/components/exam-data/`, `src/components/exam-editor/`, `src/components/library/`, `src/components/share/`, plus their hooks and actions
- **ABC:** `src/components/timetable/`, `src/components/pomodoro/`, `src/components/Lessons/`, `src/components/editor/`, `src/components/curriculum/`, `src/components/homepage/`, `src/components/auth/`, `src/components/onboarding/`, `src/components/workspace/`, `src/components/contributor-manager/`, `src/components/review-queue/`, plus their hooks and actions

[Hard Constraints and When Unsure sections are IDENTICAL to Prompt 1 — copy them verbatim]