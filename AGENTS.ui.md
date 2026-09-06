# AGENTS — UI Developer (Zay Lynn Htet)

> Read [`AGENTS.md`](./AGENTS.md) first. This file is your ownership scope only.

## Mission

Upgrade **landing / marketing** and **sign-in / sign-up** to the Stitch redesign (light + dark as one token system). Keep UI consistent with Thaw Ye Zaw’s dashboard work without editing his primary paths.

## You own

| Area | Paths |
|---|---|
| Landing page | `apps/web/src/app/page.tsx`, related homepage constants/components |
| Public marketing | `apps/web/src/app/(public)/` (e.g. `/about`, explore marketing surfaces as agreed) |
| Landing / public NavBar | Marketing/public navigation chrome (not dashboard shell) |
| Auth UX | `apps/web/src/app/(auth)/` — `/login`, `/signup`, auth page layout & form design |
| Onboarding visuals | `apps/web/src/app/(onboarding)/` presentation only (no auth/backend contract changes) |

## You may touch (with care)

- `apps/web/src/components/ui/` — shared primitives (coordinate in PR; don’t break dashboard consumers)
- `apps/web/src/app/globals.css` — **only after syncing** with Thaw on token names (light/dark mapping)

## You must NOT touch

- `apps/web/src/app/(app)/` dashboard feature pages
- `apps/web/src/components/layout/DashboardLayout.tsx` and app sidebar / bottom-nav chrome
- Profile editors, timetable, pomodoro, notes, flashcards, quizzes, library internals
- `apps/web/src/actions/`
- `apps/api/**`
- `packages/db/**`
- `packages/shared-types/**`
- Any clubs/classrooms revival

## Design system checklist

Source: [`docs/design/`](./docs/design/README.md)

1. Match **light** ([`the_ants_academic_system.md`](./docs/design/the_ants_academic_system.md)) and **dark** ([`amber_academic_studio.md`](./docs/design/amber_academic_studio.md)) as paired themes.
2. Landing first viewport: brand-forward, one composition, Plus Jakarta Sans — avoid cream/ochre legacy look once tokens migrate.
3. Auth forms: use shared input/button patterns; amber primary CTAs; clear focus rings; mobile-first.
4. Prefer semantic tokens over raw hex after `globals.css` is updated.
5. Icons: `lucide-react` only.
6. Strip clubs/classrooms copy from landing/auth metadata when you edit those files.

## Branch & PR

- Branch example: `ui/marketing-auth`
- PR into `main` only
- Rebase from `main` frequently
- If you need a dashboard or backend change, open an issue / ping **Thaw Ye Zaw** — do not edit his locked paths

## Definition of done (your PRs)

- [ ] Landing and auth look aligned with Stitch light + dark
- [ ] No edits under `(app)/` feature routes or backend packages
- [ ] `npm run typecheck` clean
- [ ] No clubs/classrooms copy reintroduced
- [ ] Shared `components/ui` changes called out in the PR description
