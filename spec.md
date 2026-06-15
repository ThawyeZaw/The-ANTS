# The ANTS — System Specification & Integration Manifest (`spec.md`)

## 1. Project Architecture & Tech Stack
- **Frontend Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript 5
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage)
- **MVP State:** Mock data via `src/lib/mock/database.ts` before Supabase binding.
- **Hosting:** Vercel

---

## 2. User Roles & Permissions
Privacy and access boundaries are strictly enforced. There are **four roles**, selected at signup (one email can hold multiple roles).

| Role | Who | What they can access |
|---|---|---|
| **Student** | Primary users | All personal study tools (Timetable, Pomodoro, Flashcards, Lesson Tracker, Course Manager, Exam Countdown, Grade Calculator), Classrooms (join), Clubs (join) |
| **Teacher** | Paid tier | Everything Student gets + create & manage Classrooms, issue Assignments, monitor student progress within their classrooms, Clubs (join & participate) |
| **Contributor** | Verified experts | Everything Teacher gets + Curriculum & Notes Editor, Exam Data Editor, lead Clubs, publicly visible Contributor Profile |
| **Main Contributor** | Senior verified experts | Everything Contributor gets + Gatekeeper Review Queue (approve, reject, or request revisions on Contributor submissions before they go public) |

> **Note:** `main_contributor` is a **separate top-level role** — not a flag or sub-role. It is stored as an enum value in the `profiles.role` column.

---

## 3. Directory Isolation Boundaries
Developers are strictly confined to their designated workspace paths. You are prohibited from editing files outside your assigned directories. The **Project Manager (PM)** owns all shared infrastructure.

| Developer | Feature Ownership |
|---|---|
| `PPP` | Smart Timetable, Pomodoro Timer |
| `BMK` & `ABC` | Lesson Tracker, Course Manager, Curriculum & Notes Editor, Classrooms |
| `ZLH` | Flashcard Creator & Library, Exam Countdown, Exam Data Editor |
| `AKT` | Grade Calculator, Clubs |
| **PM (`TYZ`)** | Shared Infrastructure, Public Home Page, Login & Signup, Role Landing Pages, NavBar, Contributor Profiles, Review Queue |

---

## 4. Vibe-Coding Guardrails (Non-Negotiable)
To prevent "Schema Chaos" and integration breakdowns when using AI coding assistants, the following rules apply to all team members:

1. **The Database Gatekeeper:** The Project Manager is the sole administrator of the live database instance. Developers may not alter tables, triggers, or Row-Level Security (RLS) rules without approval.
2. **Unified Data Facade:** All mock data queries must pass through `src/lib/mock/database.ts`. Do not invent custom isolated data schemas.
3. **Atomic Feature Branching:** All work must happen on dedicated task branches (e.g., `feature/timetable-ui`). Never push directly to `main` or `dev`.
4. **Morning Sync:** Pull the latest stable code (`git pull origin dev`) every morning before vibe-coding.
5. **Client Components:** Any interactive UI (timers, calculators, interactive forms) must start with the `'use client';` directive to avoid crashing Next.js Server Components.
6. **Four-Role Awareness:** The persona context exposes four roles: `student`, `teacher`, `contributor`, `main_contributor`. Always use `useRole()` to guard feature access — never hard-code role strings in component logic.

---

## 5. Mandatory AI Prompt Preamble (Context Shield)
Before starting a generation session in VS Code, every developer **must** paste the following Context Shield into the AI agent:

> *"You are building inside my isolated feature folder under `src/components/[Your-Feature-Folder]/`. You must respect the project architecture constraints detailed in `spec.md`, use the database typing declarations in `types/supabase.ts`, and pull data operations exclusively through our shared study-data mock database facade at `src/lib/mock/database.ts`. Do not invent custom database properties, unmapped relational paths, or arbitrary styling elements (e.g. hardcoded pixels like `p-[13px]`) that cause utility bloat. If this module relies on user interactions, build it as a Next.js Client Component starting with the `'use client'` directive. The app uses four roles: `student`, `teacher`, `contributor`, `main_contributor` — use `useRole()` from `src/hooks/useRole.ts` for any role-gated logic."*

---

