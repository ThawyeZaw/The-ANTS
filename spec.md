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
| **Teacher** | Paid tier | Everything Student gets + create & manage Classrooms, issue Assignments & Quizzes, monitor student progress within their classrooms, Clubs (join & participate), public profile page |
| **Contributor** | Verified experts | Everything Teacher gets + Curriculum & Notes Editor, Exam Data Editor, create & lead Clubs, publicly visible Contributor Profile |
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

> *"You are building inside my isolated feature folder under `src/components/[Your-Feature-Folder]/`. You must respect the project architecture constraints detailed in `spec.md`, use the database typing declarations in `types/index.ts`, and pull data operations exclusively through our shared study-data mock database facade at `src/lib/mock/database.ts`. Do not invent custom database properties, unmapped relational paths, or arbitrary styling elements (e.g. hardcoded pixels like `p-[13px]`) that cause utility bloat. If this module relies on user interactions, build it as a Next.js Client Component starting with the `'use client'` directive. The app uses four roles: `student`, `teacher`, `contributor`, `main_contributor` — use `useRole()` from `src/hooks/useRole.ts` for any role-gated logic."*

---

## 6. Database Schema Map

The full PostgreSQL schema is maintained in [`schema.md`](./schema.md) — the single source of truth for all table definitions, column types, constraints, and JSONB structures.

**Key tables referenced across features:**

- `profiles`: User metadata, role assignment, profile visibility, portfolio JSONB fields
- `contributor_profiles`: Public Contributor profile fields
- `curriculums`, `subjects`, `topics`: Curriculum hierarchy
- `user_curriculums`, `topic_progress`: Student curriculum tracking
- `classrooms`, `classroom_members`, `classroom_curriculums`: Virtual classroom management
- `assignments`, `assignment_submissions`: Assignment lifecycle (draft → published → closed)
- `quizzes`, `quiz_attempts`: Quiz lifecycle with manual + AI generation
- `discussion_topics`, `discussion_replies`: Classroom discussions
- `classroom_resources`: Typed resource sharing (pdf, video, document, link, image)
- `clubs`, `club_members`, `club_messages`, `club_announcements`, `club_links`, `club_join_requests`: Club ecosystem
- `timetable_events`: JSONB scheduling arrays
- `decks`, `cards`, `card_reviews`: Flashcard SRS
- `exams`, `exam_countdowns`, `grade_boundaries`, `grade_entries`: Exam & grading
- `notes`, `user_saved_notes`: Notes feature with block editor
- `editor_submissions`: Contributor submission review queue
- `role_upgrade_requests`: Role upgrade workflow

---

## 7. Detailed Project Architecture & File Structure

This directory tree is the **absolute source of truth** for file placement. AI Agents and Developers must follow this structure exactly. Do not create new top-level directories without PM approval.

