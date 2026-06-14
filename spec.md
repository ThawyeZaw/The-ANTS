# Focus Point — System Specification & Integration Manifest (`spec.md`)

## 1. Project Architecture & Tech Stack
- **Frontend Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript 5
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage)
- **MVP State:** Mock data via `src/lib/mockDatabase.ts` before Supabase binding.
- **Hosting:** Vercel

## 2. User Roles & Permissions
Privacy and access boundaries are strictly enforced.
- **Student:** Primary user. Has access to personal dashboard, study tools, timetables, and grade calculators.
- **Teacher:** Paid tier. Can create virtual classrooms, issue assignments, and view performance *only* for students inside their authorized classrooms. 
- **Contributor:** Verified experts. Can create/edit global curriculum templates, exams, and shared library notes.

## 3. Directory Isolation Boundaries
Developers are strictly confined to their designated workspace paths. You are prohibited from editing files outside your assigned directories. The **Project Manager (PM)** owns all shared infrastructure.

| Developer | Feature Ownership | Assigned Paths |
|---|---|---|
| `@Phuupwint_p` | Smart Timetable, Pomodoro Timer | `src/components/timetable/`, `src/components/pomodoro/`, `src/hooks/usePomodoro.ts`, `src/hooks/useTimetable.ts`, `src/context/TimerContext.tsx`, `src/constants/timetable.ts`, `src/constants/pomodoro.ts`, `src/actions/timetable.ts` |
| `@bmk_tg` & `@KelvinChaint` | Lesson Tracker, Course Manager, Curriculum & Notes Editor, Classrooms | `src/components/lessons/`, `src/components/courses/`, `src/components/classrooms/`, `src/components/editor/`, `src/actions/classrooms.ts`, `src/actions/editor.ts` |
| `@Neon_Aung` | Grade Calculator, Exam Countdown | `src/components/calculator/`, `src/components/countdown/`, `src/hooks/useCountdown.ts`, `src/constants/gradeBoundaries.ts`, `src/lib/srs/` *(read-only reference)* |
| `@zyytbh` | Public Home Page, Login & Signup | `src/app/page.tsx`, `src/app/(auth)/`, `src/components/auth/` |
| `minkhit` | Flashcard Creator & Library | `src/components/flashcards/`, `src/hooks/useFlashcardSRS.ts`, `src/actions/flashcards.ts` |
| **PM (you)** | Shared Infrastructure | `src/lib/`, `src/types/`, `src/context/AuthContext.tsx`, `src/context/PersonaContext.tsx`, `src/components/ui/`, `src/components/layout/`, `src/hooks/useAuth.ts`, `src/hooks/useRole.ts`, `src/constants/qualifications.ts`, `middleware.ts`, `supabase/`, `src/app/(app)/layout.tsx`, `src/app/(app)/dashboard/` |

## 4. Vibe-Coding Guardrails (Non-Negotiable)
To prevent "Schema Chaos" and integration breakdowns when using Gemini Code Assist, the following rules apply to all team members:

1. **The Database Gatekeeper:** The Project Manager is the sole administrator of the live database instance. Developers may not alter tables, triggers, or Row-Level Security (RLS) rules without approval.
2. **Unified Data Facade:** All mock data queries must pass through `src/lib/mockDatabase.ts`). Do not invent custom isolated data schemas.
3. **Atomic Feature Branching:** All work must happen on dedicated task branches (e.g., `feature/timetable-ui`). Never push directly to `main` or `dev`.
4. **Morning Sync:** Pull the latest stable code (`git pull origin dev`) every morning before vibe-coding.
5. **Client Components:** Any interactive UI (timers, calculators, interactive forms) must start with the `'use client';` directive to avoid crashing Next.js Server Components.

## 5. Mandatory AI Prompt Preamble (Context Shield)
Before starting a generation session in VS Code, every developer **must** paste the following Context Shield into AI agent:

> *"You are building inside my isolated feature folder under `src/components/[Your-Feature-Folder]/`. You must respect the project architecture constraints detailed in `spec.md`, use the database typing declarations in `types/supabase.ts`, and pull data operations exclusively through our shared study-data mock database facade. Do not invent custom database properties, unmapped relational paths, or arbitrary styling elements (e.g. hardcoded pixels like `p-[13px]`) that cause utility bloat. If this module relies on user interactions, build it as a Next.js Client Component starting with the 'use client' directive."*

## 6. Database Schema Map (PostgreSQL)
*(Note: Full types are generated via Supabase CLI in `types/supabase.ts`)*