## 6. Database Schema Map (PostgreSQL)
*(Note: Full types are generated via Supabase CLI in `types/supabase.ts`)*

- `profiles`: [User metadata, role statuses (`student | teacher | contributor | main_contributor`), and public Contributor profile fields (name, title, avatar, bio, social links)]
- `curriculums`: [Global templates — IGCSE, SAT, etc.]
- `user_curriculums`: [Junction table mapping students to multiple curriculums]
- `topics` & `student_topics`: [Syllabus breakdown and localised confidence levels]
- `classrooms`: [Mapping class ID, teacher ID, and curriculum ID]
- `timetable_events`: [JSONB scheduling arrays]
- `flashcards` & `card_reviews`: [Spaced-repetition logic]
- `clubs`: [Club ID, creator (Contributor) ID, subject/curriculum link, join mode (invite/approval)]
- `club_members`: [Junction table mapping users to clubs, with membership status (pending/approved)]
- `club_messages`: [Chat messages within a club, with timestamp and sender ID]
- `club_announcements`: [Pinned announcements posted by club leaders]
- `club_links`: [Resource links shared within a club]
- `editor_submissions`: [Curriculum, notes, and exam data submissions from Contributors; includes `status` field (`draft | pending_review | approved | rejected`) updated by Main Contributors via the Review Queue]

> **Migration note:** The `profiles.role` column uses a PostgreSQL enum. The `main_contributor` value must be added via migration:
> ```sql
> ALTER TYPE user_role ADD VALUE 'main_contributor';
> ```
> RLS policies on `editor_submissions` must allow Main Contributors to `UPDATE` the `status` field.

---

## 7. Detailed Project Architecture & File Structure

This directory tree is the **absolute source of truth** for file placement. AI Agents and Developers must follow this structure exactly. Do not create new top-level directories without PM approval.

