# Multi-Agent Guidelines — The ANTS

> **Active redesign.** Two developers work in parallel on separate long-lived branches and merge via PRs into `main`. Read **your** role file before coding.

| Developer | Role | Agent file |
|---|---|---|
| **Thaw Ye Zaw** | Features / dashboard / study tools / backend | [`AGENTS.features.md`](./AGENTS.features.md) |
| **Zay Lynn Htet** | Landing, auth forms, marketing UI | [`AGENTS.ui.md`](./AGENTS.ui.md) |

### Cloudflare migration (infra)

> **Active phase: Phase 6 cutover** — apex/`www` on Workers; finish smoke + Telegram + decommission.  
> Tracker: [`docs/migration/cloudflare.md`](./docs/migration/cloudflare.md) · Runbook: [`docs/migration/cutover.md`](./docs/migration/cutover.md)  
> Also: [`docs/migration/d1.md`](./docs/migration/d1.md) · [`docs/migration/opennext-web.md`](./docs/migration/opennext-web.md)

Do **not** delete Neon/Vercel or flip production web hosting DNS until Phase 6 is explicitly approved. DNS nameserver move to Cloudflare (while web stays on Vercel) is allowed earlier.

---

## 1. Project overview

- **Application:** The ANTS — curriculum-aware academic productivity platform for Myanmar students.
- **Current objective:** Implement the **Stitch IGCSE Study Hub redesign** (light + dark as one token system) while rebuilding study features and upgrading marketing/auth UI; migrate hosting/DB to Cloudflare (Workers + D1 + R2) per [`docs/migration/cloudflare.md`](./docs/migration/cloudflare.md).
- **Tech stack (HONC monorepo — transitional):**
  - **Frontend (`apps/web`):** Next.js 16.3+ (App Router), React 19, TypeScript 5, Tailwind CSS v4 — **Vercel production**; OpenNext Worker `the-ants-web` for preview (Phase 2)
  - **API (`apps/api`):** Hono on Cloudflare Workers (`api.the-ants.org` target)
  - **Database (`packages/db`):** Cloudflare **D1** (SQLite) + Drizzle — Neon retired from Workers runtime (Phase 3+)
  - **Shared types (`packages/shared-types`):** Shared interfaces + Zod schemas
  - **Storage / jobs:** Cloudflare R2; Telegram queue via **Worker cron only** (no QStash / no GitHub Actions cron)
  - **Web preview:** `https://the-ants-web.thawyezaw.workers.dev` (OpenNext); production apex still Vercel until Phase 6
  - **API:** `https://the-ants-api.thawyezaw.workers.dev` / `https://api.the-ants.org`

---

## 2. Design system (shared source of truth)

In-repo specs (no Downloads path required):

| Asset | Purpose |
|---|---|
| [`docs/design/the_ants_academic_system.md`](./docs/design/the_ants_academic_system.md) | Light theme tokens & component rules |
| [`docs/design/amber_academic_studio.md`](./docs/design/amber_academic_studio.md) | Dark theme tokens & component rules |
| [`docs/design/README.md`](./docs/design/README.md) | Index |

**Rules for both developers:**

1. Treat light + dark as **one design system** with paired semantic tokens — not two unrelated looks.
2. Prefer semantic Tailwind tokens (`bg-background`, `text-foreground`, `bg-primary`, etc.) once mapped into `apps/web/src/app/globals.css`. Do not hardcode Stitch hex values in feature pages unless extending the token map.
3. Typography: **Plus Jakarta Sans** (UI copy); **JetBrains Mono** for timers, syllabus codes, and numeric metrics.
4. Icons: **lucide-react** only.
5. Interactive components start with `'use client'` as line 1.
6. Pass `npm run typecheck` before opening a PR.

---

## 3. Ownership map (merge-conflict prevention)