```text
the-ants/                                 # Project root
├── middleware.ts                         # 🔒 PM — Route protection + post-login redirect to /dashboard
├── spec.md                               # 🔒 PM — System specification (this file)
├── schema.md                             # 🔒 PM — Database schema reference
├── README.md                             # 🔒 PM — Project README
├── supabase/                             # 🔒 PM — Supabase CLI local config
│   ├── config.toml
│   ├── seed.sql                          # Dev seed data
│   └── migrations/                       # SQL migration files
│
├── public/
│   ├── sounds/                           # 🔒 PPP — Pomodoro background music (mp3/ogg)
│   └── icons/                            # 🔒 PM — Exam board logos & app icons
│
└── src/
    ├── app/                              # Next.js App Router (Server Components by default)
    │   ├── layout.tsx                    # 🔒 PM — Root layout (providers, global fonts, metadata)
    │   ├── globals.css                   # 🔒 PM — Global Tailwind CSS v4 styles & design tokens
    │   ├── page.tsx                      # 🔒 PM (TYZ) — Public landing / home page
    │   ├── not-found.tsx                 # 🔒 PM — Global 404 page
    │   │
    │   ├── (auth)/                       # 🔒 PM (TYZ) — Auth route group
    │   │   ├── login/page.tsx
    │   │   └── signup/page.tsx
    │   │
    │   ├── (public)/                     # Public routes (no auth required)
    │   │   ├── explore/
    │   │   │   ├── clubs/page.tsx        # 🔒 PM — Public club discovery
    │   │   │   └── profiles/page.tsx     # 🔒 PM — Public profile listing
    │   │   ├── clubs/                    # 🔒 PM
    │   │   │   └── [id]/page.tsx
    │   │   └── profile/
    │   │       └── [username]/page.tsx   # 🔒 PM — Public profile page
    │   │
    │   └── (app)/                        # Authenticated shell
    │       ├── layout.tsx                # 🔒 PM — App shell (NavBar wraps all authed routes)
    │       ├── loading.tsx               # 🔒 PM — Global skeleton loader
    │       │
    │       ├── dashboard/page.tsx        # 🔒 PM — Unified role-aware dashboard
    │       ├── timetable/page.tsx        # 🔒 PPP
    │       ├── pomodoro/page.tsx         # 🔒 PPP
    │       ├── flashcards/
    │       │   ├── page.tsx              # 🔒 ZLH — Deck library
    │       │   └── [deckId]/page.tsx     # 🔒 ZLH — Study session
    │       ├── lessons/page.tsx          # 🔒 BMK & ABC — Lesson Tracker
    │       ├── courses/page.tsx          # 🔒 BMK & ABC — Course Manager
    │       ├── library/
    │       │   ├── page.tsx              # Notes Library (All Roles)
    │       │   ├── saved/page.tsx        # Saved Notes catalog
    │       │   └── [noteId]/page.tsx     # Standalone note viewer
    │       ├── my-notes/page.tsx         # My Notes hub
    │       ├── classrooms/
    │       │   ├── page.tsx              # 🔒 BMK & ABC — Classroom list
    │       │   └── [id]/page.tsx         # 🔒 BMK & ABC — Classroom detail (tabs: assignments, quizzes, resources, discussions, links, members, settings)
    │       ├── clubs/
    │       │   ├── page.tsx              # 🔒 AKT — Club Discovery
    │       │   └── [id]/page.tsx         # 🔒 AKT — Club detail with feature toggles
    │       ├── countdown/page.tsx        # 🔒 ZLH — Exam Countdown
    │       ├── calculator/page.tsx       # 🔒 AKT — Grade Calculator
    │       ├── settings/page.tsx         # 🔒 PM — User settings
    │       ├── editor/
    │       │   ├── page.tsx              # 🔒 BMK & ABC — Curriculum editor
    │       │   ├── notes/page.tsx        # Split-screen Notes Editor
    │       │   └── exam/page.tsx         # 🔒 ZLH — Exam Data editor
    │       ├── review/page.tsx           # 🔒 PM — Review Queue (Main Contributor only)
    │       ├── main-contributor/
    │       │   ├── add-contributor/page.tsx
    │       │   └── role-upgrades/page.tsx
    │       └── profile/
    │           └── [username]/page.tsx   # 🔒 PM — Authenticated user profile
    │
    ├── components/                       # UI components
    │   ├── ui/                           # 🔒 PM — Shared atomic components
    │   │   ├── Button.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Input.tsx
    │   │   ├── Badge.tsx
    │   │   └── ProgressBar.tsx
    │   ├── layout/                       # 🔒 PM — Global shell
    │   │   ├── NavBar.tsx                # Creative floating glassmorphism nav with scroll-hide behavior
    │   │   └── AuthModal.tsx
    │   ├── auth/                         # 🔒 PM — Login & signup forms
    │   ├── settings/                     # 🔒 PM
    │   │   ├── ProfileEditor.tsx
    │   │   ├── RoleUpgradeForm.tsx
    │   │   └── RoleSwitcher.tsx
    │   ├── profile/                      # 🔒 PM — Public profile components
    │   │   ├── ProfileHero.tsx
    │   │   ├── ProfileProjects.tsx
    │   │   ├── ProfileActivity.tsx
    │   │   ├── ProfileAchievements.tsx
    │   │   └── ProfileStats.tsx
    │   ├── contributor-manager/          # 🔒 PM
    │   │   ├── InviteStep.tsx
    │   │   ├── VerifyStep.tsx
    │   │   ├── ProfileStep.tsx
    │   │   ├── SuccessStep.tsx
    │   │   └── StepProgress.tsx
    │   ├── explore/                      # 🔒 PM
    │   │   ├── ClubCard.tsx
    │   │   └── ProfileCard.tsx
    │   ├── timetable/                    # 🔒 PPP
    │   ├── pomodoro/                     # 🔒 PPP
    │   ├── lessons/                      # 🔒 BMK & ABC
    │   ├── courses/                      # 🔒 BMK & ABC
    │   ├── classrooms/                   # 🔒 BMK & ABC
    │   │   ├── ClassroomCard.tsx         # Card shown in classroom grid
    │   │   ├── ClassroomList.tsx         # Main classroom list page
    │   │   ├── ClassroomDetail.tsx       # Classroom detail with tabs, search, feedback
    │   │   ├── ClassroomJoinModal.tsx    # Join classroom by invite code modal
    │   │   ├── CreateClassroomModal.tsx  # Create classroom modal (teachers)
    │   │   ├── AssignmentsPanel.tsx      # Assignment CRUD with grading
    │   │   ├── QuizzesPanel.tsx          # Quiz list, preview, take, results
    │   │   ├── QuizCreator.tsx           # Quiz creation wizard (manual + AI)
    │   │   ├── QuizTakeModal.tsx         # Full-screen quiz taking modal
    │   │   ├── ResourcesPanel.tsx        # Resource browsing with add/edit/delete
    │   │   ├── DiscussionsPanel.tsx      # Discussion topics + replies
    │   │   ├── LinksPanel.tsx            # Quick link sharing
    │   │   ├── MembersPanel.tsx          # Member list with roles
    │   │   └── SettingsPanel.tsx         # Classroom settings (teachers)
    │   ├── clubs/                        # 🔒 AKT
    │   ├── editor/                       # 🔒 BMK & ABC
    │   ├── exam-editor/                  # 🔒 ZLH
    │   ├── calculator/                   # 🔒 AKT
    │   ├── countdown/                    # 🔒 ZLH
    │   ├── flashcards/                   # 🔒 ZLH
    │   └── notes/                        # Notes features
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
    │       ├── MyNotesLibrary.tsx
    │       └── SavedNotesLibrary.tsx
    │
    ├── hooks/                            # Custom React Hooks
    │   ├── useAuth.ts                    # 🔒 PM — Auth session wrapper
    │   ├── useRole.ts                    # 🔒 PM — Role-aware persona context
    │   ├── useProfile.ts                 # 🔒 PM — Public profile fetcher
    │   ├── useContributorManager.ts      # 🔒 PM — Multi-step invite flow
    │   ├── usePomodoro.ts                # 🔒 PPP
    │   ├── useTimetable.ts               # 🔒 PPP
    │   ├── useFlashcardSRS.ts            # 🔒 ZLH
    │   ├── useClub.ts                    # 🔒 AKT
    │   ├── useClassroom.ts               # 🔒 BMK & ABC — Classroom state (CRUD, assignments, quizzes, discussions, resources)
    │   ├── useCountdown.ts               # 🔒 ZLH
    │   └── useNotes.ts                   # Notes library + editor state
    │
    ├── context/                          # Global React Context Providers
    │   ├── AuthContext.tsx               # 🔒 PM — Supabase session
    │   ├── PersonaContext.tsx            # 🔒 PM — User Role State
    │   └── TimerContext.tsx              # 🔒 PPP — Global Pomodoro state
    │
    ├── actions/                          # Next.js Server Actions
    │   ├── timetable.ts                  # 🔒 PPP
    │   ├── flashcards.ts                 # 🔒 ZLH
    │   ├── classrooms.ts                 # 🔒 BMK & ABC
    │   ├── clubs.ts                      # 🔒 AKT
    │   ├── editor.ts                     # 🔒 BMK & ABC
    │   ├── exam-editor.ts                # 🔒 ZLH
    │   ├── roles.ts                      # 🔒 PM
    │   └── notes.ts                      # Notes server actions
    │
    ├── constants/                        # Static reference data
    │   ├── qualifications.ts             # 🔒 PM — Exam boards, subjects, series
    │   ├── gradeBoundaries.ts            # 🔒 AKT — Official boundary tables
    │   ├── timetable.ts                  # 🔒 PPP
    │   └── pomodoro.ts                   # 🔒 PPP
    │
    ├── lib/                              # Infrastructure clients & utilities (🔒 PM)
    │   ├── supabase/
    │   │   ├── client.ts                 # Browser-side Supabase client
    │   │   └── server.ts                 # Server-side Supabase client
    │   ├── mock/
    │   │   └── database.ts               # MVP: Typed mock data facade (ALL features import from here)
    │   ├── srs/
    │   │   └── algorithm.ts              # SM-2 / FSRS core algorithm
    │   ├── quiz-ai.ts                    # Quiz AI prompt generator & response parser
    │   └── utils.ts                      # General helpers (cn, date formatting, getInitials, generateUsername)
    │
    └── types/                            # TypeScript Definitions (🔒 PM)
        ├── index.ts                      # Shared app-wide types & interfaces
        └── supabase.ts                   # Supabase CLI auto-generated DB types
```