- `profiles`: [Placeholder for User metadata & Role statuses]
- `curriculums`: [Placeholder for Global templates - IGCSE, SAT, etc.]
- `user_curriculums`: [Placeholder for Junction table mapping students to multiple curriculums]
- `topics` & `student_topics`: [Placeholder for Syllabus breakdown and localized confidence levels]
- `classrooms`: [Placeholder for mapping class ID, teacher ID, and curriculum ID]
- `timetable_events`: [Placeholder for JSONB scheduling arrays]
- `flashcards` & `card_reviews`: [Placeholder for spaced-repetition logic]

---

## 7. Detailed Project Architecture & File Structure

This directory tree is the **absolute source of truth** for file placement. AI Agents and Developers must follow this structure exactly. Do not create new top-level directories without PM approval.

```text
focus-point/                        # Project root
├── middleware.ts                   # 🔒 PM — Route protection (redirects unauthenticated users)
├── supabase/                       # 🔒 PM — Supabase CLI local config
│   ├── config.toml
│   ├── seed.sql                    # Dev seed data
│   └── migrations/                 # SQL migration files (version-controlled schema changes)
│
├── public/
│   ├── sounds/                     # 🔒 @Phuupwint_p — Pomodoro background music (mp3/ogg)
│   └── icons/                      # 🔒 PM — Exam board logos & app icons
│
└── src/
    ├── app/                        # Next.js 16 App Router (Server Components by default)
    │   ├── layout.tsx              # 🔒 PM — Root layout (providers, global fonts, metadata)
    │   ├── page.tsx                # 🔒 @zyytbh — Public landing / home page
    │   ├── not-found.tsx           # 🔒 PM — Global 404 page
    │   │
    │   ├── (auth)/                 # 🔒 @zyytbh — Auth route group (no shell/sidebar)
    │   │   ├── login/
    │   │   │   └── page.tsx        # Login page
    │   │   └── signup/
    │   │       └── page.tsx        # Signup / role selection page
    │   │
    │   └── (app)/                  # Authenticated shell (Route Group — requires login)
    │       ├── layout.tsx          # 🔒 PM — App shell (Sidebar + TopNav wraps all authed routes)
    │       ├── loading.tsx         # 🔒 PM — Global skeleton loader
    │       ├── dashboard/
    │       │   └── page.tsx        # 🔒 PM — Role-based dashboard (Student / Teacher / Contributor)
    │       │
    │       ├── timetable/
    │       │   └── page.tsx        # 🔒 @Phuupwint_p — Smart Timetable
    │       │
    │       ├── pomodoro/
    │       │   └── page.tsx        # 🔒 @Phuupwint_p — Pomodoro Timer
    │       │
    │       ├── flashcards/
    │       │   ├── page.tsx        # 🔒 minkhit — Deck library (browse & create)
    │       │   └── [deckId]/
    │       │       └── page.tsx    # 🔒 minkhit — Active study session for a deck
    │       │
    │       ├── classrooms/
    │       │   ├── page.tsx        # 🔒 @bmk_tg & @KelvinChaint — Classroom list
    │       │   └── [id]/
    │       │       └── page.tsx    # 🔒 @bmk_tg & @KelvinChaint — Individual classroom view
    │       │
    │       ├── calculator/
    │       │   └── page.tsx        # 🔒 @Neon_Aung — Grade Calculator
    │       │
    │       ├── countdown/
    │       │   └── page.tsx        # 🔒 @Neon_Aung — Exam Countdown manager
    │       │
    │       ├── editor/
    │       │   ├── page.tsx        # 🔒 @bmk_tg & @KelvinChaint — Curriculum & Notes editor
    │       │   └── review/
    │       │       └── page.tsx    # 🔒 PM — Gatekeeper approval queue
    │       │
    │       ├── lessons/
    │       │   └── page.tsx        # 🔒 @bmk_tg & @KelvinChaint — Lesson Tracker
    │       │
    │       └── courses/
    │           └── page.tsx        # 🔒 @bmk_tg & @KelvinChaint — Course Manager
    │
    ├── components/                 # UI components ('use client' where interactive)
    │   ├── ui/                     # 🔒 PM — Shared atomic components
    │   │   ├── Button.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Input.tsx
    │   │   ├── Badge.tsx
    │   │   └── ProgressBar.tsx
    │   ├── layout/                 # 🔒 PM — Global shell components
    │   │   ├── Sidebar.tsx
    │   │   ├── TopNav.tsx
    │   │   └── AuthModal.tsx
    │   ├── auth/                   # 🔒 @zyytbh — Login & signup form components
    │   ├── timetable/              # 🔒 @Phuupwint_p
    │   ├── pomodoro/               # 🔒 @Phuupwint_p
    │   ├── lessons/                # 🔒 @bmk_tg & @KelvinChaint
    │   ├── courses/                # 🔒 @bmk_tg & @KelvinChaint
    │   ├── classrooms/             # 🔒 @bmk_tg & @KelvinChaint
    │   ├── editor/                 # 🔒 @bmk_tg & @KelvinChaint
    │   ├── calculator/             # 🔒 @Neon_Aung
    │   ├── countdown/              # 🔒 @Neon_Aung
    │   └── flashcards/             # 🔒 minkhit
    │
    ├── hooks/                      # Custom React Hooks (logic only — no JSX)
    │   ├── useAuth.ts              # 🔒 PM — Supabase auth session wrapper
    │   ├── useRole.ts              # 🔒 PM — Read current persona from context
    │   ├── usePomodoro.ts          # 🔒 @Phuupwint_p — Timer state machine
    │   ├── useTimetable.ts         # 🔒 @Phuupwint_p — Drag-and-drop & view switching
    │   ├── useFlashcardSRS.ts      # 🔒 minkhit — SRS review scheduling interface
    │   └── useCountdown.ts         # 🔒 @Neon_Aung — Exam date diff & urgency calc
    │
    ├── context/                    # Global React Context Providers
    │   ├── AuthContext.tsx         # 🔒 PM — Supabase session (required by all authed pages)
    │   ├── PersonaContext.tsx      # 🔒 PM — User Role State (Student / Teacher / Contributor)
    │   └── TimerContext.tsx        # 🔒 @Phuupwint_p — Global Pomodoro state (survives navigation)
    │
    ├── actions/                    # Next.js Server Actions ('use server' — server-side mutations)
    │   ├── timetable.ts            # 🔒 @Phuupwint_p
    │   ├── flashcards.ts           # 🔒 minkhit
    │   ├── classrooms.ts           # 🔒 @bmk_tg & @KelvinChaint
    │   └── editor.ts               # 🔒 PM — Contributor submit & gatekeeper approve/reject
    │
    ├── constants/                  # Static reference data (no logic — pure data)
    │   ├── qualifications.ts       # 🔒 PM — Exam boards, subjects, series (CAIE, Edexcel, OSSD…)
    │   ├── gradeBoundaries.ts      # 🔒 @Neon_Aung — Official IGCSE/A-Level/IAL/OSSD boundary tables
    │   ├── timetable.ts            # 🔒 @Phuupwint_p — Event type colours & repeat options
    │   └── pomodoro.ts             # 🔒 @Phuupwint_p — Default intervals & music track manifest
    │
    ├── lib/                        # Infrastructure clients & utilities (🔒 PM)
    │   ├── supabase/
    │   │   ├── client.ts           # Browser-side Supabase client (singleton)
    │   │   └── server.ts           # Server-side Supabase client (for RSC & Server Actions)
    │   ├── mock/
    │   │   └── database.ts         # MVP Phase 1: Typed mock data facade (ALL features import from here)
    │   ├── srs/
    │   │   └── algorithm.ts        # SM-2 / FSRS spaced repetition core algorithm
    │   └── utils.ts                # General helpers (cn, date formatting, grade conversion)
    │
    └── types/                      # TypeScript Definitions (🔒 PM)
        ├── index.ts                # Shared app-wide types & interfaces
        └── supabase.ts             # Supabase CLI auto-generated DB types (prod transition)
```

