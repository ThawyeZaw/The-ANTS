# Multi-Agent & UI Developer Guidelines — The ANTS

## 1. Project Overview & Scope
- **Application**: The ANTS — Curriculum-aware academic productivity platform for Myanmar students.
- **Current Objective**: **Frontend & UI/UX Design Iterations Only**. The backend database, server actions, and Cloudflare Worker API are stabilized and locked.
- **Tech Stack (HONC Monorepo)**:
  - **Frontend UI (`apps/web`)**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4.
  - **API Backend (`apps/api`)**: Hono on Cloudflare Workers *(LOCKED — Do not modify)*.
  - **Database & ORM (`packages/db`)**: Neon Serverless Postgres with Drizzle ORM *(LOCKED — Do not modify)*.
  - **Shared Types (`packages/shared-types`)**: Shared interfaces and Zod schemas *(LOCKED — Do not modify)*.

---

## 2. Developer Commands
- `npm run dev` — Run all monorepo workspace packages via Turborepo.
- `npm run dev:web` — Run Next.js web application on port `3005`.
- `npm run dev:api` — Run Hono backend worker on port `8787`.
- `npm run typecheck` — Verify TypeScript compiler with zero errors.
- `npm run build` — Full monorepo production build.

---

## 3. Strict Rules & Backend Protection (CRITICAL)
1. **DO NOT modify Backend or Database Code**:
   - Do NOT edit schema files in `packages/db/src/schema/`.
   - Do NOT add migrations or alter tables.
   - Do NOT modify Cloudflare Worker routes in `apps/api/src/routes/`.
   - Do NOT modify server actions in `apps/web/src/actions/` unless specifically fixing a contract typo.
2. **No Clubs or Classrooms**:
   - Clubs and Classrooms have been completely retired from The ANTS. Do not re-import, reference, or create pages for them.
3. **Role Management Rules**:
   - Standard signups are assigned only as `student`.
   - Only `admin` accounts can upgrade or modify user roles (via the Admin Dashboard).
   - Self-service role upgrade requests in settings have been removed.

---

## 4. UI Architecture & Context Usage

### Role & Persona Checks
Always use `useRole()` or `useAuth()` to query the user's role status:
```tsx
'use client';
import { useRole } from '@/hooks/useRole';

export default function MyComponent() {
  const { role, isStudent, isTutor, isContributor, isAdmin, hasRole } = useRole();
  // ...
}
```

### Global Shell & Route Structure
- **Public Routes (`apps/web/src/app/(public)/`)**:
  - `/explore` — Explore notes, tutors, and subjects.
  - `/about` — Platform philosophy and team.
  - `/profile/[username]` — Unified public profile (Student portfolio, Tutor schedule, or Contributor showcase).
- **Protected App Routes (`apps/web/src/app/(app)/`)**:
  - `/student` or `/dashboard` — Main student dashboard.
  - `/library` & `/courses` & `/notes` — Curriculum and study notes library.
  - `/timetable` — Integrated calendar (events & exam countdowns).
  - `/pomodoro` & `/calculator` & `/flashcards` — Study productivity tools.
  - `/settings` & `/settings/profile` — Account, Telegram notifications, and profile editor.
  - `/editor` & `/main-contributor` — Contributor & Admin portals.

---

## 5. UI/UX Style & Design Tokens
- **Client Directives**: Every interactive React component MUST start with `'use client'` as line 1.
- **Design Tokens**: Exclusively use semantic Tailwind CSS variables (`bg-background`, `bg-background-card`, `text-foreground`, `text-foreground-muted`, `border-border`, `text-primary`, `bg-primary`, `focus-ring`).
- **Icons**: Exclusively use `lucide-react`.
- **Responsive Layout**: Ensure all toolbar buttons, grids, and header items include `flex-wrap` and mobile drawer navigation breakpoints.
- **Zero TypeScript Errors**: Every change must pass `npx tsc --noEmit` cleanly without new diagnostics.

---

