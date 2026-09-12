<div align="center">

# 🐜 The ANTS

### Curriculum-Aware Academic Productivity & Tutoring Platform for Myanmar Students

*Ace with us!*

*Smart Timetables · Flashcards (SRS) · Notes Library · Quizzes · Tutor Schedules · Telegram Booking · Exam Countdowns · Grade Calculators · Portfolio Profiles · Pomodoro*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1_SQLite-f38020?logo=cloudflare)](https://developers.cloudflare.com/d1/)
[![Hono](https://img.shields.io/badge/Hono-Cloudflare_Workers-e36002?logo=cloudflare)](https://hono.dev/)
[![OpenNext](https://img.shields.io/badge/OpenNext-Cloudflare_Workers-f38020?logo=cloudflare)](https://opennext.js.org/cloudflare)
[![Status](https://img.shields.io/badge/Status-Beta-3ecf8e)](./)

</div>

---

## What is The ANTS?

**The ANTS** is an academic productivity and tutoring platform for Myanmar students pursuing international qualifications (Cambridge CAIE IGCSE / A-Levels, Pearson Edexcel IGCSE / IAL, IELTS, OSSD, and Grade 12 Matriculation).

Built on a **HONC monorepo** (Hono, ORM/Drizzle, Next.js, Cloudflare Workers & D1), it combines study planning tools, in-app notes / flashcards / quizzes, and tutor discovery.

**Retired:** Clubs and classrooms are fully removed from the product. Do not reintroduce them.

---

## Active redesign (dual developers)

We are implementing the **Stitch IGCSE Study Hub** design system as **one light + dark token system**.

| Developer | Focus | Agent guide |
|---|---|---|
| **Thaw Ye Zaw** | Dashboard features, study rebuild (notes / flashcards / quizzes), profiles, tools, backend | [`AGENTS.features.md`](./AGENTS.features.md) |
| **Zay Lynn Htet** | Landing page, sign-in / sign-up, marketing UI | [`AGENTS.ui.md`](./AGENTS.ui.md) |

Shared rules and ownership map: [`AGENTS.md`](./AGENTS.md)  
System specification: [`spec.md`](./spec.md)  
Cloudflare migration (current phase): [`docs/migration/cloudflare.md`](./docs/migration/cloudflare.md)

**Git:** separate long-lived branches → PRs into `main` (no direct unfinished pushes to `main`).

**Design specs (in-repo):** [`docs/design/`](./docs/design/README.md) — light [`the_ants_academic_system.md`](./docs/design/the_ants_academic_system.md), dark [`amber_academic_studio.md`](./docs/design/amber_academic_studio.md).

**Infra note:** Production web remains on Vercel until Phase 6. Preview the OpenNext Worker with `npm run cf:preview:web` / `npm run cf:deploy:web` (root directory **`apps/web`** — never monorepo root). See [`docs/migration/opennext-web.md`](./docs/migration/opennext-web.md). API + R2 + notification cron stay on Cloudflare Workers.

---

## Core product architecture (3 pillars)

```
                       ┌─────────────────────────────────────┐
                       │               The ANTS              │
                       └──────────────────┬──────────────────┘
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
   ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
   │    1. Library   │           │    2. Tools     │           │  3. Explore &   │
   │                 │           │                 │           │     Tutors      │
   ├─────────────────┤           ├─────────────────┤           ├─────────────────┤
   │ • Courses       │           │ • Smart         │           │ • Tutor         │
   │ • Notes         │           │   Timetable     │           │   Directory     │
   │ • Flashcards    │           │ • Pomodoro      │           │ • Weekly Slot   │
   │   (SRS)         │           │ • Exam          │           │   Schedule      │
   │ • Past Exams    │           │   Countdown     │           │ • Telegram      │
   │ • Quizzes       │           │ • Calculator    │           │   Inquiry & QR  │
   │   (rebuild)     │           │ • Workspace     │           │ • Contributors  │
   │                 │           │                 │           │ • Public CV     │
   └─────────────────┘           └─────────────────┘           └─────────────────┘
```

Notes, flashcards, and quizzes are being **rebuilt in-app from scratch** (not a Notion-only pipeline).

---

## Multi-role permission model

Users register as `student`. Admins assign additional roles (`roles: text[]`).

| Role | Target | Access & capabilities |
|---|---|---|
| **Student** | Primary learners | Library (notes, flashcards, exams, quizzes) and tools (timetable, pomodoro, countdown, calculator, workspace). |
| **Tutor** | Educators | Student access + public tutor profile, weekly teaching timetable, Telegram inquiry + QR, tutor profile editor. |
| **Contributor** | Content creators | Exam data editor, grade calculator / countdown proposals. |
| **Admin** | Platform managers | User management & role assignment, org/team management, moderation. |

---

## Monorepo structure

```
The-ANTS/
├── apps/
│   ├── web/                     # Next.js 16 App Router (port 3005)
│   │   ├── src/app/             # Routes: (public), (auth), (app), (onboarding)
│   │   ├── src/components/      # UI (layout, profile, timetable, notes, …)
│   │   ├── src/hooks/           # useAuth, useRole, useTimetable, …
│   │   └── src/actions/         # Server actions (Features developer)
│   └── api/                     # Hono on Cloudflare Workers
├── packages/
│   ├── db/                      # D1 (SQLite) schema + Drizzle (Features developer)
│   ├── shared-types/            # Shared TS + Zod
│   └── config/                  # Shared ESLint / TS configs
├── docs/design/                 # Stitch light + dark design specs
├── docs/migration/              # Cloudflare migration phase tracker
├── AGENTS.md                    # Shared dual-dev rules
├── AGENTS.ui.md                 # Zay Lynn Htet
├── AGENTS.features.md           # Thaw Ye Zaw
├── spec.md                      # System specification
└── schema.md                    # Database schema reference
```

---

## Getting started

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Copy [`.env.example`](./.env.example) to `.env.local`. Create `.dev.vars` in `apps/api/` / `apps/web/` for Worker secrets.
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8787
CRON_SECRET=dev-secret
```

Workers use **D1** via wrangler binding `DB` (not a Neon `DATABASE_URL`). Production / CF preview clients should use `NEXT_PUBLIC_API_URL=https://api.the-ants.org`.

Telegram notification queue is drained by the **API Worker cron** (`apps/api`), not QStash or GitHub Actions.

### 3. Run development servers
```bash
npm run dev       # web (3005) + API with remote D1 the-ants-db (8787)
npm run dev:web   # web only (port 3005)
npm run dev:api:local  # isolated local D1 (solo experiments)
npm run typecheck
```

Deploy API from `apps/api`; deploy web Worker preview from `apps/web` (OpenNext):

```bash
cd apps/api && npx wrangler deploy
npm run cf:deploy:web   # creates/updates Worker the-ants-web — do NOT point apex DNS yet
```

Guide: [`docs/migration/opennext-web.md`](./docs/migration/opennext-web.md).

---

## Contributing (this redesign phase)

1. Read [`AGENTS.md`](./AGENTS.md) and **your** role file (`AGENTS.ui.md` or `AGENTS.features.md`).
2. Check migration phase in [`docs/migration/cloudflare.md`](./docs/migration/cloudflare.md).
3. Stay on your ownership paths to avoid merge conflicts.
4. Backend / DB / actions: **Thaw Ye Zaw only.**
5. Open PRs into `main` from your long-lived feature branch.

---

<div align="center">

Built with ❤️ for Myanmar students by The ANTs team

*Ace with us! 🐜*

</div>