```text
the-ants/                                 # Project root
├── middleware.ts                         # 🔒 PM — Route protection + post-login role redirect
├── supabase/                             # 🔒 PM — Supabase CLI local config
│   ├── config.toml
│   ├── seed.sql                          # Dev seed data
│   └── migrations/                       # SQL migration files (version-controlled schema changes)
│
├── public/
│   ├── sounds/                           # 🔒 PPP — Pomodoro background music (mp3/ogg)
│   └── icons/                            # 🔒 PM — Exam board logos & app icons
│
└── src/
    ├── app/                              # Next.js 16 App Router (Server Components by default)
    │   ├── layout.tsx                    # 🔒 PM — Root layout (providers, global fonts, metadata)
    │   ├── page.tsx                      # 🔒 PM (TYZ) — Public landing / home page
    │   ├── not-found.tsx                 # 🔒 PM — Global 404 page
    │   │
    │   ├── (auth)/                       # 🔒 PM (TYZ) — Auth route group (no shell/nav bar)
    │   │   ├── login/
    │   │   │   └── page.tsx              # Login page
    │   │   └── signup/
    │   │       └── page.tsx              # Signup / role selection page (4 roles)
    │   │
    │   └── (app)/                        # Authenticated shell (Route Group — requires login)
    │       ├── layout.tsx                # 🔒 PM — App shell (NavBar wraps all authed routes)
    │       ├── loading.tsx               # 🔒 PM — Global skeleton loader
    │       │
    │       │   # ── Role Landing Pages (replaces dashboard) ──────────────────────────
    │       ├── student/
    │       │   └── page.tsx              # 🔒 PM — Student landing page (today snapshot, quick links)
    │       ├── teacher/
    │       │   └── page.tsx              # 🔒 PM — Teacher landing page (classroom summary, assignments)
    │       ├── contributor/
    │       │   └── page.tsx              # 🔒 PM — Contributor landing page (my submissions, club activity)
    │       ├── main-contributor/
    │       │   └── page.tsx              # 🔒 PM — Main Contributor landing (pending reviews count, activity)
    │       │
    │       │   # ── Feature Pages ────────────────────────────────────────────────────
    │       ├── timetable/
    │       │   └── page.tsx              # 🔒 PPP — Smart Timetable
    │       │
    │       ├── pomodoro/
    │       │   └── page.tsx              # 🔒 PPP — Pomodoro Timer
    │       │
    │       ├── flashcards/
    │       │   ├── page.tsx              # 🔒 ZLH — Deck library (browse & create)
    │       │   └── [deckId]/
    │       │       └── page.tsx          # 🔒 ZLH — Active study session for a deck
    │       │
    │       ├── lessons/
    │       │   └── page.tsx              # 🔒 BMK & ABC — Lesson Tracker
    │       │
    │       ├── courses/
    │       │   └── page.tsx              # 🔒 BMK & ABC — Course Manager
    │       │
    │       ├── classrooms/
    │       │   ├── page.tsx              # 🔒 BMK & ABC — Classroom list (join view for Students; manage view for Teachers)
    │       │   └── [id]/
    │       │       └── page.tsx          # 🔒 BMK & ABC — Individual classroom view
    │       │
    │       ├── clubs/
    │       │   ├── page.tsx              # 🔒 AKT — Club Discovery page (public listing)
    │       │   └── [id]/
    │       │       └── page.tsx          # 🔒 AKT — Individual club view (chat, announcements, links, members)
    │       │
    │       ├── countdown/
    │       │   └── page.tsx              # 🔒 ZLH — Exam Countdown manager
    │       │
    │       ├── calculator/
    │       │   └── page.tsx              # 🔒 AKT — Grade Calculator
    │       │
    │       │   # ── Contributor & Main Contributor Only ──────────────────────────────
    │       ├── editor/
    │       │   ├── page.tsx              # 🔒 BMK & ABC — Curriculum & Notes editor (Contributor+)
    │       │   └── exam/
    │       │       └── page.tsx          # 🔒 ZLH — Exam Data editor (Contributor+)
    │       │
    │       ├── review/
    │       │   └── page.tsx              # 🔒 PM — Gatekeeper / Review Queue (Main Contributor only)
    │       │
    │       └── profile/
    │           └── [username]/
    │               └── page.tsx          # 🔒 PM — Contributor public profile page (publicly accessible)
    │
    ├── components/                       # UI components ('use client' where interactive)
    │   ├── ui/                           # 🔒 PM — Shared atomic components
    │   │   ├── Button.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Input.tsx
    │   │   ├── Badge.tsx
    │   │   └── ProgressBar.tsx
    │   ├── layout/                       # 🔒 PM — Global shell components
    │   │   ├── NavBar.tsx                # Creative floating glassmorphism nav with grouped dropdowns
    │   │   └── AuthModal.tsx
    │   ├── auth/                         # 🔒 PM (TYZ) — Login & signup form components
    │   ├── profile/                      # 🔒 PM — Contributor public profile components
    │   ├── timetable/                    # 🔒 PPP
    │   ├── pomodoro/                     # 🔒 PPP
    │   ├── lessons/                      # 🔒 BMK & ABC
    │   ├── courses/                      # 🔒 BMK & ABC
    │   ├── classrooms/                   # 🔒 BMK & ABC
    │   ├── clubs/                        # 🔒 AKT
    │   ├── editor/                       # 🔒 BMK & ABC (Curriculum & Notes only)
    │   ├── exam-editor/                  # 🔒 ZLH (Exam Data editor components)
    │   ├── calculator/                   # 🔒 AKT
    │   ├── countdown/                    # 🔒 ZLH
    │   └── flashcards/                   # 🔒 ZLH
    │
    ├── hooks/                            # Custom React Hooks (logic only — no JSX)
    │   ├── useAuth.ts                    # 🔒 PM — Supabase auth session wrapper
    │   ├── useRole.ts                    # 🔒 PM — Read current persona from context (returns isStudent, isTeacher, isContributor, isMainContributor)
    │   ├── usePomodoro.ts                # 🔒 PPP — Timer state machine
    │   ├── useTimetable.ts               # 🔒 PPP — Drag-and-drop & view switching
    │   ├── useFlashcardSRS.ts            # 🔒 ZLH — SRS review scheduling interface
    │   ├── useClub.ts                    # 🔒 AKT — Club state & membership actions
    │   └── useCountdown.ts               # 🔒 ZLH — Exam date diff & urgency calc
    │
    ├── context/                          # Global React Context Providers
    │   ├── AuthContext.tsx               # 🔒 PM — Supabase session (required by all authed pages)
    │   ├── PersonaContext.tsx            # 🔒 PM — User Role State (student | teacher | contributor | main_contributor)
    │   └── TimerContext.tsx              # 🔒 PPP — Global Pomodoro state (survives navigation)
    │
    ├── actions/                          # Next.js Server Actions ('use server' — server-side mutations)
    │   ├── timetable.ts                  # 🔒 PPP
    │   ├── flashcards.ts                 # 🔒 ZLH
    │   ├── classrooms.ts                 # 🔒 BMK & ABC
    │   ├── clubs.ts                      # 🔒 AKT — Club CRUD, join/leave, messaging
    │   ├── editor.ts                     # 🔒 BMK & ABC — Curriculum & Notes submissions; PM adds review approve/reject logic
    │   └── exam-editor.ts                # 🔒 ZLH — Exam data CRUD & submission to review queue
    │
    ├── constants/                        # Static reference data (no logic — pure data)
    │   ├── qualifications.ts             # 🔒 PM — Exam boards, subjects, series (CAIE, Edexcel, OSSD…)
    │   ├── gradeBoundaries.ts            # 🔒 AKT — Official IGCSE/A-Level/IAL/OSSD boundary tables
    │   ├── timetable.ts                  # 🔒 PPP — Event type colours & repeat options
    │   └── pomodoro.ts                   # 🔒 PPP — Default intervals & music track manifest
    │
    ├── lib/                              # Infrastructure clients & utilities (🔒 PM)
    │   ├── supabase/
    │   │   ├── client.ts                 # Browser-side Supabase client (singleton)
    │   │   └── server.ts                 # Server-side Supabase client (for RSC & Server Actions)
    │   ├── mock/
    │   │   └── database.ts               # MVP Phase 1: Typed mock data facade (ALL features import from here)
    │   ├── srs/
    │   │   └── algorithm.ts              # SM-2 / FSRS spaced repetition core algorithm
    │   └── utils.ts                      # General helpers (cn, date formatting, grade conversion)
    │
    └── types/                            # TypeScript Definitions (🔒 PM)
        ├── index.ts                      # Shared app-wide types & interfaces (includes UserRole = 'student' | 'teacher' | 'contributor' | 'main_contributor')
        └── supabase.ts                   # Supabase CLI auto-generated DB types (prod transition)
```

