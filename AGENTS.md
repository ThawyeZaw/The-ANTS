# Multi-Agent & Developer Guidelines — The ANTS

## 1. Project Overview & Architecture
- **Application**: The ANTS — Curriculum-aware academic productivity platform for Myanmar students.
- **Architecture Stack (HONC Monorepo)**:
  - **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4 (`apps/web`)
  - **API Backend**: Hono deployed to Cloudflare Workers (`apps/api`)
  - **Database & ORM**: Neon Serverless Postgres with Drizzle ORM (`packages/db`)
  - **Shared Types & Contracts**: Shared TypeScript interfaces & Zod validation schemas (`packages/shared-types`)
  - **Auth & Permissions**: Better Auth with 4-tier upgrade-only role system:
    `student` → `teacher` → `contributor` → `main_contributor`

---

## 2. Executable Commands
- **Root Monorepo**:
  - `npm run dev` — Run all workspace dev servers via Turborepo
  - `npm run build` — Build all workspace packages
  - `npm run lint` — Run ESLint across packages
  - `npm run typecheck` — Run TypeScript type checking
- **Workspace-specific**:
  - `npm run dev:web` — Run Next.js web application (`apps/web` on port 3005)
  - `npm run dev:api` — Run Hono backend worker (`apps/api` via Wrangler)
  - `npm run build:web` — Production build for web

---

## 3. Developer & Agent Ownership Boundaries

### TYZ Domain
- **Components**:
  - `apps/web/src/components/clubs/`
  - `apps/web/src/components/classrooms/`
  - `apps/web/src/components/profile/`
  - `apps/web/src/components/layout/` (NavBar, DashboardLayout, Footer)
  - `apps/web/src/components/settings/`
  - `apps/web/src/components/explore/`
  - `apps/web/src/components/about/`
- **Hooks & Actions**:
  - `useClub.ts`, `useRealtimeChat.ts`, `useClassroom.ts`, `useRealtimeClassroom.ts`, `useProfile.ts`
  - `src/actions/clubs.ts`, `src/actions/classrooms.ts`

### ZLH Domain
- **Components**:
  - `apps/web/src/components/courses/`
  - `apps/web/src/components/notes/`
  - `apps/web/src/components/flashcards/`
  - `apps/web/src/components/countdown/`
  - `apps/web/src/components/exam-data/`
  - `apps/web/src/components/exam-editor/`
  - `apps/web/src/components/library/`
  - `apps/web/src/components/share/`
- **Hooks & Actions**:
  - `useCourseManager.ts`, `useNotes.ts`, `useUserNotes.ts`, `useFlashcardSRS.ts`, `useCountdown.ts`, `useExamReview.ts`
  - `src/actions/notes.ts`, `src/actions/exam-editor.ts`

### ABC Domain
- **Components**:
  - `apps/web/src/components/timetable/`
  - `apps/web/src/components/pomodoro/`
  - `apps/web/src/components/Lessons/`
  - `apps/web/src/components/editor/`
  - `apps/web/src/components/curriculum/`
  - `apps/web/src/components/homepage/`
  - `apps/web/src/components/auth/`
  - `apps/web/src/components/onboarding/`
  - `apps/web/src/components/workspace/`
  - `apps/web/src/components/contributor-manager/`
  - `apps/web/src/components/review-queue/`
- **Hooks & Actions**:
  - `useTimetable.ts`, `useIntegratedTimetable.ts`, `usePomodoro.ts`, `useCurriculum.ts`, `useRole.ts`
  - `src/actions/timetable.ts`, `src/actions/role-upgrade.ts`, `src/actions/editor.ts`

---

## 4. Code Style & Engineering Guidelines
- **Client Components**: Always include `'use client'` as the very first line of any interactive component.
- **Component Design**: Default export per component, named props interface with JSDoc descriptions.
- **Styling**: Use `cn()` helper with semantic Tailwind CSS v4 classes. Avoid hardcoded hex colors or magic spacing numbers.
- **Iconography**: Exclusively use `lucide-react`.
- **Accessibility & Focus**: Every interactive control must have visible `.focus-ring` and complete keyboard navigation support.
- **Animations**: Prefer `transform` and `opacity` transitions, respect `prefers-reduced-motion`, duration $\le$ 800ms.
- **Assets**: Use real assets or vector SVGs; do not use generic lorem ipsum or placeholder images.

---

## 5. Hard Constraints
- Never commit secret credentials, service role keys, or `.env.local` to git.
- Database schema changes must go through `packages/db` migrations and schema definitions.
- All API communication from `apps/web` must use typed RPC / client calls to `apps/api`.
- Verification requirement: `npx tsc --noEmit` must pass with zero new errors.
