# The ANTs — System Specification & Integration Manifest (`spec.md`)

## 1. Project architecture & tech stack (HONC monorepo)

- **Frontend:** Next.js 16 (App Router), React 19, Turbopack (`apps/web`)
- **Styling:** Tailwind CSS v4, semantic design tokens, Lucide React icons
- **Typography (redesign):** Plus Jakarta Sans (UI); JetBrains Mono (timers, syllabus codes, numeric metrics)
- **Language:** TypeScript 5 (strict)
- **API:** Hono on Cloudflare Workers (`apps/api`)
- **Database & ORM:** Neon Serverless PostgreSQL + Drizzle (`packages/db`)
- **Shared contracts:** TypeScript interfaces & Zod schemas (`packages/shared-types`)
- **Authentication:** Better Auth with session management and multi-role access
- **Object storage:** Cloudflare R2 (S3-compatible presigned upload/download)
- **Jobs & notifications:** Cloudflare cron triggers + Telegram Bot API
- **Hosting:** Vercel (frontend, `https://the-ants.org`), Cloudflare (API & edge)

### Design system (active)

Stitch **IGCSE Study Hub** redesign — **one system, light + dark**:

| Theme | Spec |
|---|---|
| Light | [`docs/design/the_ants_academic_system.md`](./docs/design/the_ants_academic_system.md) |
| Dark | [`docs/design/amber_academic_studio.md`](./docs/design/amber_academic_studio.md) |

Index: [`docs/design/README.md`](./docs/design/README.md). Tokens should be mapped into `apps/web/src/app/globals.css` as semantic CSS variables.

### Dual-developer ownership

| Developer | Scope | Backend |
|---|---|---|
| **Zay Lynn Htet** | Landing, public marketing NavBar, sign-in / sign-up UI | Locked — no `actions` / `db` / `api` / `shared-types` edits |
| **Thaw Ye Zaw** | Dashboard shell, study features, profiles, tools; rebuild notes / flashcards / quizzes | Unlocked — owns schema, API, server actions |

Full path map: [`AGENTS.md`](./AGENTS.md), [`AGENTS.ui.md`](./AGENTS.ui.md), [`AGENTS.features.md`](./AGENTS.features.md).

---

## 2. User roles & permissions

Multi-role accounts use PostgreSQL arrays (`roles: text[]`).

### Roles

| Role | Who | Capabilities |
|---|---|---|
| **Student** | Default | Library (courses, exams, **notes**, **flashcards**, **quizzes**) and tools (timetable, pomodoro, countdown, calculator, workspace); public profile |
| **Tutor / Teacher** | Educators | Student access + tutor profile, Sun–Sat weekly schedule, Telegram inquiry + QR, tutor profile editor |
| **Contributor** | Authors | Curriculum / notes / exam editors, review queue submissions, contributor profile |
| **Main Contributor** | Senior reviewers | Contributor access + review queue moderation and contributor team management |
| **Admin** | Platform managers | Main contributor access + user management, direct role assignment, org mission/team editor |

### Role rules

- Signup defaults to **`student` only**.
- Admins assign/revoke `tutor` / `teacher` / `contributor` / `main_contributor` / `admin`.
- Multi-role users get the union of permissions (no manual role switcher).
- Client checks via `useRole()`; server actions and Hono routes enforce authorization.

### Retired products

- **Clubs** and **classrooms** are **fully retired**. No routes, nav, copy, or new schema for them. Remove leftovers when touched.

---

## 3. Core product pillars & navigation

### Pillar 1: Library (`/library`)

- **Courses & curriculums:** Cambridge IGCSE / A-Level, Edexcel, Matriculation, etc.
- **Past exams & papers:** Series papers, grade boundaries, specimens.
- **Notes (rebuild):** In-app notes library and personal notes (`/my-notes`, library note views). Built from scratch — not a Notion-only product path.
- **Flashcards / SRS (rebuild):** Decks and review flows (`/flashcards`, `/library/flashcards`).
- **Quizzes (rebuild):** Create, take, host, join (`/quizzes`, `/library/quizzes`).

### Pillar 2: Tools (`/tools`)

- **Smart Timetable (`/timetable`):** Weekly planner for classes and study sessions.
- **Pomodoro (`/pomodoro`):** Work/break intervals with session logging.
- **Exam Countdown (`/countdown`):** Live counters for target exams.
- **Grade Calculator (`/calculator`):** Weighted composite grades.
- **Workspace (`/workspace`):** Personal study hub (bookmarks / saved items).

### Pillar 3: Explore & tutors (`/explore`)

- **Tutor directory:** Filter by subjects, rate, qualifications.
- **Public profile (`/profile/[username]`):** Portfolio / tutor schedule / contributor showcase; respects `profile.isPublic`.
- **Tutor schedule states:** Available (emerald), Flexible (amber), Taken/Busy (muted).
- **Telegram inquiry:** Prefill + mobile QR.
- **Contributors:** Directory of curriculum editors and authors.

### Marketing & auth (UI developer)

- **Landing (`/`):** Stitch redesign; public/marketing NavBar owned by Zay Lynn Htet.
- **Auth (`/login`, `/signup`):** Form/visual redesign; backend auth contracts owned by Thaw Ye Zaw if changes are required.

### App shell (features developer)

- Dashboard layout, app sidebar / bottom navigation, and `(app)` chrome owned by Thaw Ye Zaw.

---

## 4. Profile editor

`AdvancedProfileEditor.tsx` — streamlined tabs:

1. **Profile (personal / student):** Display name, avatar (R2), bio, headline, socials, portfolio, CCA, grades, awards, certifications, theme; **`isPublic`** visibility toggle.
2. **Tutor & contributor:**
   - **Tutor:** Telegram, rate, subjects/curriculums, schedule presets, weekly slot grid.
   - **Contributor / admin:** Website, LinkedIn, GitHub, level, contribution logs.

Username / display name: `updateProfile()` in auth context + `actionUpdateUsername` / `actionUpdateDisplayName` for uniqueness and persistence.

---

## 5. Engineering guardrails

1. **Database source of truth:** `packages/db` (Drizzle). Schema/migration changes: **Thaw Ye Zaw only**.
2. **Server actions:** Next.js actions via `getDb()` — **Thaw Ye Zaw only** for this phase; Zay must not edit `apps/web/src/actions/`.
3. **Typed API:** Hono workers (`apps/api`) — **Thaw Ye Zaw only**.
4. **Shared UI:** `apps/web/src/components/ui/` may be edited by either developer; coordinate in PRs.
5. **Tokens:** Coordinate `globals.css` changes so landing/auth and dashboard stay on the same semantic map.
6. **Client directive:** Interactive UI components start with `'use client';`.
7. **Secrets:** Never commit `.env.local` / credentials.
8. **Typecheck:** PRs must keep `npm run typecheck` clean.

---

## 6. Git workflow (redesign phase)

- Long-lived branches (examples): `ui/marketing-auth` (Zay), `feat/dashboard-study` (Thaw).
- Merge via **PR to `main`** only.
- Respect ownership paths in [`AGENTS.md`](./AGENTS.md) to minimize merge conflicts.