| Zone | Owner | Paths (primary) |
|---|---|---|
| Landing / marketing | **Zay Lynn Htet** | `apps/web/src/app/page.tsx`, `apps/web/src/app/(public)/`, marketing constants |
| Landing / public NavBar | **Zay Lynn Htet** | Public/marketing navigation used on landing & auth |
| Auth forms | **Zay Lynn Htet** | `apps/web/src/app/(auth)/`, onboarding visuals |
| Dashboard shell / app nav | **Thaw Ye Zaw** | `apps/web/src/components/layout/DashboardLayout.tsx`, app sidebar / bottom nav, `(app)` chrome |
| Study features & dashboard pages | **Thaw Ye Zaw** | `(app)/dashboard`, library, notes, flashcards, quizzes, timetable, pomodoro, profiles, settings, tools |
| Tutors & Contributors directory | **Thaw Ye Zaw** | `(public)/team/`, `components/explore/TutorsContributorsCard.tsx`, `TutorsContributorsPageContent.tsx`; `/explore` redirects to `/team` |
| Shared UI primitives | **Either** (coordinate) | `apps/web/src/components/ui/` |
| Design tokens / `globals.css` | **Coordinate before edit** | `apps/web/src/app/globals.css` |
| Backend / DB / API / server actions | **Thaw Ye Zaw only** | `packages/db`, `packages/shared-types`, `apps/api`, `apps/web/src/actions/` |

**Shared UI rule:** Either developer may edit `components/ui/`, but announce in the PR, keep changes small, and avoid rewriting primitives the other branch depends on without syncing first.

---

## 4. Git workflow

1. **Long-lived branches** (example names):
   - `ui/marketing-auth` — Zay Lynn Htet
   - `feat/dashboard-study` — Thaw Ye Zaw
2. Open **PRs into `main`** only; do not push unfinished work directly to `main`.
3. Rebase/merge from `main` often to reduce drift.
4. Avoid editing the other owner’s primary paths (table above). If blocked, leave a TODO comment and ping the owner — do not “just fix” their files.
5. Never force-push `main`.

---

## 5. Product rules (both developers)

1. **Clubs and classrooms are retired.** Do not reintroduce routes, nav items, copy, query keys, or schema for clubs/classrooms. Remove leftover references when you touch a file.
2. **Signup role:** new users are `student` only. Valid roles: `'student' | 'tutor' | 'teacher' | 'contributor' | 'main_contributor' | 'admin'`. Only admins assign non-student roles.
3. **Notes, flashcards, and quizzes** are being **rebuilt in-app from scratch** (Notion pipeline is not the product direction).
4. Backend changes: **Thaw Ye Zaw only.** Zay Lynn Htet must not edit `packages/db`, `packages/shared-types`, `apps/api`, or `apps/web/src/actions/`.

---

## 6. Developer commands

```bash
npm install
npm run dev          # web (3005) + API with remote D1 the-ants-db (8787)
npm run dev:web      # Next.js on port 3005 only
npm run dev:api      # API with remote D1 only (8787)
npm run dev:api:local # API with isolated local D1 (8787)
npm run typecheck
npm run build
```

---

## 7. Role checks (frontend)

```tsx
'use client';
import { useRole } from '@/hooks/useRole';

export default function MyComponent() {
  const { role, isStudent, isTutor, isContributor, isAdmin, hasRole } = useRole();
  // ...
}
```

---

## 8. Doc index

| File | Purpose |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Shared rules (this file) |
| [`AGENTS.ui.md`](./AGENTS.ui.md) | Zay Lynn Htet — landing & auth |
| [`AGENTS.features.md`](./AGENTS.features.md) | Thaw Ye Zaw — features & backend |
| [`docs/migration/cloudflare.md`](./docs/migration/cloudflare.md) | **Cloudflare migration phase tracker** (current phase + decisions) |
| [`docs/migration/handoff-phase-4.md`](./docs/migration/handoff-phase-4.md) | **Paste this prompt** to continue Phase 4 in a new chat |
| [`README.md`](./README.md) | Project overview & setup |
| [`spec.md`](./spec.md) | System specification |
| [`docs/design/`](./docs/design/README.md) | Stitch light + dark design specs |
