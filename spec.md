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
Privacy and access boundaries are strictly enforced. There are **four roles**. At signup, users can **only select `student`**. Other roles must be assigned by a `main_contributor` through role upgrade approval.

| Role | Who | What they can access |
|---|---|---|
| **Student** | Primary users | All personal study tools (Timetable, Pomodoro, Flashcards, Lesson Tracker, Course Manager, Exam Countdown, Grade Calculator), Classrooms (join), Clubs (join), public profile page |
| **Teacher** | Paid tier | Everything Student gets + create & manage Classrooms, issue Assignments, monitor student progress within their classrooms, Clubs (join & participate), public profile page |
| **Contributor** | Verified experts | Everything Teacher gets + Curriculum & Notes Editor, Exam Data Editor, lead Clubs, publicly visible Contributor Profile |
| **Main Contributor** | Senior verified experts | Everything Contributor gets + Gatekeeper Review Queue (approve, reject, or request revisions on Contributor submissions before they go public), approve/reject role upgrade requests, direct user promotion |

### Role Management Rules
- **Signup defaults to `student`.** No other role is selectable at registration.
- **Upgrade only.** Roles can only be upgraded (student → teacher → contributor → main_contributor). Downgrades are not permitted.
- **Upgrade request flow:** Users submit a role upgrade request. A `main_contributor` reviews and approves/rejects it.
- **Direct promotion:** Main contributors can also directly promote users without a prior request.
- **One account, one role.** An email can only hold a single role at any time.

---

## 3. Directory Isolation Boundaries
Developers are strictly confined to their designated workspace paths. You are prohibited from editing files outside your assigned directories. The **Project Manager (PM)** owns all shared infrastructure.

| Developer | Feature Ownership |
|---|---|
| `PPP` | Smart Timetable, Pomodoro Timer |
| `BMK` & `ABC` | Lesson Tracker, Course Manager, Curriculum & Notes Editor, Classrooms |
| `ZLH` | Flashcard Creator & Library, Exam Countdown, Exam Data Editor |
| `AKT` | Grade Calculator, Clubs |
| **PM (`TYZ`)** | Shared Infrastructure, Public Home Page, Login & Signup, Role Landing Pages, NavBar, Contributor Profiles, Review Queue, Explore Pages, Public Profiles, Role Upgrade System |

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

