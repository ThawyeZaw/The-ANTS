<div align="center">

# 🐜 The ANTS

### Curriculum-Aware Academic Productivity & Tutoring Platform for Myanmar Students

*Ace with us!*

*Smart Timetables · Flashcards (SRS) · Notes Library · Tutor Schedules · Telegram Booking · Exam Countdowns · Grade Calculators · Portfolio Profiles · Pomodoro*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Neon Postgres](https://img.shields.io/badge/Neon-PostgreSQL-00e599?logo=postgresql)](https://neon.tech/)
[![Hono](https://img.shields.io/badge/Hono-Cloudflare_Workers-e36002?logo=cloudflare)](https://hono.dev/)
[![Status](https://img.shields.io/badge/Status-Beta-3ecf8e)](./)

</div>

---

## 🌟 What is The ANTS?

**The ANTS** is an academic productivity and tutoring platform tailored for Myanmar students pursuing international qualifications (Cambridge CAIE IGCSE / A-Levels, Pearson Edexcel IGCSE / IAL, IELTS, OSSD, and Grade 12 Matriculation).

Built on a modern **HONC Monorepo** (Hono, ORM/Drizzle, Next.js, Cloudflare Workers & Neon Postgres), The ANTS equips students with study planning tools, verified syllabus notes, and direct access to academic tutors and weekly class schedules.

---

## 🏛️ Core Product Architecture (3 Pillars)

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
   │ • Notes Library │           │   Timetable     │           │   Directory     │
   │ • Flashcards    │           │ • Pomodoro      │           │ • Weekly Slot   │
   │   (SRS)         │           │   Timer         │           │   Schedule      │
   │ • Past Exams    │           │ • Exam          │           │ • Telegram      │
   │ • Quizzes       │           │   Countdown     │           │   Inquiry & QR  │
   │                 │           │ • Calculator    │           │ • Contributors  │
   │                 │           │ • Workspace     │           │ • Public CV     │
   └─────────────────┘           └─────────────────┘           └─────────────────┘
```

---

## 👥 Multi-Role Permission Model

Users register as `student` and can be assigned additional roles by platform administrators (`roles: text[]`). Users automatically have access to all tools granted by their roles:

| Role | Target | Access & Capabilities |
|---|---|---|
| **Student** | Primary Learners | Full access to Library (Notes, Flashcards, Past Papers) and Productivity Tools (Timetable, Pomodoro, Exam Countdown, Grade Calculator, Workspace). |
| **Tutor** | Academic Educators | Public Tutor Profile with Sunday–Saturday Weekly Teaching Timetable, Telegram direct inquiry modal with mobile QR code scanner, and Tutor Profile Editor tab. |
| **Contributor** | Content Creators | Curriculum & Notes Editor, Exam Data Editor, and Review Queue submission portal. |
| **Admin** | Platform Managers | User Management & multi-role badge assignment, Organization team management, and content moderation. |

---

## 🛠️ Monorepo Structure

```
The-ANTS/
├── apps/
│   ├── web/                     # Next.js 16 App Router frontend (Port 3005)
│   │   ├── src/app/             # App Router pages & API handlers
│   │   ├── src/components/      # UI components (profile, timetable, notes, pomodoro, etc.)
│   │   ├── src/hooks/           # React hooks (useAuth, useRole, useProfile, etc.)
│   │   └── src/actions/         # Direct Neon Drizzle DB Server Actions
│   └── api/                     # Hono API deployed on Cloudflare Workers
├── packages/
│   ├── db/                      # Neon PostgreSQL schema definitions & Drizzle ORM
│   ├── shared-types/            # Shared TypeScript interfaces & Zod validation schemas
│   └── config/                  # Shared ESLint and TypeScript configs
├── spec.md                      # System integration specifications
├── schema.md                    # Database schema reference
└── AGENTS.md                    # Multi-agent developer ownership guidelines
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env.local` in `apps/web/` and `.dev.vars` in `apps/api/`:
```env
DATABASE_URL=postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/the_ants?sslmode=require
NEXT_PUBLIC_APP_URL=http://localhost:3005
```

### 3. Run Development Servers
```bash
# Run web and API together via Turborepo:
npm run dev

# Or run web individually:
npm run dev:web
```

---

<div align="center">

Built with ❤️ for Myanmar students by The ANTs team

*Ace with us! 🐜*

</div>