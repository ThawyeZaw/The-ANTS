# AGENTS.md — Developer Ownership Map for The ANTs

## Project Overview

**The ANTs** is a curriculum-aware academic productivity platform for Myanmar students pursuing international qualifications (CAIE IGCSE/A-Level, Pearson Edexcel IAL, IELTS, OSSD, SAT, Duolingo). The platform integrates timetables, flashcards, classrooms, clubs, quizzes, grade calculators, exam countdowns, public profiles, notes, pomodoro timers, and resource sharing into a single ecosystem.

- **Framework:** Next.js 16 (App Router) with Turbopack
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Hosting:** Vercel
- **Status:** Beta

## Executable Commands

```bash
# Install dependencies
npm install

# Start development server (Turbopack)
npm run dev

# Production build
npm run build

# Start production server (after build)
npm run start

# Lint check
npm run lint
```

## Code Style

- **Client Components:** Any interactive UI (timers, forms, stateful components) must start with `'use client';`.
- **Server Components:** Default to server components unless client interactivity is required.
- **Role Guards:** Use `useRole()` from `src/hooks/useRole.ts` for all role-gated logic. Never hard-code role strings.
- **Data Access:** All Supabase queries go through `src/lib/supabase/` helpers. Never use `SUPABASE_SERVICE_ROLE_KEY` in client code.
- **Imports:** Use `@/` path alias for `src/` imports. Keep imports organised: React/Next → third-party → local.
- **Types:** Use shared types from `src/types/index.ts` and `src/types/supabase.ts`. Do not define ad-hoc types for database entities.
- **Tailwind:** Use design tokens from `globals.css`. No arbitrary pixel values (e.g., `p-[13px]`). Use the design system's spacing scale.
- **Animations:** Respect `prefers-reduced-motion`. Use the project's `cubic-bezier(0, 0, 0.2, 1)` curve for scroll reveals.

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

## Hard Constraints

1. **Never edit PM-Locked files.** If a change requires touching a locked file, ask the PM first.
2. **Never edit other developers' components.** Respect the ownership map above.
3. **Never push directly to `main` or `dev`.** Work on dedicated feature branches.
4. **Pull before starting each day.** Run `git pull origin dev` every morning.
5. **No database schema changes.** The PM is the sole database administrator. Do not alter tables, triggers, or RLS rules.
6. **Build must pass.** Run `npm run build` before pushing. No type errors, no lint errors.
7. **No hard-coded role strings.** Always use `useRole()` for role checks.
8. **No `SUPABASE_SERVICE_ROLE_KEY` in client code.** Admin operations go through server actions only.

## When Unsure

- **Feature requires a locked file?** Message the PM with what you need changed and why.
- **Need a new database table/column?** File a request with the PM — include the use case, proposed schema, and affected features.
- **Blocked by another developer's code?** Coordinate in the team channel. Do not modify their code directly.
- **Unclear about a design decision?** Reference `spec.md` and `design-system/` docs first, then ask the PM.
- **Build or type error you can't fix?** Share the full error output and the file in question with the PM.
