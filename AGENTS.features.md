# AGENTS — Features Developer (Thaw Ye Zaw)

> Read [`AGENTS.md`](./AGENTS.md) first. This file is your ownership scope only.

## Mission

Rebuild **notes, flashcards, and quizzes from scratch**; upgrade dashboard features (profiles, timetable, pomodoro, library, tools); apply the Stitch design system inside the **app shell**; and own **backend / DB / API / server actions** needed for those features.

## You own

| Area | Paths |
|---|---|
| App / dashboard shell | `DashboardLayout`, app sidebar, bottom nav, `(app)` chrome |
| Dashboard & tools | `/dashboard`, `/student`, `/timetable`, `/pomodoro`, `/countdown`, `/calculator`, `/workspace`, `/tools` |
| Library & study rebuild | `/library`, `/my-notes`, `/flashcards`, `/quizzes`, related share routes |
| Profiles & settings | `/settings`, `/settings/profile`, public profile behavior as product owner |
| Contributor / admin portals | `/editor`, `/contributor`, `/main-contributor`, org tools as needed |
| Backend | `apps/web/src/actions/`, `apps/api/`, `packages/db/`, `packages/shared-types/` |

## You may touch (with care)

- `apps/web/src/components/ui/` — shared primitives (coordinate if Zay depends on them)
- `apps/web/src/app/globals.css` — **sync token renames** with Zay before large theme PRs so landing/auth don’t break

## You must NOT touch (unless coordinating a merge)

- Landing hero / marketing composition owned by Zay: `apps/web/src/app/page.tsx` marketing sections
- Auth form redesign owned by Zay: `apps/web/src/app/(auth)/` visual layout
- Public marketing NavBar owned by Zay

If a shared type or action blocks his auth UI, keep the **API contract stable** and let him restyle only.

## Backend unlock (you only)

Unlike the previous “backend locked for everyone” policy:

1. You **may** change Drizzle schema, migrations, Hono routes, shared Zod types, and server actions for notes / flashcards / quizzes / dashboard features.
2. Prefer additive, reviewable migrations; document breaking contract changes in the PR.
3. Zay Lynn Htet remains **backend-locked** — do not ask him to edit actions/schema.

## Product direction

1. **Rebuild in-app:** notes, flashcards (SRS), quizzes — replace any Notion-pipeline product assumption.
2. **Retire fully:** clubs and classrooms — delete leftover UI, query keys, copy, and (when safe) schema references; do not leave dead nav.
3. **Roles unchanged:** signup → `student`; admin assigns other roles.
4. Apply Stitch **light + dark** tokens inside dashboard surfaces for consistency with landing/auth.

## Design system checklist

Source: [`docs/design/`](./docs/design/README.md)

1. Map both theme specs into semantic CSS variables used by the app shell.
2. Use JetBrains Mono for Pomodoro timers, syllabus codes, grade metrics.
3. Dashboard cards/panels follow Stitch elevation (outline-first, soft shadow) — match radius scale from the active theme.
4. Icons: `lucide-react` only.
5. Hooks: prefer existing `useAuth`, `useRole`, `useTimetable`, `useCountdown`, etc.; add feature hooks under `apps/web/src/hooks/` when needed.

## Branch & PR

- Branch example: `feat/dashboard-study`
- PR into `main` only
- Rebase from `main` frequently
- Split large work: tokens → shell → one feature vertical (e.g. flashcards) per PR when practical

## Definition of done (your PRs)

- [ ] Feature works end-to-end (UI + actions/API/DB as needed)
- [ ] Stitch-aligned light/dark tokens on touched surfaces
- [ ] No clubs/classrooms reintroduced; leftovers removed in touched files
- [ ] `npm run typecheck` (and relevant build) clean
- [ ] Contract changes noted for Zay if auth/landing depends on them