---

## 8. Navigation Bar Architecture

The authenticated app shell uses a **single NavBar** component (`src/components/layout/NavBar.tsx`).

### Design
- **Style:** Creative floating pill-shaped bar with glassmorphism (frosted blur background, subtle glow borders)
- **Interaction:** Grouped dropdown menus on click/hover
- **Behaviour:** Role-aware — nav links render only for the roles that can access them.
- **Scroll Hide:** NavBar hides on scroll down (after 80px threshold) with `-translate-y-full` transition (300ms), and reappears on scroll up. Uses `requestAnimationFrame` throttling.

### Nav Groups & Role Visibility

| Group | Links | Student | Teacher | Contributor | Main Contributor |
|---|---|---|---|:---:|:---:|:---:|
| **Plan** | Timetable, Exam Countdown, Grade Calculator | ✅ | ✅ | ✅ | ✅ |
| **Study Tools** | Flashcards, Pomodoro Timer | ✅ | ✅ | ✅ | ✅ |
| **Learn** | Lesson Tracker, Course Manager, Notes Library, Notes Editor, My Notes | ✅ | ✅ | ✅ | ✅ |
| **Community** | Classrooms, Clubs | ✅ | ✅ | ✅ | ✅ |
| **Editor** | Curriculum Editor, Exam Data Editor | ❌ | ❌ | ✅ | ✅ |
| **Review** | Gatekeeper / Review Queue, Role Upgrade Requests | ❌ | ❌ | ❌ | ✅ |
| **Profile** | My Public Profile | ✅ | ✅ | ✅ | ✅ |