- `profiles`: [User metadata, role assignment (`student | teacher | contributor | main_contributor`), `is_public` (profile visibility toggle), `projects` (JSONB portfolio), `activities` (JSONB CCA entries), `achievements` (JSONB), and basic fields (name, avatar)]
- `contributor_profiles`: [Public Contributor profile fields (title, bio, social links, verification docs)]
- `curriculums`: [Global templates — IGCSE, SAT, etc.]
- `user_curriculums` & `user_subjects`: [Junction tables mapping students to selected curriculums and specific subjects]
- `topics` & `topic_progress`: [Syllabus breakdown and localised confidence levels]
- `classrooms` & `classroom_curriculums`: [Mapping class to teacher, and junction table supporting multiple curriculums per classroom]
- `timetable_events`: [JSONB scheduling arrays]
- `decks`, `cards` & `card_reviews`: [Flashcard deck organization and spaced-repetition logic]
- `clubs`, `club_subjects` & `club_curriculums`: [Club core data and junction tables linking clubs to specific subjects and curriculums]
- `club_members`: [Junction table mapping users to clubs, with membership status (pending/approved)]
- `club_messages`: [Chat messages within a club, with timestamp and sender ID]
- `club_announcements`: [Pinned announcements posted by club leaders]
- `club_links`: [Resource links shared within a club]
- `editor_submissions`: [Curriculum, notes, and exam data submissions from Contributors; includes `status` field (`draft | pending_review | approved | rejected`) updated by Main Contributors via the Review Queue]
- `role_upgrade_requests`: [Tracks upgrade requests from users. Fields: `user_id`, `current_role`, `requested_role`, `reason`, `status` (`pending | approved | rejected`), `reviewer_id`, timestamps]
- `notes`: [Core notes content. Fields: `id`, `title`, `summary`, `curriculum_id`, `subject_id`, `topic_id`, `syllabus_point`, `is_syllabus_based`, `tags` (array), `contributor_id`, `status`, `visibility`, `reviewer_id`, `reviewer_feedback`, `created_at`, `updated_at`, `blocks` (JSONB NoteBlock array)]
- `user_saved_notes`: [Junction table for bookmarking. Fields: `id`, `user_id`, `note_id`, `saved_at`]

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
├── middleware.ts                         # 🔒 PM — Route protection + post-login redirect to /dashboard
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
    │   ├── globals.css                   # 🔒 PM — Global Tailwind CSS v4 styles & design tokens
    │   ├── page.tsx                      # 🔒 PM (TYZ) — Public landing / home page (includes Explore section)
    │   ├── not-found.tsx                 # 🔒 PM — Global 404 page
    │   │
    │   ├── (auth)/                       # 🔒 PM (TYZ) — Auth route group (no shell/nav bar)
    │   │   ├── login/
    │   │   │   └── page.tsx              # Login page
    │   │   └── signup/
    │   │       └── page.tsx              # Signup page (defaults to student role only)
    │   │
    │   ├── (public)/                     # Public routes (no auth required)
    │   │   ├── explore/
    │   │   │   ├── clubs/
    │   │   │   │   └── page.tsx          # 🔒 PM — Public club discovery (browse all clubs)
    │   │   │   └── profiles/
    │   │   │       └── page.tsx          # 🔒 PM — Public profile listing (with role filters)
    │   │   ├── clubs/
    │   │   │   └── [id]/
    │   │   │       └── page.tsx          # 🔒 PM — Public club detail view
    │   │   └── profile/
    │   │       └── [username]/
    │   │           └── page.tsx          # 🔒 PM — Public profile page (all roles: student, teacher, contributor, main_contributor)
    │   │
    │   └── (app)/                        # Authenticated shell (Route Group — requires login)
    │       ├── layout.tsx                # 🔒 PM — App shell (NavBar wraps all authed routes)
    │       ├── loading.tsx               # 🔒 PM — Global skeleton loader
    │       │
    │       │   # ── Unified Dashboard (role-aware, single entry point) ────────────────
    │       ├── dashboard/
    │       │   └── page.tsx              # 🔒 PM — Unified role-aware dashboard
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
    │       ├── library/
    │       │   ├── page.tsx              # Notes Library (All Roles)
    │       │   ├── saved/
    │       │   │   └── page.tsx          # Selected Notes catalog (All Roles)
    │       │   └── [noteId]/
    │       │       └── page.tsx          # Standalone note viewer (All Roles)
    │       │
    │       ├── classrooms/
    │       │   ├── page.tsx              # 🔒 BMK & ABC — Classroom list
    │       │   └── [id]/
    │       │       └── page.tsx          # 🔒 BMK & ABC — Individual classroom view
    │       │
    │       ├── clubs/
    │       │   ├── page.tsx              # 🔒 AKT — Club Discovery page (authenticated)
    │       │   └── [id]/
    │       │       └── page.tsx          # 🔒 AKT — Individual club view (with feature toggle support)
    │       │
    │       ├── countdown/
    │       │   └── page.tsx              # 🔒 ZLH — Exam Countdown manager
    │       │
    │       ├── calculator/
    │       │   └── page.tsx              # 🔒 AKT — Grade Calculator
    │       │
    │       ├── settings/
    │       │   └── page.tsx              # 🔒 PM — User settings (profile editor, role upgrade request, visibility toggle)
    │       │
    │       │   # ── Contributor & Main Contributor Only ──────────────────────────────
    │       ├── editor/
    │       │   ├── page.tsx              # 🔒 BMK & ABC — Curriculum editor (Contributor+)
    │       │   ├── notes/
    │       │   │   └── page.tsx          # Split-screen Notes Editor workspace (All Roles — for personal notes, only Contributors can submit to library)
    │       │   └── exam/
    │       │       └── page.tsx          # 🔒 ZLH — Exam Data editor (Contributor+)
    │       │
    │       ├── review/
    │       │   └── page.tsx              # 🔒 PM — Gatekeeper / Review Queue (Main Contributor only)
    │       │
    │       ├── main-contributor/
    │       │   ├── add-contributor/
    │       │   │   └── page.tsx          # 🔒 PM — Add Contributor invite flow (Main Contributor only)
    │       │   └── role-upgrades/
    │       │       └── page.tsx          # 🔒 PM — Role upgrade request review (Main Contributor only)
    │       │
    │       └── profile/
    │           └── [username]/
    │               └── page.tsx          # 🔒 PM — Authenticated user profile view/edit page
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
    │   ├── settings/                     # 🔒 PM — Settings page components
    │   │   ├── ProfileEditor.tsx          # Inline editable profile form (includes projects, activities, achievements)
    │   │   ├── RoleUpgradeForm.tsx         # Role upgrade request form
    │   │   └── ProfileVisibilityToggle.tsx # Public/private profile toggle
    │   ├── profile/                      # 🔒 PM — Public profile components
    │   │   ├── ProfileHero.tsx            # Hero banner with avatar, bio, role badge
    │   │   ├── ProfileProjects.tsx        # Project showcase grid
    │   │   ├── ProfileActivities.tsx      # CCA/activities timeline
    │   │   ├── ProfileAchievements.tsx    # Achievements & awards
    │   │   └── ProfileStats.tsx           # Stat cards (published count, views)
    │   ├── contributor-manager/          # 🔒 PM — Add-contributor invite flow components
    │   │   ├── InviteStep.tsx
    │   │   ├── VerifyStep.tsx
    │   │   ├── ProfileStep.tsx
    │   │   ├── SuccessStep.tsx
    │   │   └── StepProgress.tsx
    │   ├── explore/                      # 🔒 PM — Public explore page components
    │   │   ├── ClubCard.tsx              # Club listing card
    │   │   └── ProfileCard.tsx           # Public profile listing card
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
    │   ├── flashcards/                   # 🔒 ZLH
    │   └── notes/                        # Notes features (library, preview, editor, AI wizard, reader drawer)
    │       ├── AIPromptGenerator.tsx
    │       ├── AnimationBlock.tsx
    │       ├── BlockEditor.tsx
    │       ├── BlockPreview.tsx
    │       ├── NoteCard.tsx
    │       ├── NoteFilters.tsx
    │       ├── NoteReaderModal.tsx
    │       ├── NoteSubmitModal.tsx
    │       ├── NoteViewer.tsx
    │       ├── NotesEditor.tsx
    │       ├── NotesLibrary.tsx
    │       └── SavedNotesLibrary.tsx
    │
    ├── hooks/                            # Custom React Hooks (logic only — no JSX)
    │   ├── useAuth.ts                    # 🔒 PM — Supabase auth session wrapper (includes updateProfile, requestRoleUpgrade)
    │   ├── useRole.ts                    # 🔒 PM — Read current persona from context (returns isStudent, isTeacher, isContributor, isMainContributor)
    │   ├── useProfile.ts                 # 🔒 PM — Public profile data fetcher by username
    │   ├── useContributorManager.ts      # 🔒 PM — Multi-step contributor invite flow state machine
    │   ├── usePomodoro.ts                # 🔒 PPP — Timer state machine
    │   ├── useTimetable.ts               # 🔒 PPP — Drag-and-drop & view switching
    │   ├── useFlashcardSRS.ts            # 🔒 ZLH — SRS review scheduling interface
    │   ├── useClub.ts                    # 🔒 AKT — Club state & membership actions
    │   ├── useCountdown.ts               # 🔒 ZLH — Exam date diff & urgency calc
    │   └── useNotes.ts                   # Custom hook for Notes Library, saving, and Editor state machine
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
    │   ├── clubs.ts                      # 🔒 AKT — Club CRUD, join/leave, messaging, feature toggles
    │   ├── editor.ts                     # 🔒 BMK & ABC — Curriculum & Notes submissions; PM adds review approve/reject logic
    │   ├── exam-editor.ts                # 🔒 ZLH — Exam data CRUD & submission to review queue
    │   ├── roles.ts                      # 🔒 PM — Role upgrade request & approval actions
    │   └── notes.ts                      # Server actions for Notes feature (save/unsave/submit/review)
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
        ├── index.ts                      # Shared app-wide types & interfaces (includes UserRole, Profile, Club, ClubFeature, RoleUpgradeRequest, ProjectEntry, ActivityEntry, AchievementEntry)
        └── supabase.ts                   # Supabase CLI auto-generated DB types (prod transition)
