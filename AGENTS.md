# Agent Role & Context

You are a frontend engineer working on **The ANTs** — a curriculum-aware academic productivity platform for Myanmar students targeting international qualifications (CAIE IGCSE/A Level, Edexcel IGCSE/IAL, IELTS). The app uses a four-role permission system (`student` → `teacher` → `contributor` → `main_contributor`, upgrade-only, no skipping or downgrading). Always gate role-dependent logic via `useRole()` from `src/hooks/useRole.ts`.

**Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Supabase (Postgres/Auth/Storage)
**Phase:** MVP — mock data facade (`src/lib/mock/database.ts`). Never call `supabase.from()` directly in component code; data access goes through the facade or through existing hooks.

## Executable Commands

- Install: `npm install`
- Dev server: `npm run dev` (Turbopack, binds 0.0.0.0)
- Build: `npm run build`
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`

`package.json` has no `test` script. No test framework is configured.

## Project Boundaries

**PM-Locked (`TYZ`) — never create, edit, or delete:**
- Root: `proxy.ts`, `spec.md`, `schema.md`, `README.md`, `AGENTS.md`, `package.json`, `package-lock.json`, `.env.local`
- Directories: `The-ANTS-1/`, `design-system/`, `supabase/`, `public/icons/`
- `src/app/` — layout shells and route files (except your feature's page shell)
- `src/components/`: `ui/`, `layout/`, `auth/`, `settings/`, `profile/`, `contributor-manager/`, `homepage/`, `about/`, `review-queue/`, `share/`
- `src/components/workspace/`, `src/components/onboarding/` — PM ownership inferred (not explicitly 🔒 in spec §7; confirm before acting)
- `src/hooks/` — all hooks except those listed under developer-owned below
- `src/context/*`, `src/lib/*`, `src/types/*`
- `src/constants/` — except `timetable.ts` and `pomodoro.ts` (PPP-owned)
- `src/actions/roles.ts`
- Role elevation helpers live in `src/lib/supabase/server.ts` — do not touch, but know that server-side privilege logic belongs there.

**Developer-owned — respect other developers' locks:**
- **PPP:** `src/components/timetable/`, `src/hooks/usePomodoro.ts`, `src/hooks/useTimetable.ts`, `src/actions/timetable.ts`, `src/constants/timetable.ts`, `src/constants/pomodoro.ts`
- **BMK & ABC:** `src/components/Lessons/`, `src/components/courses/`, `src/components/classrooms/`, `src/components/editor/`, `src/hooks/useClassroom.ts`, `src/hooks/useLessons.ts`, `src/hooks/useCourseManager.ts`, `src/hooks/useRealtimeClassroom.ts`, `src/actions/classrooms.ts`, `src/actions/editor.ts`
- **ZLH:** `src/components/flashcards/`, `src/components/countdown/`, `src/components/exam-editor/`, `src/components/exam-data/`, `src/hooks/useFlashcardSRS.ts`, `src/hooks/useCountdown.ts`, `src/hooks/useExamReview.ts`, `src/actions/flashcards.ts`, `src/actions/exam-editor.ts`
- **AKT:** `src/components/clubs/`, `src/hooks/useClub.ts`, `src/hooks/useRealtimeChat.ts`, `src/actions/clubs.ts`
- **Shared (no single owner):** `src/components/notes/`, `src/components/library/`, `src/hooks/useNotes.ts`, `src/actions/notes.ts`

**System-wide hard constraints:**
- **Database Gatekeeper:** never alter tables, triggers, or RLS policies without explicit approval.
- **Unified Data Facade:** all mock data queries go through `src/lib/mock/database.ts`; never hardcode local mock arrays in components.
- **No `supabase.from()` in components:** use the facade or existing hooks. When migrating mock → live, change the facade implementation, not the consumer interface.
- **Server Actions in `src/actions/` only:** never define `'use server'` inside a component file.
- **Branching:** work on dedicated task branches; never push directly to `main` or `dev`.
- **Secrets:** never read or expose `.env.local` or Supabase service-role credentials.
- **New packages:** ask before adding any dependency not already in `package.json`.
- **Migrations:** never edit an applied migration; create a new one. Never auto-apply production migrations.

## Code Style & Conventions

- `'use client'` as the first line of any interactive component file.
- Default export per component; named props interface with JSDoc.
- Styling via `cn()` from `src/lib/utils.ts` + Tailwind classes; use `var(--token)` or registered Tailwind classes only. No hardcoded hex colors, no `p-[13px]` magic numbers.
- Icons: `lucide-react` exclusively (see `design-system/04-icons.md` for sizing).
- Every interactive element needs `.focus-ring` + full keyboard support (Enter/Space activate, Escape dismiss). See `design-system/10-accessibility.md`.
- Animations: `transform`/`opacity` only (GPU-composited), respect `prefers-reduced-motion`, ≤800ms for user-triggered interactions. See `design-system/05-animation-motion.md`.
- No lorem ipsum or placeholder images in shipped code. See `design-system/09-content-guidelines.md`.
- Homepage (`.hp`-scoped) components use inline styles + `--hp-*` tokens; app components use Tailwind + app tokens. Never mix token namespaces. See `design-system/08-theming.md`.
- New CSS custom properties must define both light and `[data-theme="dark"]` values.
- Stateful logic lives in `src/hooks/`; page files are lightweight shells. Constants go in `src/constants/`.

## Testing Requirements

No automated test suite is configured in this repository. Before adding tests, confirm the intended framework with the project owner — do not introduce a new test runner unilaterally. Minimum verification for any change: `npx tsc --noEmit` must pass with zero new errors.

## Role & Permission Quick Reference

| Role | Access |
|------|--------|
| **student** | Timetable, Pomodoro, Flashcards, Lesson Tracker, Course Manager, Exam Countdown, Grade Calculator, Classrooms (join), Clubs (join), public profile |
| **teacher** | Everything student + create/manage Classrooms, issue Assignments/Quizzes, monitor student progress in own classrooms |
| **contributor** | Everything teacher + Curriculum & Notes Editor, Exam Data Editor, create/lead Clubs, public Contributor Profile |
| **main_contributor** | Everything contributor + Gatekeeper Review Queue, approve/reject role upgrade requests, direct user promotion |

Signup always defaults to `student`. Upgrades require `main_contributor` approval.

## When Unsure

- If a task requires touching a 🔒-locked file, stop and ask rather than proceeding.
- If a task implies a schema/RLS change, stop and ask.
- If existing code contradicts this file, flag the discrepancy rather than silently picking one.
- Prefer the smallest change that satisfies the request; do not refactor unrelated code in the same pass.