---

### 🧠 AI Agent Directives for File Structure

To maintain ecosystem stability, AI coding assistants must adhere to the following rules:

1. **The Next.js Boundary Rule:** Files inside `src/app/` must be lightweight page shells. All state, logic, and complex UI belongs in `src/components/` (with `'use client'`) or `src/hooks/`.
2. **Strict Component Colocation:** Never put feature-specific components into `src/components/ui/`. If a component is only used in the Timetable, it lives in `src/components/timetable/`.
3. **Mock Data Isolation:** Never hardcode mock arrays inside component files. Always import from `src/lib/mock/database.ts`.
4. **Hook Ownership:** Never write stateful logic (`useState`, `useEffect`, `useReducer`) directly in page files. Extract it into a named hook in `src/hooks/`.
5. **Constants Are Not Components:** Grade boundaries, colour maps, and qualification lists go in `src/constants/` — never inside components or mockDatabase.
6. **Server Actions Live in `src/actions/`:** Never define a `'use server'` function inside a component file. Place it in the appropriate `src/actions/*.ts` file.
7. **Styling Consistency:** Use Tailwind CSS v4 utility classes only. No hardcoded `px`/`py` values. Use `lucide-react` for all icons.
8. **Respect 🔒 Ownership:** Do not create, edit, or delete files marked with another developer's lock. If a shared file needs changing, notify the PM.