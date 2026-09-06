<div align="center">

# 🐜 The ANTS

### Curriculum-Aware Academic Productivity & Tutoring Platform for Myanmar Students

*Ace with us!*

*Smart Timetables · Flashcards (SRS) · Notes Library · Quizzes · Tutor Schedules · Telegram Booking · Exam Countdowns · Grade Calculators · Portfolio Profiles · Pomodoro*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Neon Postgres](https://img.shields.io/badge/Neon-PostgreSQL-00e599?logo=postgresql)](https://neon.tech/)
[![Hono](https://img.shields.io/badge/Hono-Cloudflare_Workers-e36002?logo=cloudflare)](https://hono.dev/)
[![Status](https://img.shields.io/badge/Status-Beta-3ecf8e)](./)

</div>

---

## What is The ANTS?

**The ANTS** is an academic productivity and tutoring platform for Myanmar students pursuing international qualifications (Cambridge CAIE IGCSE / A-Levels, Pearson Edexcel IGCSE / IAL, IELTS, OSSD, and Grade 12 Matriculation).

Built on a **HONC monorepo** (Hono, ORM/Drizzle, Next.js, Cloudflare Workers & Neon Postgres), it combines study planning tools, in-app notes / flashcards / quizzes, and tutor discovery.

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

**Git:** separate long-lived branches → PRs into `main` (no direct unfinished pushes to `main`).

**Design specs (in-repo):** [`docs/design/`](./docs/design/README.md) — light [`the_ants_academic_system.md`](./docs/design/the_ants_academic_system.md), dark [`amber_academic_studio.md`](./docs/design/amber_academic_studio.md).

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
| **Contributor** | Content creators | Curriculum & notes editor, exam data editor, review queue submissions. |
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
│   ├── db/                      # Neon schema + Drizzle (Features developer)
│   ├── shared-types/            # Shared TS + Zod
│   └── config/                  # Shared ESLint / TS configs
├── docs/design/                 # Stitch light + dark design specs
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
Create `.env.local` in `apps/web/` and `.dev.vars` in `apps/api/`:
```env
DATABASE_URL=postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/the_ants?sslmode=require
NEXT_PUBLIC_APP_URL=http://localhost:3005
```

### 3. Run development servers
```bash
npm run dev       # web + API via Turborepo
npm run dev:web   # web only (port 3005)
npm run typecheck
```

---

## Contributing (this redesign phase)

1. Read [`AGENTS.md`](./AGENTS.md) and **your** role file (`AGENTS.ui.md` or `AGENTS.features.md`).
2. Stay on your ownership paths to avoid merge conflicts.
3. Backend / DB / actions: **Thaw Ye Zaw only.**
4. Open PRs into `main` from your long-lived feature branch.

---

<div align="center">

Built with ❤️ for Myanmar students by The ANTs team

*Ace with us! 🐜*

</div>