---

## 8. Navigation Bar Architecture

The authenticated app shell uses a **single NavBar** component (`src/components/layout/NavBar.tsx`) replacing the previous Sidebar + TopNav pattern.

### Design
- **Style:** Creative floating pill-shaped bar with glassmorphism (frosted blur background, subtle glow borders)
- **Interaction:** Grouped dropdown menus on click/hover
- **Behaviour:** Role-aware — nav links render only for the roles that can access them

### Nav Groups & Role Visibility

| Group | Links | Student | Teacher | Contributor | Main Contributor |
|---|---|:---:|:---:|:---:|:---:|
| **Plan** | Timetable, Exam Countdown, Grade Calculator | ✅ | ✅ | ✅ | ✅ |
| **Study Tools** | Flashcards, Pomodoro Timer | ✅ | ✅ | ✅ | ✅ |
| **Learn** | Lesson Tracker, Course Manager | ✅ | ✅ | ✅ | ✅ |
| **Community** | Classrooms, Clubs | ✅ | ✅ | ✅ | ✅ |
| **Editor** | Curriculum & Notes Editor, Exam Data Editor | ❌ | ❌ | ✅ | ✅ |
| **Review** | Gatekeeper / Review Queue | ❌ | ❌ | ❌ | ✅ |
| **Profile** | My Contributor Profile | ❌ | ❌ | ✅ | ✅ |

> Classroom pages adapt their content by role: Students see a join/browse view; Teachers see a manage/create view.

### Post-Login Redirect (middleware.ts)
After a successful login, `middleware.ts` reads the session role and redirects:

| Role | Redirects to |
|---|---|
| `student` | `/student` |
| `teacher` | `/teacher` |
| `contributor` | `/contributor` |
| `main_contributor` | `/main-contributor` |

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
9. **No Dashboard Directory:** There is no `/dashboard` route. Role landing pages live at `/student`, `/teacher`, `/contributor`, and `/main-contributor` respectively.
