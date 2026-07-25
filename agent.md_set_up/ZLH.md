You are generating an AGENTS.md file for a frontend developer (ZLH) working on **The ANTs** — a curriculum-aware academic productivity platform for Myanmar students. Copy the structure below and fill in the **Developer-owned** section.

### Project Overview
- **Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Supabase
- **Phase:** MVP — mock data facade (`src/lib/mock/database.ts`). Never call `supabase.from()` in component code; data access goes through the facade or existing hooks.
- **Four-role permission system:** `student` → `teacher` → `contributor` → `main_contributor` (upgrade-only). Gate role logic via `useRole()` from `src/hooks/useRole.ts`.

### Executable Commands
- Dev: `npm run dev` | Build: `npm run build` | Lint: `npm run lint` | Typecheck: `npx tsc --noEmit`
- No test script in `package.json`.

### PM-Locked (NEVER touch)
- Root files: `proxy.ts`, `spec.md`, `schema.md`, `README.md`, `AGENTS.md`, `package.json`, `package-lock.json`, `.env.local`
- Directories: `The-ANTS-1/`, `design-system/`, `supabase/`, `public/icons/`
- `src/app/` — all page/route files
- `src/components/ui/`, `src/components/layout/`, `src/components/auth/`, `src/components/settings/`, `src/components/profile/`, `src/components/contributor-manager/`, `src/components/homepage/`, `src/components/about/`, `src/components/review-queue/`, `src/components/workspace/`, `src/components/onboarding/`, `src/components/explore/`
- `src/components/clubs/`, `src/components/classrooms/`, `src/components/timetable/`, `src/components/pomodoro/`, `src/components/Lessons/`, `src/components/editor/`, `src/components/curriculum/`
- `src/context/*`, `src/lib/*`, `src/types/*`
- `src/hooks/` — all hooks except those listed under "Developer-owned" below
- `src/constants/` — all files
- `src/actions/` — all files except those listed under "Developer-owned" below

### Developer-owned (ZLH) — you MAY create, edit, and delete these
**Components:**
- `src/components/courses/` — everything inside
- `src/components/notes/` — everything inside
- `src/components/flashcards/` — everything inside
- `src/components/countdown/` — everything inside
- `src/components/exam-data/` — everything inside
- `src/components/exam-editor/` — everything inside
- `src/components/library/` — everything inside
- `src/components/share/` — everything inside

**Hooks:**
- `src/hooks/useCourseManager.ts`
- `src/hooks/useNotes.ts`
- `src/hooks/useUserNotes.ts`
- `src/hooks/useFlashcardSRS.ts`
- `src/hooks/useCountdown.ts`
- `src/hooks/useExamReview.ts`

**Actions:**
- `src/actions/notes.ts`
- `src/actions/exam-editor.ts`

### Owned by OTHER developers — do NOT touch
- **TYZ:** `src/components/clubs/`, `src/components/classrooms/`, `src/components/profile/`, `src/components/layout/`, `src/components/settings/`, `src/components/explore/`, `src/components/about/`, plus their hooks and actions
- **ABC:** `src/components/timetable/`, `src/components/pomodoro/`, `src/components/Lessons/`, `src/components/editor/`, `src/components/curriculum/`, `src/components/homepage/`, `src/components/auth/`, `src/components/onboarding/`, `src/components/workspace/`, `src/components/contributor-manager/`, `src/components/review-queue/`, plus their hooks and actions

### Code Style
- `'use client'` first line of any interactive component.
- Default export per component; named props interface with JSDoc.
- Styling via `cn()` from `src/lib/utils.ts` + Tailwind classes. No hardcoded hex colors, no `p-[13px]` magic numbers.
- Icons: `lucide-react` exclusively.
- Every interactive element needs `.focus-ring` + full keyboard support.
- Animations: `transform`/`opacity` only, respect `prefers-reduced-motion`, ≤800ms.
- No lorem ipsum or placeholder images.
- Stateful logic in `src/hooks/`; constants in `src/constants/`.

### Hard Constraints
- Never alter DB tables, triggers, or RLS policies without approval.
- No `supabase.from()` in components — use facade or hooks.
- Server Actions in `src/actions/` only.
- Work on dedicated task branches; never push to `main` or `dev`.
- Never read or expose `.env.local`.
- Ask before adding any new npm dependency.
- Minimum verification: `npx tsc --noEmit` must pass with zero new errors.

### When Unsure
- If a task requires touching a locked file, stop and ask.
- If a task implies a schema/RLS change, stop and ask.
- Prefer the smallest change that satisfies the request.