### Post-Login Redirect (middleware.ts)
All roles redirect to `/dashboard` after login. The dashboard uses `useRole()` to render role-appropriate content.

---

## 9. Classrooms Feature — Detailed Specification

### 9.1 Overview
Classrooms are virtual learning spaces where **teachers** can manage courses and **students** can participate. The system supports multiple teachers per classroom with a `teacher`/`student` role model.

### 9.2 Feature Toggles
Each classroom has an `enabled_features` JSONB array controlling which tabs are visible:
- `assignments` (default: enabled)
- `quizzes` (default: disabled)
- `resources` (default: enabled)
- `discussions` (default: disabled)
- `links` (default: disabled)

### 9.3 Classroom Tabs

| Tab | Description | Teacher Actions | Student Actions |
|---|---|---|---|
| **Assignments** | Full lifecycle: create draft → publish → student submits → teacher grades | Create, edit, publish, delete, view submissions, grade | Submit work, view grades |
| **Quizzes** | Manual + AI-powered quiz creation | Create (manual/AI), edit (draft only), publish, delete, take quiz to test | Take quiz, view results |
| **Resources** | Typed resource library (pdf/video/document/link/image) | Add, edit, delete own resources | View only |
| **Discussions** | Topic-based discussion threads with pin/lock | Create topics, reply, edit/delete own topics | Create topics, reply |
| **Links** | Quick link sharing | Add, edit, delete own links | View only |
| **Members** | Member directory | View all, remove members | View all |
| **Settings** | Classroom configuration | Edit name/description/invite code, manage feature toggles | (not visible) |