```

---

## 8. Navigation Bar Architecture

The authenticated app shell uses a **single NavBar** component (`src/components/layout/NavBar.tsx`) replacing the previous Sidebar + TopNav pattern.

### Design
- **Style:** Creative floating pill-shaped bar with glassmorphism (frosted blur background, subtle glow borders)
- **Interaction:** Grouped dropdown menus on click/hover
- **Behaviour:** Role-aware — nav links render only for the roles that can access them. The public home page also includes "Clubs" and "Profiles" links for unauthenticated visitors.

### Nav Groups & Role Visibility

| Group | Links | Student | Teacher | Contributor | Main Contributor |
|---|---|---|---|:---:|:---:|:---:|
| **Plan** | Timetable, Exam Countdown, Grade Calculator | ✅ | ✅ | ✅ | ✅ |
| **Study Tools** | Flashcards, Pomodoro Timer | ✅ | ✅ | ✅ | ✅ |
| **Learn** | Lesson Tracker, Course Manager, Notes Library, Notes Editor, Selected Notes | ✅ | ✅ | ✅ | ✅ |
| **Community** | Classrooms, Clubs | ✅ | ✅ | ✅ | ✅ |
| **Editor** | Curriculum Editor, Exam Data Editor | ❌ | ❌ | ✅ | ✅ |
| **Review** | Gatekeeper / Review Queue, Role Upgrade Requests | ❌ | ❌ | ❌ | ✅ |
| **Profile** | My Public Profile | ✅ | ✅ | ✅ | ✅ |

> Classroom pages adapt their content by role: Students see a join/browse view; Teachers see a manage/create view.

### Public Nav Links (visible on the home page without login)
- Clubs → `/explore/clubs`
- Profiles → `/explore/profiles`

### Post-Login Redirect (middleware.ts)
After a successful login, `middleware.ts` redirects all roles to the unified dashboard:

| Role | Redirects to |
|---|---|
| `student` | `/dashboard` |
| `teacher` | `/dashboard` |
| `contributor` | `/dashboard` |
| `main_contributor` | `/dashboard` |

The dashboard page itself uses `useRole()` to render role-appropriate stats, quick links, and widgets.

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
9. **Role Upgrade Constraint:** Users always sign up as `student`. Role upgrades require `main_contributor` approval. No downgrades are permitted.
10. **Public Profile Fields:** All profiles now support `isPublic`, `projects`, `activities`, and `achievements` fields. Club pages support `enabled_features` toggling.