### 9.4 Assignments
- States: `draft` → `published` → `closed`
- Fields: title, description, due_date, priority (low/medium/high), total_points, attachment_urls
- Teachers: create draft, edit (any state), publish, delete (creators only)
- Students: submit text content, view grade + feedback
- Grading: numeric score + feedback text

### 9.5 Quizzes
- States: `draft` → `published` → `closed`
- Question types: `multiple_choice`, `true_false`, `short_answer`
- Quiz creation: Manual question editor (add/reorder/delete questions) or AI generator (configure → copy prompt → paste LLM response → parse into questions)
- Editing: only while in `draft` status; can modify/delete/add questions
- Taking: full-screen modal overlay; all questions shown at once; submit when all answered
- Results: score card with percentage, per-question review (correct/incorrect), correct answers shown after submission
- Retake: allowed; replaces previous attempt
- Teachers can take their own quizzes to test them

### 9.6 Discussions
- Topics: title + content, creator can edit/delete
- Moderation: pin/lock topic flags
- Replies: threaded per topic, text-only
- Locked topics: cannot reply, only view

### 9.7 Resources & Links
- Resources typed as: pdf, video, document, link, image
- Creator-only edit/delete for both resources and links
- Links stored as `ClassroomResource` with `type: 'link'`

### 9.8 Search
- Global search bar in classroom detail page
- Filters across all visible tabs (assignments, quizzes, discussions, resources, links)
- Matches against title and description fields

### 9.9 Classroom Permissions
- **Teachers**: create classrooms, manage settings, toggle features, create/edit/grade assignments, create/edit/publish quizzes, create resources & links
- **Students**: join by invite code, submit assignments, take quizzes, participate in discussions
- **Creator rules**: edit/delete operations on assignments, quizzes, discussions, resources, and links are limited to the user who created them

---

## 10. Clubs Feature — Detailed Specification

### 10.1 Club Roles
- **Admin**: creator/full control — can modify club details, manage features, promote/demote members
- **Moderator**: can post announcements, share links, help manage members
- **Member**: regular participant — chat, display in member list

### 10.2 Feature Toggles
Each club has `enabled_features` with `enabled` + `public_visible` flags:
- `chat` — Real-time messaging
- `announcements` — Pinned leader posts
- `links` — Resource sharing
- `members` — Member directory
- `projects` — Project showcase
- `activity_timeline` — Upcoming events
- `leaderboard` — Member rankings

### 10.3 Join Modes
- `open`: Anyone can join
- `invite_link`: Requires invite code
- `approval_based`: Admin must approve request

### 10.4 Permission Rules
- Only admins can modify club details and manage feature visibility
- Leaders (admins + moderators) can post announcements and share links
- Regular members restricted to chat and member-list display

---

## 11. AI Agent Directives for File Structure

1. **The Next.js Boundary Rule:** Files inside `src/app/` must be lightweight page shells. All state, logic, and complex UI belongs in `src/components/` (with `'use client'`) or `src/hooks/`.
2. **Strict Component Colocation:** Never put feature-specific components into `src/components/ui/`.
3. **Mock Data Isolation:** Never hardcode mock arrays inside component files. Always import from `src/lib/mock/database.ts`.
4. **Hook Ownership:** Never write stateful logic directly in page files. Extract it into a named hook in `src/hooks/`.
5. **Constants Are Not Components:** Grade boundaries, colour maps, and qualification lists go in `src/constants/`.
6. **Server Actions Live in `src/actions/`:** Never define a `'use server'` function inside a component file.
7. **Styling Consistency:** Use Tailwind CSS v4 utility classes with CSS custom properties (`var(--foreground)`, `var(--primary)`, `var(--border)`, etc.). Use `lucide-react` for all icons.
8. **Respect 🔒 Ownership:** Do not create, edit, or delete files marked with another developer's lock.
9. **Role Upgrade Constraint:** Users always sign up as `student`. Role upgrades require `main_contributor` approval.
