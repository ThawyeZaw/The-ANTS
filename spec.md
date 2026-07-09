# The ANTs — System Specification & Integration Manifest (`spec.md`)

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
- **JWT Role Claim:** On signup and role upgrade, a Supabase `custom_access_token` hook embeds the user's role as a `user_role` JWT claim. The `useRole()` hook reads this claim instead of querying the database on every request, eliminating redundant auth queries.

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
7. **RLS-Aware Data Access:** All database queries must account for Row-Level Security policies. Never use `SUPABASE_SERVICE_ROLE_KEY` in client code. Role elevation (e.g., admin overrides) must go through server-side helper functions in `src/lib/supabase/server.ts`, never through client-side `select('*')` with override flags.

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
- `clubs`, `club_members`, `club_messages`, `club_announcements`, `club_links`, `club_join_requests`, `club_projects`, `club_events`: Club ecosystem
- `pomodoro_sessions`: Pomodoro timer session history
- `version_history`: Immutable change snapshots for curriculum/notes/exam edits
- `review_queue`: Main contributor review queue for pending submissions
- `user_enrollments`: User curriculum/subject enrolment junction
- `user_exam_overrides`: User-specific exam date/title overrides
- `user_exam_history`: Completed exam records archive
- `club_curriculums`: Club-curriculum association
- `club_subjects`: Club-subject association
- `student_profiles`: Extended student metadata (target exam year, study goals)
- `teacher_profiles`: Extended teacher metadata (institution, verification)
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
├── design-system/                        # 🔒 PM — Design system documentation (color palette, typography, components, accessibility, etc.)
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
    │   │   ├── error.tsx                 # 🔒 PM — Auth route group error boundary
    │   │   ├── login/page.tsx
    │   │   └── signup/page.tsx
    │   │
    │   ├── (public)/                     # Public routes (no auth required)
    │   │   ├── error.tsx                 # 🔒 PM — Public route group error boundary
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
    │       ├── loading.tsx               # 🔒 PM — Global app skeleton loader
    │       ├── error.tsx                 # 🔒 PM — App route group error boundary
    │       │
    │       ├── dashboard/page.tsx        # 🔒 PM — Unified role-aware dashboard
    │       ├── timetable/page.tsx        # 🔒 PPP
    │       ├── pomodoro/page.tsx         # 🔒 PPP
    │       ├── flashcards/
    │       │   ├── page.tsx              # 🔒 ZLH — Deck library
    │       │   ├── loading.tsx           # 🔒 ZLH — Deck library skeleton
    │       │   └── [deckId]/page.tsx     # 🔒 ZLH — Study session + RelatedContent
    │       ├── lessons/page.tsx          # 🔒 BMK & ABC — Lesson Tracker
    │       ├── courses/page.tsx          # 🔒 BMK & ABC — Course Manager
    │       ├── library/
    │       │   ├── page.tsx              # Notes Library (All Roles)
    │       │   └── [noteId]/page.tsx     # Standalone note viewer + RelatedContent
    │       ├── my-notes/
    │       │   ├── page.tsx              # My Notes hub (created + saved)
    │       │   └── loading.tsx           # My Notes skeleton
    │       ├── classrooms/
    │       │   ├── page.tsx              # 🔒 BMK & ABC — Classroom list
    │       │   ├── loading.tsx           # 🔒 BMK & ABC — Classroom list skeleton
    │       │   └── [id]/page.tsx         # 🔒 BMK & ABC — Classroom detail (tabs: assignments, quizzes, resources, discussions, links, members, settings)
    │       ├── clubs/
    │       │   ├── page.tsx              # 🔒 AKT — Club Discovery
    │       │   ├── loading.tsx           # 🔒 AKT — Club Discovery skeleton
    │       │   └── [id]/page.tsx         # 🔒 AKT — Club detail (tabs: chat, announcements, links, members, projects, activity_timeline)
    │       ├── countdown/
    │       │   ├── page.tsx              # 🔒 ZLH — Exam Countdown
    │       │   └── loading.tsx           # 🔒 ZLH — Exam Countdown skeleton
    │       ├── calculator/page.tsx       # 🔒 AKT — Grade Calculator
    │       ├── settings/
    │       │   ├── page.tsx              # 🔒 PM — User settings
    │       │   ├── loading.tsx           # 🔒 PM — Settings skeleton
    │       │   └── profile/
    │       │       ├── page.tsx          # 🔒 PM — Profile editor
    │       │       └── loading.tsx       # 🔒 PM — Profile editor skeleton
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
    │   ├── homepage/                     # 🔒 PM (TYZ) — Public landing page components (RevealSection, BentoFeatures, HeroVisual, QualTrail, QualCarousel, RoleLadder, StatsRow, DotGrid, HomepageFonts)
    │   ├── ui/                           # 🔒 PM — Shared atomic components
    │   │   ├── Button.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Input.tsx
    │   │   ├── Badge.tsx
    │   │   ├── ProgressBar.tsx
    │   │   ├── BackButton.tsx            # Reusable back navigation button
    │   │   └── RelatedContent.tsx        # Cross-feature linking (related flashcards/notes by topic/curriculum)
    │   ├── layout/                       # 🔒 PM — Global shell
    │   │   ├── NavBar.tsx                # Creative floating glassmorphism nav with scroll-hide behavior
    │   │   └── AuthModal.tsx
    │   ├── auth/                         # 🔒 PM — Login & signup forms
    │   │   ├── LoginForm.tsx
    │   │   └── SignupForm.tsx
    │   ├── settings/                     # 🔒 PM
    │   │   ├── AdvancedProfileEditor.tsx
    │   │   ├── ProfileEditor.tsx
    │   │   ├── RoleUpgradeForm.tsx
    │   │   └── RoleSwitcher.tsx
    │   ├── profile/                      # 🔒 PM — Public profile components
    │   │   ├── ProfileHero.tsx
    │   │   ├── ProfileActivity.tsx
    │   │   └── ProfileStats.tsx
    │   ├── contributor-manager/          # 🔒 PM
    │   │   ├── CompleteProfileForm.tsx
    │   │   ├── InviteForm.tsx
    │   │   ├── OtpVerification.tsx
    │   │   ├── StepIndicator.tsx
    │   │   └── UsersTable.tsx
    │   ├── explore/                      # 🔒 PM
    │   │   ├── ClubCard.tsx
    │   │   └── ProfileCard.tsx
    │   ├── Lessons/                      # 🔒 BMK & ABC
    │   │   ├── LessonTracker.tsx
    │   │   └── TopicCard.tsx
    │   ├── classrooms/                   # 🔒 BMK & ABC (11 files)
    │   │   ├── ClassroomCard.tsx         # Card shown in classroom grid
    │   │   ├── ClassroomList.tsx         # Main classroom list page
    │   │   ├── ClassroomDetail.tsx       # Classroom detail with tabs, search, feedback
    │   │   ├── AssignmentsPanel.tsx      # Assignment CRUD with grading
    │   │   ├── QuizzesPanel.tsx          # Quiz list, preview, take, results
    │   │   ├── QuizCreator.tsx           # Quiz creation wizard (manual + AI)
    │   │   ├── QuizTakeModal.tsx         # Full-screen quiz taking modal
    │   │   ├── ResourcesPanel.tsx        # Resource browsing with add/edit/delete
    │   │   ├── DiscussionsPanel.tsx      # Discussion topics + replies
    │   │   ├── LinksPanel.tsx            # Quick link sharing
    │   │   └── MembersPanel.tsx          # Member list with roles
    │   ├── clubs/                        # 🔒 AKT
    │   │   ├── ClubDetail.tsx            # Club detail with tabs (chat, announcements, links, members, projects, activity_timeline)
    │   │   └── ClubDiscovery.tsx         # Club discovery page
    │   ├── countdown/                    # 🔒 ZLH
    │   │   ├── AddCountdownModal.tsx
    │   │   ├── CountdownCard.tsx
    │   │   └── CountdownManager.tsx
    │   ├── flashcards/                   # 🔒 ZLH (11 files)
    │   │   ├── AICardParser.tsx
    │   │   ├── AIPromptGenerator.tsx
    │   │   ├── CardCreatorAI.tsx
    │   │   ├── CardCreatorManual.tsx
    │   │   ├── CreateDeckModal.tsx
    │   │   ├── DeckCard.tsx
    │   │   ├── DeckEditView.tsx
    │   │   ├── DeckLibrary.tsx
    │   │   ├── FlashcardText.tsx
    │   │   ├── SessionSummary.tsx
    │   │   └── StudySession.tsx
    │   └── notes/                        # Notes features (13 files)
    │       ├── AIPromptGenerator.tsx
    │       ├── AnimationBlock.tsx
    │       ├── BlockEditor.tsx
    │       ├── BlockPreview.tsx
    │       ├── MyNotesLibrary.tsx
    │       ├── NoteCard.tsx
    │       ├── NoteFilters.tsx
    │       ├── NoteReaderModal.tsx
    │       ├── NoteSubmitModal.tsx
    │       ├── NoteViewer.tsx
    │       ├── NotesEditor.tsx
    │       ├── NotesLibrary.tsx
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
- `chat` — Real-time messaging (any member)
- `announcements` — Pinned leader posts (admins & moderators only)
- `links` — Resource sharing (admins & moderators only)
- `members` — Member directory
- `projects` — Project showcase (any member can add)
- `activity_timeline` — Upcoming events (admins & moderators only can schedule)

### 10.3 Join Modes
- `open`: Anyone can join
- `invite_link`: Requires invite code
- `approval_based`: Admin must approve request

### 10.4 Permission Rules
- Only admins can modify club details and manage feature visibility
- Leaders (admins + moderators) can post announcements and share links
- Regular members restricted to chat and member-list display

### 10.5 Club Landing Page (Showcase)
Each club can optionally enable a public showcase landing page that serves as a mini-website for the club, its projects, and its members — eliminating the need to create a separate website for club activities.

#### 10.5.1 Showcase Content
- **Hero section**: Cover image banner, club name, tagline (max 120 chars), member count, join/request button.
- **Project gallery**: Grid of cards showing club projects with cover images, status badges, tags, and contributor avatars. Clicking a project opens a detail view with description, links, and full contributor list.
- **Milestone tracker**: Visual timeline or progress board showing club milestones with status indicators (planned / in_progress / completed).
- **Member spotlight**: Featured members section showing active contributors with avatar, name, role badge, and contribution count.
- **Announcements feed**: Chronological list of club announcements visible to the public.
- **Shareable URL**: Each club gets a `custom_domain_slug` for clean shareable links (e.g., `/c/science-club`). A "Share" button copies the URL or opens native share dialog.

#### 10.5.2 Showcase Settings (Admin)
- **Toggle showcase**: Admin can enable/disable the public showcase via club management.
- **Cover image**: Upload or provide URL for hero banner (recommended: 1200×400).
- **Tagline**: Short description or slogan for the hero section.
- **Custom slug**: Set a unique URL slug for the club's showcase page.
- **Feature visibility**: Each feature tab's `public_visible` flag controls what appears on the showcase page.

#### 10.5.3 Permission Constraints
- All roles including unauthenticated users can view the public showcase.
- Only club admins can enable/disable showcase and edit landing page settings.
- Only publicly visible features (`public_visible: true`) appear on the showcase.

### 10.6 Progress Tracking
Clubs include built-in progress tracking through milestones and member contributions.

#### 10.6.1 Milestones
- **Milestone board**: A list/kanban view showing milestones grouped by status (planned, in_progress, completed).
- **Milestone CRUD**: Club leaders can create, edit, and delete milestones. Each milestone has a title, description, optional target date, and order.
- **Status transitions**: Milestones move from `planned` → `in_progress` → `completed`. Leaders can manually update status.
- **Progress bar**: Overall club progress shown as percentage of completed milestones.
- **Completion tracking**: When a milestone is marked `completed`, `completed_at` is set automatically and a `club_member_contributions` entry is created for the user who completed it.

#### 10.6.2 Member Contributions
- **Contribution types**: project, event, milestone_completed, discussion, other.
- **Automatic tracking**: System auto-records contributions when members add projects, complete milestones, or participate in discussions.
- **Manual logging**: Club leaders can manually log contributions for members.
- **Member progress view**: Per-member stats showing contribution count, recent activity, and badges.
- **Contribution feed**: Chronological activity feed in club detail showing who did what.

#### 10.6.3 Permission Constraints
- Only club leaders can manage milestones.
- Club leaders can view all member contributions; members can view their own.
- All active members can view the milestone board and progress.

### 10.7 Club-to-Profile Integration
Club activity and contributions can appear on a user's public profile portfolio, giving members a way to showcase their club involvement.

#### 10.7.1 Profile Display Options
- **Club memberships**: A "Clubs" section on the profile showing club badges with name, role, and member count. Clicking navigates to the club's public page.
- **Club projects**: Club projects the user contributed to appear alongside personal projects in the profile's Projects section, with a "Club Project" badge.
- **Club activity**: Club-related events and contributions appear in the profile's Activity Timeline with club context.

#### 10.7.2 User Controls (Profile Editor)
- Toggle `show_club_memberships` — show/hide the Clubs section on the profile.
- Toggle `show_club_projects` — include/exclude club projects in the portfolio Projects section.
- Toggle `show_club_activity` — include/exclude club activity in the timeline.
- All toggles default to `true` (visible). Users must explicitly opt out.

#### 10.7.3 Permission Constraints
- All profile-level toggles are user-controlled; no admin override.
- Only active club members see their club data on their profile.
- Private clubs: membership badges are shown but club details are not exposed beyond name.

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
10. **Supabase Query Pattern:** All Supabase queries must use the `database.ts` facade. Never call `supabase.from()` directly in component code. When transitioning from mock to live data, replace the facade implementation — never change the consumer interface.

---

## 12. Smart Timetable — Detailed Specification

### 12.1 Overview
The Smart Timetable is a full scheduling tool supporting daily, weekly, and monthly views. Students plan study sessions, classes, and personal events with drag-and-drop time blocks. Events are colour-coded by type (study, class, school, gym, exam, break, deadline, club event). Events can be to-dos with completion tracking or regular events, and can repeat daily, weekly, monthly, or on a custom interval.

### 12.2 Data Model
Timetable events are stored in the `timetable_events` table with a rich relational schema. Cross-feature integration surfaces exam countdowns, assignment deadlines, club events, and club milestones as read-only virtual events.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Unique event identifier |
| `user_id` | UUID | Owning user |
| `title` | text | Event name (e.g., "Physics Revision") |
| `description` | text | Optional notes / details |
| `event_type` | enum | `study`, `class`, `school`, `gym`, `exam`, `break`, `deadline`, `club_event` |
| `subject` | text | Subject or curriculum reference |
| `location` | text | Physical room, online link, or venue |
| `start_time` | timestamptz | ISO start datetime (null for all-day or deadline-only) |
| `end_time` | timestamptz | ISO end datetime (deadline for deadline-only events) |
| `all_day` | boolean | True if event spans the full day |
| `is_recurring` | boolean | Whether event repeats |
| `recurrence_rule` | JSONB | `{ frequency, interval, days_of_week[], end_date }` |
| `color_code` | text | Hex colour for display |
| `is_todo` | boolean | Whether event has a completion checkbox |
| `is_completed` | boolean | Completion state for to-do events |
| `completed_at` | timestamptz | When the to-do was ticked |
| `event_source` | enum | `user`, `exam_countdown`, `assignment`, `club_event`, `club_milestone` |
| `source_id` | UUID | Reference to the originating entity (null for user events) |
| `metadata` | JSONB | Extensible payload for external event context |
| `created_at` | timestamptz | Creation timestamp |

### 12.3 Core Functional Requirements
- **Daily, Weekly, and Monthly views**: Three toggleable calendar views. Day and week views show a time grid (6:00 AM–11:00 PM). Month view shows a compact 6-row calendar grid.
- **Event CRUD**: Create, edit, delete events via modal form. Supports timed events, all-day events, and deadline-only events.
- **Drag-and-drop reschedule**: Drag events to new time slots or across days. Uses `@dnd-kit/core` with `PointerSensor`. Drop targets highlight on hover. Duration is preserved on move.
- **Overlapping events share width**: Events that overlap in time are rendered side-by-side with proportional column widths — no warnings or blocks.
- **Colour coding**: Each event type has a default colour; user can choose from 12 presets or a custom colour picker.
- **Recurring events**: Supports daily, weekly, monthly, and custom (every N days) recurrence with optional end date. Weekly recurrence allows day-of-week selection. Editing a recurring instance prompts "Edit this event only" (creates a one-off) or "Edit all events in series" (modifies the base event).
- **To-do events**: Events can be marked as to-dos with a completion checkbox. Completed to-dos show with strikethrough style and can be unchecked.
- **Current time indicator**: A horizontal indigo line with dot marks the current time on the current day.
- **Cross-feature integration**: Exam countdowns (red), assignment deadlines (amber), club events (pink), and club milestones (amber) appear as read-only virtual events with lock badges. Toggleable via the "Show External Events" filter.
- **Event count cap**: Soft warning when a day exceeds 20 events.

### 12.4 User Interaction Workflows
1. **Create event**: Click "+" button or click an empty time slot → modal opens with pre-filled day/time → fill title, select event type, optionally set colour, recurrence, to-do status → save.
2. **Edit event**: Click existing event → modal opens with current values → modify → save. Recurring instances prompt for scope choice.
3. **Delete event**: Click event → modal → "Delete" button.
4. **Reschedule**: Drag event vertically (change time) or horizontally (change day in week view). Drop zone highlights. On drop, event is moved preserving duration.
5. **Navigate**: Left/right arrows move between days/weeks/months. "Today" button jumps to current date. View switcher toggles day/week/month.
6. **Filter**: Filter panel toggles event types, show/hide completed to-dos, and show/hide external events.

### 12.5 Permission Constraints
- All roles with a user account have full CRUD on their own timetable events.
- External (virtual) events are read-only; they cannot be edited, moved, or deleted from the timetable.
- No shared or collaborative timetable editing.

### 12.6 Technical Implementation
- `'use client'` directive for all drag-and-drop interactions.
- `@dnd-kit/core` + `@dnd-kit/utilities` for drag-and-drop.
- `src/lib/mock/timetable.ts` — full mock database with 12 rich events, CRUD, recurrence expansion, and cross-feature virtual event builders.
- `src/hooks/useTimetable.ts` — state management, navigation, filtering, and CRUD.
- `src/actions/timetable.ts` — server actions (ready for Supabase migration).
- `src/lib/timetable/layout.ts` — overlap detection and column width algorithm.
- `src/constants/timetable.ts` — event type configs, colour presets, grid config, labels.
- `src/types/timetable.ts` — all timetable TypeScript types.
- Timezone-aware rendering using the user's local timezone.

### 12.7 Error Handling
- **Overlapping events**: Events are displayed side-by-side; no blocking or warning.
- **Invalid time range**: `end_time` must be after `start_time`; form validation blocks save.
- **Event count warning**: Soft cap at 20 events per day; warning shown in modal if exceeded.
- **External event editing**: Attempts to edit/delete external events return an error silently.

### 12.8 Integration Requirements
- Pulls event type colours from `src/constants/timetable.ts`.
- Virtual events are built at query time from exam countdowns, assignments, club events, and club milestones.
- Middleware does not protect timetable routes; access is gated by application layout.

---

## 13. Pomodoro Timer — Detailed Specification

### 13.1 Overview
The Pomodoro Timer implements the time-management technique with configurable focus/break intervals, ambient background sounds, session statistics, and localStorage persistence for cross-session state.

### 13.2 Timer States & Transitions

| State | Display | Duration | Next State |
|---|---|---|---|
| `focus` | Focus countdown | Default: 25 min (configurable 5-120 min) | `short_break` (or `long_break` after 4 focus cycles) |
| `short_break` | Short break countdown | Default: 5 min (configurable 1-30 min) | `focus` |
| `long_break` | Long break countdown | Default: 15 min (configurable 5-60 min) | `focus` |
| `paused` | Paused overlay | User-controlled | Resumes to previous state |

### 13.3 Core Functional Requirements
- **Timer display**: Large centered countdown in `MM:SS` format with circular progress ring animation.
- **Start/Pause/Resume**: Single toggle button; spacebar keyboard shortcut.
- **Reset**: Button to reset current timer to its full duration.
- **Session counter**: Visual indicator showing completed focus sessions (e.g., "3/4" before long break).
- **Auto-transition**: Focus → break transitions happen automatically with a 3-second notification before switch.
- **Configurable durations**: Settings panel to customise focus, short break, and long break lengths independently.
- **Background sounds**: Toggleable ambient audio tracks (rain, forest, white noise, cafe). Sounds are `.mp3`/`.ogg` files served from `public/sounds/`.
- **Volume slider**: Per-sound volume control (0-100%) with mute toggle.
- **Session statistics**: Track total focus time, sessions completed, and daily streak. Data stored in `localStorage` for MVP; sync to `profiles` table in production.

### 13.4 User Interaction Workflows
1. **Start a session**: User selects a sound (optional) → clicks "Start" → focus timer begins → sound plays if enabled.
2. **Pause/Resume**: Click pause button or press Space → timer freezes, progress ring stops → click resume or Space again to continue.
3. **Between sessions**: Timer auto-transitions. A 3-second countdown notification appears: "Break starts in 3... 2... 1..."
4. **Adjust settings**: Open settings drawer → modify duration sliders → changes apply immediately to next timer.
5. **View statistics**: Collapsible panel at bottom of page shows today's stats, weekly trend, and all-time totals.

### 13.5 Permission Constraints
- All roles (student, teacher, contributor, main_contributor) have identical access to the Pomodoro Timer.
- No role gating required; the feature is universally available.

### 13.6 Technical Implementation Prerequisites
- `'use client'` directive for all timer logic and audio playback.
- Timer must use `requestAnimationFrame` or `setInterval` at 1s granularity. Do not rely on `setTimeout` for accuracy over long periods.
- Audio playback uses the HTML5 `<audio>` element; autoplay policies require user interaction before first playback.
- `TimerContext.tsx` provides global timer state so the timer continues across page navigations within the authenticated app.
- `usePomodoro.ts` hook encapsulates timer logic: state machine, duration config, audio control.
- localStorage reads on mount, writes on every session completion.

### 13.7 Error Handling
- **Audio autoplay blocked**: Show a "Click to enable sound" button; gracefully degrade to silent timer.
- **localStorage quota exceeded**: Wrap writes in try/catch; fall back to in-memory stats; warn user once.
- **Tab becomes inactive**: Timer continues (via `TimerContext`); no pause on tab switch. `document.title` updates to show remaining time.
- **Duration out of bounds**: Form clamps focus to 5-120 min, short break to 1-30 min, long break to 5-60 min.

### 13.8 Integration Requirements
- `TimerContext.tsx` provides the global timer state shared across the app.
- Sound files must reside in `public/sounds/` following naming convention: `rain.mp3`, `forest.mp3`, `white-noise.mp3`, `cafe.mp3`.
- Session statistics can be surfaced on the dashboard page via a shared stats interface.
- Notification permissions requested on first session start (for browser notifications when focus ends).

---

## 14. Flashcard Creator & Library — Detailed Specification

### 14.1 Overview
The Flashcard system provides full SRS (Spaced Repetition System) study capabilities. Users can create decks of flashcards manually or via AI generation, review cards using the SM-2/FSRS algorithm, and track their learning progress over time.

### 14.2 Data Model

| Table | Key Fields | Description |
|---|---|---|
| `decks` | id, title, description, subject, topic_id, is_public, created_by, card_count | Flashcard deck container |
| `cards` | id, deck_id, front, back, hint, tags | Individual flashcard with front/back content |
| `card_reviews` | id, card_id, user_id, ease_factor, interval, repetitions, next_review_date, last_review_date, quality | SRS review history per card per user |

### 14.3 Deck States
- `active` — Default state; deck is visible and usable in study sessions.
- `archived` — Deck is hidden from the main library but data is preserved; user can unarchive.
- `deleted` — Soft-delete flag; admin recovery possible.

### 14.4 Core Functional Requirements

#### 14.4.1 Deck Management
- **Create deck**: Modal form with title, description, optional subject/topic association, public/private toggle.
- **Edit deck**: Modify title, description, subject, visibility; cannot merge decks.
- **Delete deck**: Soft-delete (archived) with confirmation; deck moves to "Archived" section.
- **Archive/Restore**: One-click archive from deck card; restore from archived view.
- **Deck library view**: Grid of deck cards showing title, card count, last reviewed date, progress bar. Sortable by recently studied, title, card count. Filterable by subject.

#### 14.4.2 Card Management
- **Manual card creation**: Form with front/reverse/hint fields. Add tags as comma-separated strings. Save adds to current deck.
- **AI card generation**: User configures topic, number of cards, and difficulty → system generates an AI prompt → user copies prompt → pastes LLM response → `AICardParser.tsx` parses into card objects → user reviews and confirms import.
- **Bulk card import**: Toggle to switch between single-card and bulk (one-per-line) mode.
- **Edit card**: Inline editor within deck edit view; update front, back, hint, tags.
- **Delete card**: Remove card from deck with confirmation; cannot undo.
- **Reorder cards**: Drag-to-reorder within deck edit view to set custom study order.

#### 14.4.3 Study Sessions
- **Start session**: User selects deck → chooses study mode (All cards / Due cards / New cards / Custom selection) → session begins.
- **Session UI**: Card front displayed → user thinks of answer → click/tap to reveal back → rate recall quality (1-4 scale).
- **Rating scale**: 1=Complete blackout, 2=Incorrect but recalled after hint, 3=Correct with difficulty, 4=Perfect recall.
- **Progress indicator**: Bar showing cards reviewed / total cards in session.
- **Session end**: Summary screen showing cards reviewed, average rating, time spent, accuracy percentage.
- **SRS scheduling**: Each rating updates the card's `ease_factor`, `interval`, and `next_review_date` using `src/lib/srs/algorithm.ts` (SM-2 variant with FSRS option).

#### 14.4.4 Spaced Repetition Algorithm (SM-2/FSRS)
- `card_reviews.ease_factor`: Starts at 2.5; increments by 0.15 for perfect recall, decrements by 0.20 for blackout.
- `card_reviews.interval`: First review = 1 day; subsequent = previous_interval × ease_factor.
- `card_reviews.next_review_date`: Calculated on each review; cards with `next_review_date <= now()` appear as "due."
- Minimum interval: 1 day. Maximum interval: 365 days.
- Daily new card limit: configurable per user (default: 20).

### 14.5 User Interaction Workflows
1. **Create deck manually**: Navigate to Flashcards → "Create Deck" → fill modal → submit → redirected to empty deck edit view.
2. **Add cards manually**: In deck edit view, use card form → type front/back → save → card appears in list.
3. **Generate cards via AI**: Deck edit view → "AI Generate" → configure (topic, count, difficulty) → copy prompt → paste LLM response → review parsed cards → confirm import.
4. **Study session**: From deck library, click deck → "Study" → select mode → session UI → rate each card → session ends with summary.
5. **Review progress**: Deck card shows due count and last review date. Click deck → "Statistics" to see per-card history.

### 14.6 Permission Constraints
- **All roles**: Create, edit, delete own decks and cards.
- **Public decks**: Any user can view and study public decks; only the owner can edit/delete.
- **Archived decks**: Only visible to the owner in the "Archived" filter view.
- No role-based gating beyond standard authentication.

### 14.7 Technical Implementation Prerequisites
- `'use client'` for all interactive components (deck library, study session, card editors).
- `useFlashcardSRS.ts` hook handles all SRS logic (scheduling, ease factor updates, due-card queries).
- AI parsing: `AICardParser.tsx` expects LLM responses in structured format (front|back per line, or JSON array). A fallback parser handles free-form text.
- `RelatedContent.tsx` integration: surfaces notes and curriculum items matching deck subject/topic.

### 14.8 Error Handling
- **Duplicate cards**: Check front text uniqueness within a deck; warn user but allow duplicates.
- **AI import fails**: Show raw LLM response in a text area; allow manual correction and re-parse.
- **Overdue cards bulk**: If >100 cards are due, session defaults to "Due cards" mode with a warning: "You have X overdue cards. Consider increasing your daily limit."
- **SRS algorithm edge cases**: `ease_factor` clamped to [1.3, 3.0]; `interval` clamped to [1, 365].

### 14.9 Integration Requirements
- `src/lib/srs/algorithm.ts` is the single source of truth for SRS calculations; no inline algorithm logic in components.
- `RelatedContent.tsx` displays related notes by matching `decks.topic_id` with `notes.topic_id`.
- Deck subjects align with `curriculums` → `subjects` hierarchy for cross-feature linking.

---

## 15. Lesson Tracker & Course Manager — Detailed Specification

### 15.1 Overview
The Lesson Tracker and Course Manager form a paired tool for students to monitor their progress through a curriculum. The Course Manager defines a student's active curriculum/subject enrolment, and the Lesson Tracker records per-topic completion status.

### 15.2 Data Model

| Table | Key Fields | Description |
|---|---|---|
| `user_curriculums` | id, user_id, curriculum_id, subject_id, started_at, completed_at | Tracks which curriculum/subject pairs a student is enrolled in |
| `topic_progress` | id, user_curriculum_id, topic_id, status, completed_at, notes | Per-topic progress within a curriculum |
| `curriculums` | id, title, description, exam_board, level | Top-level curriculum definition |
| `subjects` | id, curriculum_id, name, code | Subjects within a curriculum |
| `topics` | id, subject_id, name, parent_topic_id, order_index, learning_objectives | Hierarchical topic tree |

### 15.3 Course Manager — Core Functional Requirements
- **Enrol in curriculum**: Student searches/browses available curricula (by exam board, level) → selects subject(s) → enrolment is recorded in `user_curriculums`.
- **View enrolled courses**: Dashboard-style list showing each enrolled curriculum/subject with overall progress percentage, last activity date.
- **Drop course**: Remove enrolment with confirmation; associated `topic_progress` records are soft-deleted.
- **Curriculum browser**: Hierarchical explorer: Exam Board → Curriculum → Subject → Topics. Read-only view of all available content.
- **Curriculum search**: Free-text search against curriculum title, subject name, and topic name.

### 15.4 Lesson Tracker — Core Functional Requirements
- **Topic tree view**: Expandable/collapsible tree showing curriculum hierarchy (Subjects → Topics → Subtopics). Completed topics show a checkmark.
- **Mark topic as complete**: Click topic → status changes from `not_started` → `in_progress` → `completed`. Option to add completion notes.
- **Progress bar**: Per-subject and per-curriculum progress bars calculated as `(completed topics / total topics) × 100`.
- **Bulk complete**: "Mark subtree complete" option for a topic and all its children (with confirmation).
- **Reset progress**: Option to reset a single topic or entire subject back to `not_started`.
- **Study statistics**: Total topics completed, topics completed this week, current streak (consecutive days with at least one topic completion).

### 15.5 User Interaction Workflows
1. **Enrol in a course**: Navigate to Courses → "Browse Curricula" → select exam board → select curriculum → select subjects → "Enrol" → course appears in "My Courses."
2. **Track a lesson**: Navigate to Lessons → select enrolled course → topic tree displayed → click topic → "Mark Complete" → tree updates instantly.
3. **View progress**: Dashboard widget shows overall progress across all enrolled courses. Clicking a course card navigates to Lesson Tracker filtered to that course.
4. **Search topics**: Lessons page search bar → filters tree to matching topics → navigates to topic on selection.

### 15.6 Permission Constraints
- **Student/Teacher/Contributor/Main Contributor**: Full CRUD on own course enrolments and topic progress.
- **Teachers**: View-only access to their classroom students' progress (through classroom member view, not direct).
- **Contributors**: Can view and modify curriculum structure via Curriculum & Notes Editor (Section 16), not through student-facing Course Manager.
- No cross-user progress visibility; each student sees only their own progress.

### 15.7 Technical Implementation Prerequisites
- Topic tree requires a recursive component for arbitrary-depth hierarchy rendering.
- `'use client'` for tree expand/collapse and mark-complete interactions.
- Progress calculations happen client-side based on `topic_progress` data fetched on mount.
- `useClassroom.ts` hook extends to `user_curriculums` for teacher's student progress view.

### 15.8 Error Handling
- **Duplicate enrolment**: System checks for existing `user_curriculum` before creating; shows "Already enrolled" message.
- **Topic tree too deep**: Limit to 5 levels of nesting; deeper topics are flattened into level-5.
- **Progress recalculation**: Occurs on every topic status change; ensure atomic UI updates (loading state while recalculating).

### 15.9 Integration Requirements
- `RelatedContent.tsx` surfaces notes and flashcards matching the selected topic's `learning_objectives`.
- Dashboard pulls progress data for summary widgets.
- Curriculum & Notes Editor (Section 16) maintains the `curriculums`/`subjects`/`topics` data that this feature consumes.

---

## 16. Curriculum & Notes Editor — Detailed Specification

### 16.1 Overview
The Curriculum & Notes Editor is a **Contributor-only** tool for creating and maintaining the curriculum hierarchy (exam boards → curriculums → subjects → topics) and writing structured educational notes with a block-based editor.

### 16.2 Feature Domains

#### 16.2.1 Curriculum Editor
- **CRUD on exam boards**: Add, edit, delete exam boards (e.g., "Cambridge International", "Edexcel", "AQA").
- **CRUD on curriculums**: Within an exam board, create/edit/delete curriculums with title, level (IGCSE, A-Level, IB), description.
- **CRUD on subjects**: Within a curriculum, create/edit/delete subjects with name, code, optional colour.
- **CRUD on topics**: Within a subject, create/edit/delete topics with name, `parent_topic_id` for hierarchy, `order_index` for sorting, `learning_objectives` as text array.
- **Reorder topics**: Drag-to-reorder topics within the same parent; `order_index` updates accordingly.
- **Import curriculum**: JSON import format for batch-adding an entire curriculum tree. Schema validated on import.
- **Export curriculum**: Download selected curriculum as JSON file.

#### 16.2.2 Notes Editor
- **Block editor**: Each note is composed of ordered blocks. Block types:
  - `text` — Rich text block (bold, italic, underline, bullet lists, numbered lists).
  - `heading` — H1/H2/H3 heading block.
  - `code` — Syntax-highlighted code block (language selector).
  - `image` — Image upload (via Supabase Storage) or URL embed.
  - `formula` — LaTeX math formula (rendered via KaTeX).
  - `callout` — Info/warning/tip/note callout box.
  - `divider` — Horizontal rule separator.
- **Block operations**: Add block (above/below), edit block content, reorder blocks (drag handle), delete block (with confirmation).
- **Note metadata**: Title, subject/topic association, visibility (public/draft/private), tags, cover image.
- **Auto-save**: Debounced auto-save (2 seconds after last keystroke) with "Saved" / "Saving..." indicator.
- **Version history**: Immutable snapshots on save; user can view and restore previous versions (MVP: last 10 versions).
- **AI prompt generation**: Button in editor toolbar → "Generate from topic" → copies an AI prompt to clipboard based on the associated topic's `learning_objectives`.

#### 16.2.3 Submission Lifecycle (Contributor → Main Contributor)
1. Contributor creates/edits curriculum items or notes → saves as `draft`.
2. Contributor submits changes → status changes to `pending_review`.
3. Main Contributor reviews in the Review Queue (Section 19) → approves (→ `published`), rejects (→ `draft` with feedback), or requests revisions (→ `revision_requested`).
4. If revision requested, Contributor updates and re-submits.
5. Once published, changes are visible to all users consuming curriculum/notes.

### 16.3 User Interaction Workflows
1. **Add a new subject**: Curriculum Editor → Select exam board → Select curriculum → "Add Subject" → fill name/code → save.
2. **Write a note**: Notes Editor → "New Note" → select subject/topic → write content using blocks → auto-saves → optionally submit for review.
3. **Reorder topics**: Curriculum tree view → drag topic handle → drop at new position → `order_index` updated.
4. **Submit for review**: Note or curriculum edit → "Submit" button → confirmation modal → status becomes `pending_review`.

### 16.4 Permission Constraints
- **Contributor**: Full CRUD on curriculum items; create/edit notes; submit for review.
- **Main Contributor**: Everything Contributor gets + approve/reject submissions (through Review Queue, not direct editing).
- **Teacher**: View-only access to published curriculum and notes.
- **Student**: View-only access to published curriculum and notes.
- Unpublished/draft content is only visible to the Contributor who created it and Main Contributors.

### 16.5 Technical Implementation Prerequisites
- `'use client'` for the block editor, drag-to-reorder, and auto-save.
- Block editor state managed as `Block[]` array; serialized to JSONB for storage.
- `notes` table uses a `blocks` JSONB column; `editor_submissions` table tracks pending changes.
- Image upload uses Supabase Storage with signed URLs; files stored under `notes/{userId}/` path.
- LaTeX rendering via `katex` package; lazy-loaded.
- Auto-save uses `useCallback` + `useEffect` with a 2-second debounce; prevents save on unmount if no changes.

### 16.6 Error Handling
- **Block content too large**: Individual block content limited to 50KB; form validation warns if exceeded.
- **Image upload fails**: Show error toast with retry button; validate file type (jpg, png, gif, webp) and size (<10MB) before upload.
- **Auto-save conflict**: If two contributors edit the same note simultaneously, last-save-wins with a conflict warning for the second saver.
- **Import validation failure**: Show line-by-line errors for invalid JSON import; reject entire import if any record fails validation.

### 16.7 Integration Requirements
- `editor_submissions` table feeds directly into the Review Queue (Section 19).
- Published notes are consumed by Notes Library and surfaced via `RelatedContent.tsx`.
- Curriculum data is consumed by Course Manager, Lesson Tracker, Flashcard (topic association), and Exam Countdown.

---

## 17. Exam Countdown — Detailed Specification

### 17.1 Overview
The Exam Countdown feature allows students to track upcoming exams with countdown timers, view exam schedules, and receive reminders. It integrates with exam board data to pre-populate exam dates where available.

### 17.2 Data Model

| Table | Key Fields | Description |
|---|---|---|
| `exams` | id, subject, exam_board, paper_code, date, start_time, duration, session (am/pm), series, year | Pre-defined exam records (maintained by Contributors) |
| `exam_countdowns` | id, user_id, exam_id (optional), custom_title, custom_date, custom_subject, notes, reminder_days | User's personal exam countdown entries |

### 17.3 Core Functional Requirements
- **Countdown display**: Large numeric display showing `X days, Y hours, Z minutes` until the exam. Format transitions: >30 days = "X months, Y weeks"; 7-30 days = "X weeks, Y days"; <7 days = "X days, Y hours, Z minutes."
- **Exam list**: Card-based list sorted by nearest exam first. Each card shows: title, subject, date, days remaining, paper code (if applicable).
- **Add exam entry**: Modal with two modes:
  - **Pre-defined**: Search available exams from the `exams` table; select and add.
  - **Custom**: Manually enter title, date, subject, optional notes, reminder preferences.
- **Edit/Delete exam entry**: Edit modal (same as add) or delete with confirmation.
- **Reminders**: Per-exam configurable notification (1 day before, 1 week before, 2 weeks before, 1 month before). MVP uses in-app badge/notification bar; future: browser notifications.
- **Calendar view**: Toggle between countdown list and monthly calendar showing all exam dates with coloured indicators.
- **Exam board filtering**: Filter displayed exams by exam board.

### 17.4 User Interaction Workflows
1. **Add pre-defined exam**: "Add Exam" → choose "From Exam Board" → search/subject filter → select exam → confirm → countdown appears in list.
2. **Add custom exam**: "Add Exam" → choose "Custom" → fill title, date, subject, notes → save.
3. **View countdown**: Exam countdown page shows all entries sorted by proximity. Most urgent exam highlighted with a "priority" banner.
4. **Set reminder**: Edit exam → "Reminders" → toggle checkboxes for 1 day, 1 week, 2 weeks, 1 month before.
5. **Mark exam complete**: After exam date passes, user can mark as "Done" — moves to a "Completed Exams" collapsed section.

### 17.5 Permission Constraints
- **Student/Teacher/Contributor/Main Contributor**: Full CRUD on own exam countdown entries.
- Pre-defined exams (`exams` table) are read-only for non-Contributors; Contributors create/edit via Exam Data Editor.
- No cross-user visibility; each user manages their own countdowns.

### 17.6 Technical Implementation Prerequisites
- `'use client'` for countdown timer (updates every second) and interactive list/calendar.
- Countdown calculation uses local time; no timezone conversion needed (exam dates are date-only; time is optional).
- `useCountdown.ts` hook manages all CRUD operations and countdown calculation logic.
- Reminders stored in `exam_countdowns.reminder_days` as integer array.
- Calendar view uses a lightweight date utility; no full calendar library needed for MVP (a simple date grid suffices).

### 17.7 Error Handling
- **Past exam date**: Displayed with "Passed" badge; user can mark as complete or delete.
- **Invalid date input**: Date must be in the future when creating; validation blocks past dates with a warning (override allowed with reason).
- **Duplicate exam entry**: Check if user already has a countdown for the same `exam_id`; show "Already tracking this exam" message.
- **Notification permission denied**: Fall back to in-app reminder badge; no repeated permission requests.

### 17.8 Integration Requirements
- `RelatedContent.tsx` surfaces flashcards and notes matching the exam's subject/paper code.
- Pre-defined exams come from the `exams` table, maintained by the Exam Data Editor (Contributor feature).
- Dashboard can surface the next 3 upcoming exams as a widget.

---

## 18. Grade Calculator — Detailed Specification

### 18.1 Overview
The Grade Calculator computes predicted qualification grades based on component/paper scores. It supports per-paper UMS conversion, modular qualification structures, and letter-grade boundaries. It consumes structured exam boundary data maintained by Contributors.

### 18.2 Data Model

| Table | Key Fields | Description |
|---|---|---|
| `grade_boundaries` | id, qualification, subject, paper_code, year, series, component, raw_mark_max, ums_max, grade_a, grade_b, grade_c, grade_d, grade_e, grade_f, grade_g, grade_u | Raw/UMS boundaries per component |
| `grade_entries` | id, user_id, qualification, subject, year, series, components (JSONB), total_raw, total_ums, predicted_grade, created_at | User's saved grade calculation entries |

### 18.3 Core Functional Requirements

#### 18.3.1 Input & Configuration
- **Select qualification**: Dropdown to choose qualification type (IGCSE, A-Level, IB, etc.).
- **Select subject**: Within qualification, select subject.
- **Select paper/component**: Within subject, select which papers the user has taken.
- **Enter raw marks**: For each selected paper, input raw mark achieved (0 to paper's `raw_mark_max`).
- **Multiple entry modes**:
  - **Per-paper**: Enter each paper individually.
  - **Modular**: Group papers by module, then sum modules for overall (A-Level modular structure).
  - **Overall**: Enter total UMS directly.

#### 18.3.2 Calculation & Display
- **UMS conversion**: For each paper, convert raw mark → UMS using the grade boundary's conversion table (linear interpolation between boundary points).
- **Total UMS**: Sum of all paper UMS values.
- **Predicted grade**: Map total UMS against overall grade boundaries for the qualification.
- **Component breakdown table**: Table showing per-paper: paper name, raw mark, max raw, UMS, max UMS, component grade.
- **Visual indicators**: Colour-coded grade badges (A=green, B=blue, C=teal, D=orange, E=red, U=gray).
- **"What if" mode**: Toggle to adjust marks for specific papers and see how overall grade changes in real-time.

#### 18.3.3 Saved Calculations
- **Save calculation**: Name and save current calculation to `grade_entries` for later reference.
- **View saved**: List of saved calculations with qualification, subject, predicted grade, date.
- **Edit saved**: Load saved calculation → modify marks → recalculate → save (prompt: "Update existing" or "Save as new").
- **Delete saved**: Remove saved entry with confirmation.
- **Share calculation**: Copy a shareable link (contains encoded component data; no server-side storage for shared links — decoded client-side).

### 18.4 User Interaction Workflows
1. **Calculate grade**: Navigate to Grade Calculator → select qualification → select subject → select papers → enter raw marks → predicted grade displayed instantly.
2. **Use "What if" mode**: Toggle switch → adjust mark sliders for any paper → predicted grade updates in real-time (no button press needed).
3. **Save for later**: After calculation → "Save" → enter name → saved to `grade_entries`.
4. **Load previous**: My Calculations panel → click saved entry → loads all paper selections and marks → recalculates.

### 18.5 Permission Constraints
- **All roles**: Full CRUD on own grade entries.
- Grade boundary data (`grade_boundaries` table) is read-only for all non-Contributor roles.
- **Contributors**: Maintain grade boundaries via Exam Data Editor.
- No cross-user sharing of saved calculations (MVP); share link is a URL-encoded snapshot, not a server-side share.

### 18.6 Technical Implementation Prerequisites
- `'use client'` for real-time calculation, sliders, and "What if" mode.
- Calculation logic is a pure function: `calculateGrade(markEntries: MarkEntry[], boundaries: GradeBoundary[]): GradeResult`. No side effects, testable in isolation.
- `gradeBoundaries.ts` constant file provides default boundary tables; overridden by live DB data when available.
- Linear interpolation formula: `UMS = ((rawMark - lowerRaw) / (upperRaw - lowerRaw)) × (upperUMS - lowerUMS) + lowerUMS`.

### 18.7 Error Handling
- **Missing boundaries**: If no boundary data exists for selected qualification/subject/paper, show "Boundary data not available" and disable calculation.
- **Invalid mark entry**: Mark must be ≥ 0 and ≤ paper's `raw_mark_max`; clamp input on blur.
- **Incomplete data**: If user hasn't entered marks for all selected papers, show "X of Y papers entered" — allow partial calculation with a warning.
- **Boundary interpolation edge case**: If raw mark exactly equals a boundary threshold, UMS is the boundary's UMS value (not interpolated).

### 18.8 Integration Requirements
- Consumes `grade_boundaries` data maintained by Exam Data Editor (Contributor feature).
- `RelatedContent.tsx` may surface exam countdown entries matching the same qualification/subject.
- Dashboard can show the most recently saved grade calculation as a summary card.

---

## 19. Review Queue — Detailed Specification

### 19.1 Overview
The Review Queue (Gatekeeper) is the **Main Contributor-only** moderation interface where pending submissions from Contributors are reviewed, approved, rejected, or sent back for revision. It covers curriculum edits, notes submissions, and exam data changes.

### 19.2 Data Model

| Table | Key Fields | Description |
|---|---|---|
| `editor_submissions` | id, contributor_id, reviewer_id, submission_type, target_table, target_id, changes (JSONB diff), status, reviewer_comment, created_at, reviewed_at | Tracks every pending/processed submission |
| `submission_type` enum | `curriculum_edit`, `notes_submission`, `exam_data_edit`, `new_curriculum`, `new_notes` | Categorises the type of change |

### 19.3 Submission States

```
draft → pending_review → under_review → approved (→ published)
                                      → rejected (→ draft)
                                      → revision_requested (→ draft → pending_review)
```

### 19.4 Core Functional Requirements

#### 19.4.1 Queue View
- **Submission list**: Filterable, sortable list with columns: Type, Contributor, Submitted (date), Status, Priority.
- **Filters**: By status (pending/under_review/approved/rejected/revision_requested), by submission type, by contributor, date range.
- **Search**: Free-text search against contributor name, submission title, or target table name.
- **Sort**: By submission date (newest/oldest), by priority (high/low), by contributor name.
- **Batch selection**: Checkbox multi-select for bulk operations (approve all selected, reject all selected).

#### 19.4.2 Review Detail View
- **Change diff**: Side-by-side or inline diff view showing what changed (old value → new value). JSONB diff parsed and displayed as human-readable fields.
- **Contributor notes**: Any notes left by the Contributor when submitting.
- **Preview link**: For notes submissions, a "Preview Note" link opens the note in read-only mode within the Notes Library context.
- **Approval action**: "Approve" button → optional comment → submission status → `approved` → changes become `published`.
- **Rejection action**: "Reject" button → mandatory comment explaining why → submission status → `rejected` → changes return to `draft`.
- **Revision request**: "Request Changes" button → mandatory comment with specific change requests → submission status → `revision_requested` → Contributor gets notified.

#### 19.4.3 Review History
- **Audit log**: For each submission, show full history: created → under_review → [approved/rejected/revision_requested] with timestamps and reviewer names.
- **Re-review**: A revision resets the submission to `pending_review`; new review cycle begins.

### 19.5 User Interaction Workflows
1. **Review a submission**: Navigate to Review Queue → list shows pending items → click item → detail view with diff.
2. **Approve**: Review diff → satisfied → click "Approve" → optional comment → confirm → submission published.
3. **Reject**: Review diff → issues found → click "Reject" → enter reason → confirm → submission returned to draft.
4. **Request revision**: Review diff → minor issues → click "Request Changes" → enter specific changes needed → confirm → Contributor notified.
5. **Filter queue**: Use filter bar to show only "pending_review" notes submissions → review all → batch approve.

### 19.6 Permission Constraints
- **Main Contributor only**: Access the Review Queue page and perform all review actions.
- **Contributors**: Can view the status of their own submissions (read-only) but cannot review others'.
- **Teachers/Students**: No access to Review Queue; cannot view pending submissions.

### 19.7 Technical Implementation Prerequisites
- `'use client'` for interactive diff viewer, filter/sort controls, and batch operations.
- Diff viewer component must handle JSONB diff format. Use a simple recursive object diff renderer; no external diff library needed for MVP.
- `editor_submissions.changes` stores a JSONB object of shape: `{ field: { old: any, new: any } }`.
- Notification to Contributor on status change via in-app notification system (MVP: badge count on NavBar).
- Status change triggers re-fetch of affected data (e.g., approved curriculum edit → curriculum pages should refresh).

### 19.8 Error Handling
- **Concurrent review**: If two Main Contributors open the same submission, the first to act locks it (`under_review` status). The second sees a warning: "This submission is being reviewed by [name]."
- **Stale submissions**: Submissions older than 30 days in `pending_review` get an "aging" badge; auto-escalated to all Main Contributors via dashboard alert.
- **Approval of already-published data**: System checks if the target data was modified since submission; warns reviewer if conflict detected.

### 19.9 Integration Requirements
- Feeds from `editor_submissions` table, populated by Curriculum & Notes Editor (Section 16) and Exam Data Editor.
- On approval, triggers a refresh of the affected feature's published data (curriculums, notes, exam boundaries).
- Dashboard shows a "Pending Reviews" count badge for Main Contributors.

---

## 20. Contributor Profiles & Public Profiles — Detailed Specification

### 20.1 Overview
Contributor Profiles are publicly visible portfolio pages that showcase a Contributor's published work, specialisations, and qualifications. Public Profiles provide a general read-only view of any user's basic information, while Contributor Profiles add portfolio-level content.

### 20.2 Data Model

| Table | Key Fields | Description |
|---|---|---|
| `profiles` | id, username, display_name, avatar_url, bio, role, is_public, social_links (JSONB), created_at | Base profile for all users |
| `contributor_profiles` | id, user_id, specialisations (text[]), qualifications (text[]), published_notes_count, published_curriculums_count, website, github, linkedin, availability | Extended profile for Contributors |

### 20.3 Core Functional Requirements

#### 20.3.1 Public Profile (All Roles)
- **Profile hero**: Avatar, display name, username, role badge, bio (max 280 characters).
- **Profile activity**: Recent public activity (notes published, curriculum contributions) shown as a timeline.
- **Profile stats**: For Contributors: count of published notes, curriculums contributed, total topic edits. For other roles: join date, study streak (if public).
- **Social links**: Display linked social accounts (GitHub, LinkedIn, website) as icon links.
- **Visibility toggle**: User can set profile to `public` or `private`; private profiles show only avatar, name, and role.

#### 20.3.2 Contributor Profile (Contributor & Main Contributor Only)
- **Specialisations**: List of subjects/expertise areas (e.g., "Mathematics, A-Level Physics, Python").
- **Qualifications**: List of academic/professional qualifications (e.g., "PhD Mathematics, Cambridge").
- **Portfolio summary**: Auto-generated stats: "X notes published", "Y curriculum contributions", "Z topics edited".
- **Published work**: Clickable list of published notes and curriculum items the Contributor has authored.
- **Availability indicator**: Optional field showing "Available for collaboration" / "Not currently available".
- **Verified badge**: A checkmark badge indicating the contributor has been verified by a Main Contributor.

#### 20.3.3 Academic Certifications
Structured academic certification display for formal qualifications (IGCSE, A-Level, IELTS, etc.). Separate from the free-form Achievements section.

- **Certification types**: IGCSE, AS Level, A Level, IELTS, TOEFL, SAT, Other.
- **Structured fields**: Type badge, subject (e.g., "Mathematics"), exam board (e.g., "Cambridge"), grade (e.g., "A*", "Band 8.0"), year, optional certificate image upload.
- **Verification**: Main Contributors can verify certifications (toggle `is_verified`), showing a verified checkmark on the profile.
- **Display**: Grid or list of certification cards with type icon, subject, grade, year, and verification badge.
- **Visibility**: Each certification can be individually hidden (`is_hidden`). Public profiles show only non-hidden certifications.
- **Ordering**: Drag-to-reorder in the profile editor.

#### 20.3.4 Club Integration Panel
Users can selectively display their club memberships, projects, and activity on their public profile portfolio.

- **Club memberships section**: A "Clubs" panel on the profile showing club badges (name, role, member count). Clicking navigates to the club's public page.
- **Club projects in portfolio**: Club projects the user contributed to appear in the Projects section with a "Club Project" badge, alongside personal projects.
- **Club activity in timeline**: Club-related events and contributions appear in the Activity Timeline with club context labels.
- **Editor controls** (in Settings → Profile Editor → Settings tab):
  - `show_club_memberships` toggle
  - `show_club_projects` toggle
  - `show_club_activity` toggle
- Default: all enabled. User must explicitly opt out.

#### 20.3.5 Profile Shareability
Enhanced sharing and discoverability for public profiles.

- **Custom URL slug**: Users can set a `custom_url_slug` (e.g., "john-doe") for a clean profile URL at `/p/[slug]`. The original `/profile/[username]` route continues to work.
- **SEO metadata**: Public profile pages include `<title>`, `<meta description>`, and Open Graph tags for rich link previews when shared on social media.
- **Share button**: A "Share Profile" button on the profile hero that copies the profile URL or opens the native share dialog (on mobile).
- **Social link embeds**: Social links on the profile render as rich icon buttons with platform-specific styling (GitHub, LinkedIn, Facebook, Twitter/X, Instagram, YouTube, custom website).

### 20.4 User Interaction Workflows
1. **View a profile**: Click user avatar/name anywhere in the app → navigates to `/(public)/profile/[username]`.
2. **Edit own profile**: Settings → Profile Editor → update avatar, display name, bio, social links, visibility toggle → save.
3. **Edit contributor profile**: If Contributor role → Settings → Contributor Profile tab → update specialisations, qualifications, availability → save.
4. **Navigate to published work**: On a Contributor's profile, click "View Notes" or "View Curriculum Items" → opens filtered Notes Library or Curriculum browser.

### 20.5 Permission Constraints
- **All roles**: Edit own `profiles` record. View any public profile.
- **Contributor/Main Contributor**: Edit own `contributor_profiles` record.
- **Main Contributor**: Can verify a Contributor (toggle `verified` flag on `contributor_profiles`).
- Private profiles: Only the owner sees their own private profile; others see a "This profile is private" placeholder.

### 20.6 Technical Implementation Prerequisites
- Profile pages use `/(public)/` route group (no auth required for viewing).
- `useProfile.ts` hook fetches profile by username; handles both authenticated (owner can edit) and unauthenticated (read-only) states.
- `ProfileHero.tsx` renders the top section; `ProfileActivity.tsx` renders the timeline; `ProfileStats.tsx` renders stats.
- Avatar upload uses Supabase Storage; stored under `avatars/{userId}/` with automatic 200×200 crop (client-side).

### 20.7 Error Handling
- **Username not found**: 404 page with "User not found" message; link to Explore Profiles.
- **Profile data fetch fails**: Show skeleton loader; retry once on error; if still fails, show "Could not load profile" with retry button.
- **Avatar upload too large**: Limit to 5MB; validate before upload; show error toast with size limit message.

### 20.8 Integration Requirements
- `RelatedContent.tsx` on profile pages surfaces the user's public notes and contributions.
- Contributor verification status is read by the Explore Pages (Section 21) for filtering featured contributors.
- Profile data is consumed by the Role Upgrade System (Section 22) for review context.

---

## 21. Explore Pages — Detailed Specification

### 21.1 Overview
Explore Pages are public-facing discovery interfaces that allow unauthenticated and authenticated users to browse Clubs and Public Profiles. They serve as the main entry point for community discovery.

### 21.2 Feature Domains

#### 21.2.1 Club Discovery (`/explore/clubs`)
- **Club grid**: Card-based grid showing clubs with name, description, member count, tags, and cover image.
- **Search**: Free-text search against club name and description.
- **Filters**: By category/tag, by member count range, by activity level (recently active, most members, newest).
- **Sort**: By recently active, most members, newest, alphabetical.
- **Club card actions**: "Join" button (if open join mode), "Request to Join" (if approval-based), "View Details" link.
- **Pagination**: Infinite scroll or page-based (MVP: 12 per page, load more button).

#### 21.2.2 Profile Discovery (`/explore/profiles`)
- **Profile grid**: Card-based grid showing public profiles with avatar, display name, role badge, bio preview, and stat summary.
- **Search**: Free-text search against display name, username, bio.
- **Filters**: By role (student, teacher, contributor, main_contributor), by specialisation (Contributor profiles only).
- **Sort**: By recently active, most notes published (Contributors), most study streak (students), alphabetical.
- **Profile card actions**: "View Profile" link.
- **Featured contributors**: A top row or section highlighting verified Contributors (pinned by Main Contributors).

#### 21.2.3 Club Showcase (`/c/[slug]` and public club detail)
- **Landing page**: Public-facing mini-website per club at `/(public)/clubs/[id]` featuring hero banner, tagline, project gallery, milestone tracker, member spotlight, and announcements feed.
- **Custom slug**: Clubs with a `custom_domain_slug` are accessible at `/c/[slug]` for clean shareable links.

### 21.3 User Interaction Workflows
1. **Discover clubs**: Navigate to Explore → Clubs → browse grid → search/filter → click card → view club detail → join or request to join.
2. **Discover profiles**: Navigate to Explore → Profiles → browse grid → search/filter → click card → view public profile.
3. **Navigate to club detail**: From club card → click club name → navigates to `/(public)/clubs/[id]` for public view.

### 21.4 Permission Constraints
- **All roles (including unauthenticated)**: View Explore Pages. Public data only.
- **Join actions**: Require authentication. Unauthenticated users see "Log in to join" on club cards.
- **Authentication-optional**: Browse is fully public; interaction (join, view detailed profiles) requires login.

### 21.5 Technical Implementation Prerequisites
- Pages under `/(public)/` route group; no middleware auth check.
- `'use client'` for search input, filter dropdowns, sort controls, and infinite scroll.
- `ClubCard.tsx` and `ProfileCard.tsx` are reusable components accepting typed data props.
- Search is client-side for MVP (filtering a fetched list); server-side search via Supabase for production.

### 21.6 Error Handling
- **Empty search results**: Show "No clubs found matching your search" with a suggestion to clear filters.
- **Network failure**: Show cached data if available; otherwise show error state with retry button.
- **Pagination end**: "You've reached the end" message when no more results to load.

### 21.7 Integration Requirements
- Club data consumed from `clubs` table; club cards show member count from `club_members` aggregation.
- Profile data consumed from `profiles` combined with `contributor_profiles` for Contributors.
- "Featured contributors" section is curated via a `featured` flag on `contributor_profiles` (set by Main Contributors).

---

## 22. Role Upgrade System — Detailed Specification

### 22.1 Overview
The Role Upgrade System manages the workflow for users requesting higher role levels and for Main Contributors to review, approve, or reject those requests. It also supports direct promotion by Main Contributors.

### 22.2 Data Model

| Table | Key Fields | Description |
|---|---|---|
| `role_upgrade_requests` | id, requester_id, requested_role, current_role, justification, reviewer_id, status, reviewer_comment, created_at, reviewed_at | Tracks each upgrade request |
| `status` enum | `pending`, `under_review`, `approved`, `rejected` | Lifecycle states |

### 22.3 Core Functional Requirements

#### 22.3.1 Request Submission (Student → Teacher or Teacher → Contributor)
- **Role selection**: User navigates to Settings → Role Upgrade → selects desired role from available upgrade paths.
- **Justification**: Free-text field (min 50 characters, max 1000) explaining why the upgrade is needed.
- **Evidence attachments**: Optional file upload (CV, teaching certification, portfolio link) for Teacher → Contributor upgrades. Files stored in Supabase Storage under `role-upgrades/{userId}/`.
- **Terms acknowledgement**: Checkbox confirming understanding of new role responsibilities.
- **Submission confirmation**: Success message with estimated review time ("A Main Contributor will review your request within 7 days").

#### 22.3.2 Upgrade Review (Main Contributor)
- **Request list**: Table view in `/main-contributor/role-upgrades/` with columns: Requester, Current Role, Requested Role, Date, Status, Actions.
- **Filters**: By status (pending/under_review/approved/rejected), by requested role, date range.
- **Requester profile**: Click requester name → view their public profile, current stats, and any previous upgrade history.
- **Review actions**:
  - **Approve**: Click "Approve" → dropdown to select target role → optional note → upgrade applied immediately (`profiles.role` updated).
  - **Reject**: Click "Reject" → mandatory reason → status updated; requester notified.
- **Direct promotion**: Button "Promote User" → enter username or email → select target role → confirmation → upgrade applied immediately without a prior request.

#### 22.3.3 Post-Upgrade Effects
- On approval: `profiles.role` is updated. User's session is invalidated (they must re-login to get new role claims).
- On rejection: User can re-apply after 30 days (cooldown enforced client-side and server-side).
- Notifications: In-app notification sent to requester on status change (MVP: badge on NavBar; future: email).

### 22.4 User Interaction Workflows
1. **Submit upgrade request**: Settings → Role Upgrade → select role → write justification → attach evidence (if applicable) → acknowledge terms → submit.
2. **Review a request**: Main Contributor → Role Upgrades → list → click request → view justification + evidence + requester profile → approve/reject.
3. **Direct promotion**: Main Contributor → Role Upgrades → "Promote User" → search user → select role → confirm → user promoted.

### 22.5 Permission Constraints
- **Student**: Can request upgrade to `teacher`.
- **Teacher**: Can request upgrade to `contributor`.
- **Contributor**: Cannot request upgrade; Main Contributors may directly promote to `main_contributor`.
- **Main Contributor**: Can review all requests and perform direct promotions. Only role that can approve/reject upgrades.
- **Role upgrade direction**: `student → teacher → contributor → main_contributor`. No downgrades or skips.

### 22.6 Technical Implementation Prerequisites
- `'use client'` for the upgrade request form, file upload, and review interface.
- `profiles.role` update triggers Supabase session refresh; user must re-authenticate to receive new JWT claims.
- File uploads for evidence stored under `role-upgrades/{userId}/` path in Supabase Storage.
- 30-day cooldown enforced by checking `role_upgrade_requests` for any `rejected` request in the last 30 days.

### 22.7 Error Handling
- **Duplicate request**: If user has a `pending` request, block new submission: "You already have a pending upgrade request."
- **Cooldown violation**: If user was rejected within 30 days, show "You can re-apply after [date]."
- **Evidence upload failure**: Show error toast with retry; allow submission without evidence (optional).
- **Role already assigned**: If user's role already matches requested role, show "You already have this role."
- **Invalid upgrade path**: Block requests that skip a level (e.g., Student → Contributor) with explanation.

### 22.8 Integration Requirements
- Updates `profiles.role` directly; all role-gated features throughout the app respond to the change immediately (via `useRole()`).
- Notification system (MVP: NavBar badge) alerts users to status changes.
- Dashboard shows upgrade request status for users with pending requests.
- Review interface re-uses `UsersTable.tsx` and profile components from Contributor Manager.

---

## 23. Workspace Architecture — Detailed Specification

### 23.1 Overview
The workspace unifies four key content domains — **Courses**, **Notes**, **Flashcards**, and **Exams** — into a coherent learning environment. Components use intelligent filtering and cross-linking (`RelatedContent.tsx`) to surface relevant artifacts contextually based on the user's current curriculum, active topics, and study patterns.

### 23.2 Domain Map

| Domain | Primary Feature | Data Source | Cross-Linking Target |
|---|---|---|---|
| **Courses** | Lesson Tracker (Section 15), Course Manager (Section 15) | `curriculums`, `subjects`, `topics`, `user_curriculums`, `topic_progress` | Notes by topic_id, Flashcards by topic_id |
| **Notes** | Notes Editor (Section 16), Notes Library | `notes` (blocks JSONB), `user_saved_notes` | Flashcards by topic_id, Courses by curriculum |
| **Flashcards** | Deck Library (Section 14), Study Sessions | `decks`, `cards`, `card_reviews` | Notes by topic_id, Courses by topic |
| **Exams** | Exam Countdown (Section 17), Grade Calculator (Section 18) | `exams`, `exam_countdowns`, `grade_boundaries`, `grade_entries` | Flashcards by subject, Notes by subject |

### 23.3 RelatedContent.tsx — Cross-Feature Linking System

#### 23.3.1 Matching Logic
`RelatedContent.tsx` is a shared component injected into detail pages (deck view, note reader, exam detail, topic view). It uses the following matching strategies:

| Strategy | Match Criteria | Example |
|---|---|---|
| **Topic match** | Same `topic_id` across notes, decks, and exams | A note about "Cell Biology" shows flashcards from a deck also tagged "Cell Biology" |
| **Subject match** | Same `subject_id` (inferred from topic → subject) | An A-Level Physics note shows related Physics flashcards |
| **Tag overlap** | Shared tags between notes and decks | Note tagged "calculus, derivatives" shows decks also tagged "calculus" |
| **Recent study** | User's recently reviewed flashcards in the same subject | After studying Chemistry flashcards, a Chemistry note shows "Recently studied" |

#### 23.3.2 Display
- Rendered as a horizontal scrollable strip of cards below the main content.
- Each card shows: title, type icon (note/flashcard/deck), brief preview (first 50 chars), relevance badge ("High match" / "Related").
- Click navigates to the related content page.
- Empty state: "No related content found. Explore more [subject] notes or flashcards."
- Maximum 6 items shown; sorted by relevance score then recency.

### 23.4 Intelligent Filtering
- **Curriculum-aware filters**: When viewing notes within a course context, filters default to the course's curriculum. Manual override available.
- **Cross-domain search**: Unified search bar in the workspace header that searches across notes, flashcards, and exam entries simultaneously. Results grouped by domain with type badges.
- **Recently viewed**: Sidebar or dropdown showing last 5 viewed items across all domains.

### 23.5 Integration Requirements
- `RelatedContent.tsx` imports data through the `database.ts` facade; accepts `topicId`, `subjectId`, `tags`, and `excludeIds` as props.
- All feature detail pages (Notes Library, Deck Library, Exam Countdown detail, Lesson Tracker topic view) must render `<RelatedContent />` with appropriate props.
- Workspace search queries are aggregated client-side across fetched domain lists for MVP; server-side full-text search for production.

---

## 24. Exam Data Integration — Detailed Specification

### 24.1 Overview
Exam Data Integration ensures that exam-related features (Exam Countdown, Grade Calculator, Flashcards) share a consistent, Contributor-maintained dataset of exam configurations, grade boundaries, and qualification structures.

### 24.2 Data Sources & Flow

```
Contributor (Exam Data Editor) → exams table + grade_boundaries table
                                          ↓
              ┌──────────────────────────┬──────────────────────────┐
              ↓                          ↓                          ↓
    Exam Countdown (§17)      Grade Calculator (§18)      Flashcards (§14)
    (reads exams table)       (reads grade_boundaries)    (uses subject/paper
                                                           for topic matching)
```

### 24.3 Exam Data Editor (Contributor Tool)
- **Exam CRUD**: Add/edit/delete exam records in the `exams` table. Fields: subject, exam_board, paper_code, date, start_time, duration, session, series, year.
- **Grade boundary CRUD**: Add/edit/delete grade boundaries in the `grade_boundaries` table. Fields: qualification, subject, paper_code, year, series, component, raw_mark_max, ums_max, letter-grade thresholds (a through u).
- **Bulk import**: Upload a CSV/JSON file to batch-import exam records and grade boundaries. Validation report generated on import showing success/failure per row.
- **Boundary validation**: Rules: `grade_a > grade_b > grade_c > grade_d > grade_e > grade_f > grade_g > grade_u`; `raw_mark_max > 0`, `ums_max >= raw_mark_max`. Invalid boundaries flagged with specific error messages.
- **Versioning**: Each edit creates a new version of the boundary record; previous versions preserved for historical grade calculation.

### 24.4 Grade Calculator Consumption
The Grade Calculator (Section 18.3) consumes `grade_boundaries` data as follows:

1. User selects qualification + subject → system queries `grade_boundaries` for matching records.
2. For each selected paper, the system loads its `raw_mark_max`, `ums_max`, and letter-grade thresholds.
3. Raw → UMS conversion: `UMS = (rawMark / raw_mark_max) × ums_max` (linear), then rounded to nearest integer.
4. Overall grade determined by comparing total UMS against qualification-level boundaries (highest boundary ≤ total UMS).
5. If multiple series/years are available, the most recent complete set is used by default; user can override to use a specific year/series.

### 24.5 Exam Countdown Consumption
The Exam Countdown (Section 17) consumes `exams` data as follows:

1. User searches for pre-defined exams → system queries `exams` matching subject/exam_board/paper_code.
2. Selected exam's date, time, and duration are copied into the user's `exam_countdowns` record.
3. If exam date/time changes (Contributor updates the `exams` table), the user's countdown shows a "Date updated" badge and offers to sync the new date.

### 24.6 Flashcard Cross-Linking
- Flashcards can be tagged with `paper_code` or `exam_board` to surface during exam-specific study sessions.
- When a user is viewing an exam countdown, `RelatedContent.tsx` shows flashcards tagged with the same `exam_board` + `subject` combination.

### 24.7 Permission Constraints
- **Contributor/Main Contributor**: Full CRUD on `exams` and `grade_boundaries` tables.
- **Student/Teacher**: Read-only access to published exam data.
- Unpublished exam data (draft status) is visible only to the Contributor who created it and Main Contributors.

### 24.8 Error Handling
- **Boundary inconsistency**: If grade thresholds are not strictly decreasing (a > b > c > ...), the system rejects the boundary set with field-level error messages.
- **Missing boundary set**: Grade Calculator shows "Boundaries not yet available for this qualification/subject/year. Check back later or contact a Contributor."
- **Exam date conflict**: If two exams have the same date/time, the Exam Data Editor shows a warning but allows it (user can choose which to track).
- **Import validation**: CSV/JSON import generates a downloadable error report listing row numbers and specific validation failures.

---

## 25. Row-Level Security (RLS) Policies — Detailed Specification

### 25.1 Overview
Row-Level Security (RLS) is enabled on every table that contains user-specific or role-specific data. Policies follow a consistent pattern: `{table_name}_{operation}_policy`. All policies use `auth.uid()` for user identification and reference the user's role through the `user_role` JWT claim from the `custom_access_token` hook.

### 25.2 Policy Naming Convention
| Pattern | Example |
|---|---|
| `{table}_owner_{op}` | `profiles_owner_select` |
| `{table}_member_{op}` | `classroom_members_member_select` |
| `{table}_public_read` | `clubs_public_read` |
| `{table}_reviewer_{op}` | `editor_submissions_reviewer_select` |

### 25.3 Profiles & Extended Profiles

| Table | Policy Name | Operation | Target Role | Rule |
|---|---|---|---|---|
| `profiles` | `profiles_owner_select` | SELECT | Authenticated | `auth.uid() = id` |
| `profiles` | `profiles_owner_insert` | INSERT | Authenticated | `auth.uid() = id` |
| `profiles` | `profiles_owner_update` | UPDATE | Authenticated | `auth.uid() = id` AND `role` only changeable by main_contributor via server-side helper |
| `contributor_profiles` | `contributor_profiles_owner_all` | ALL | Contributor, Main Contributor | `auth.uid() = user_id` |
| `contributor_profiles` | `contributor_profiles_public_read` | SELECT | anon, authenticated | `true` (public read) |
| `student_profiles` | `student_profiles_owner_all` | ALL | Student, Teacher, Contributor, Main Contributor | `auth.uid() = user_id` |
| `teacher_profiles` | `teacher_profiles_owner_all` | ALL | Teacher, Contributor, Main Contributor | `auth.uid() = user_id` |

### 25.4 Classroom Feature

| Table | Policy Name | Operation | Target Role | Rule |
|---|---|---|---|---|
| `classrooms` | `classrooms_teacher_all` | ALL | Teacher | `auth.uid() = creator_id` |
| `classrooms` | `classrooms_student_select` | SELECT | Student | Member of classroom (`classroom_members`) |
| `classroom_members` | `classroom_members_self_insert` | INSERT | Student | `auth.uid() = user_id` AND join code matches `classrooms.join_code` |
| `classroom_members` | `classroom_members_member_select` | SELECT | Authenticated | `auth.uid() = user_id` OR teacher of classroom |
| `classroom_members` | `classroom_members_teacher_delete` | DELETE | Teacher | `auth.uid()` is teacher of the classroom |
| `classroom_curriculums` | `classroom_curriculums_teacher_all` | ALL | Teacher | `auth.uid()` is teacher of the classroom via `classrooms.creator_id` |
| `classroom_curriculums` | `classroom_curriculums_member_select` | SELECT | Student | Member of the classroom |
| `assignments` | `assignments_teacher_all` | ALL | Teacher | `auth.uid()` is teacher of the parent classroom |
| `assignments` | `assignments_member_select` | SELECT | Student | Member of the parent classroom |
| `assignment_submissions` | `assignment_submissions_owner_all` | ALL | Student | `auth.uid() = user_id` |
| `assignment_submissions` | `assignment_submissions_teacher_select` | SELECT | Teacher | `auth.uid()` is teacher of the parent classroom |
| `quizzes` | `quizzes_teacher_all` | ALL | Teacher | `auth.uid()` is teacher of the parent classroom |
| `quizzes` | `quizzes_member_select` | SELECT | Student | Member of the parent classroom |
| `quiz_attempts` | `quiz_attempts_owner_all` | ALL | Student | `auth.uid() = user_id` |
| `quiz_attempts` | `quiz_attempts_teacher_select` | SELECT | Teacher | `auth.uid()` is teacher of the parent classroom |
| `discussion_topics` | `discussion_topics_member_all` | ALL | Authenticated | `auth.uid() = creator_id` AND member of parent classroom |
| `discussion_topics` | `discussion_topics_member_select` | SELECT | anon | `true` (public read for published topics) |
| `discussion_replies` | `discussion_replies_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |
| `classroom_resources` | `classroom_resources_teacher_all` | ALL | Teacher | `auth.uid()` is teacher of the parent classroom |
| `classroom_resources` | `classroom_resources_member_select` | SELECT | Student | Member of the parent classroom |

### 25.5 Club Feature

| Table | Policy Name | Operation | Target Role | Rule |
|---|---|---|---|---|
| `clubs` | `clubs_owner_all` | ALL | Contributor, Main Contributor | `auth.uid() = created_by` |
| `clubs` | `clubs_public_read` | SELECT | anon | `is_public = true` |
| `club_members` | `club_members_self_insert` | INSERT | Authenticated | `auth.uid() = user_id` AND club join mode is `open` or request is `approved` |
| `club_members` | `club_members_member_select` | SELECT | Authenticated | `auth.uid() = user_id` OR member of the same club |
| `club_members` | `club_members_owner_delete` | DELETE | Authenticated | `auth.uid()` is the member being removed OR club leader |
| `club_messages` | `club_messages_member_all` | ALL | Authenticated | `auth.uid() = sender_id` AND active member of the club |
| `club_messages` | `club_messages_member_select` | SELECT | Authenticated | Active member of the club |
| `club_announcements` | `club_announcements_leader_all` | ALL | Contributor, Main Contributor | `auth.uid() = created_by` AND leader of the club |
| `club_announcements` | `club_announcements_member_select` | SELECT | Authenticated | Active member of the club |
| `club_links` | `club_links_member_all` | ALL | Authenticated | `auth.uid() = shared_by` AND active member of the club |
| `club_links` | `club_links_member_select` | SELECT | Authenticated | Active member of the club |
| `club_join_requests` | `club_join_requests_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |
| `club_join_requests` | `club_join_requests_leader_select` | SELECT | Contributor, Main Contributor | Leader of the club |
| `club_join_requests` | `club_join_requests_leader_update` | UPDATE | Contributor, Main Contributor | Leader of the club (approve/reject) |
| `club_projects` | `club_projects_member_all` | ALL | Authenticated | `auth.uid() = created_by` AND active member of the club |
| `club_projects` | `club_projects_member_select` | SELECT | Authenticated | Active member of the club |
| `club_events` | `club_events_leader_all` | ALL | Contributor, Main Contributor | `auth.uid() = created_by` AND leader of the club |
| `club_events` | `club_events_member_select` | SELECT | Authenticated | Active member of the club |
| `club_curriculums` | `club_curriculums_leader_all` | ALL | Contributor, Main Contributor | Leader of the club |
| `club_curriculums` | `club_curriculums_member_select` | SELECT | Authenticated | Active member of the club |
| `club_subjects` | `club_subjects_leader_all` | ALL | Contributor, Main Contributor | Leader of the club |
| `club_subjects` | `club_subjects_member_select` | SELECT | Authenticated | Active member of the club |

### 25.6 Personal Study Tools

| Table | Policy Name | Operation | Target Role | Rule |
|---|---|---|---|---|
| `timetable_events` | `timetable_events_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |
| `pomodoro_sessions` | `pomodoro_sessions_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |
| `decks` | `decks_owner_all` | ALL | Authenticated | `auth.uid() = created_by` |
| `decks` | `decks_public_select` | SELECT | anon | `is_public = true` |
| `cards` | `cards_owner_all` | ALL | Authenticated | `auth.uid()` is owner of parent deck (`decks.created_by`) |
| `cards` | `cards_public_select` | SELECT | anon | Parent deck is public |
| `card_reviews` | `card_reviews_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |
| `notes` | `notes_owner_all` | ALL | Contributor, Main Contributor | `auth.uid() = created_by` |
| `notes` | `notes_public_select` | SELECT | anon | `visibility = 'public'` AND `status = 'published'` |
| `user_saved_notes` | `user_saved_notes_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |

### 25.7 Exam Feature

| Table | Policy Name | Operation | Target Role | Rule |
|---|---|---|---|---|
| `exams` | `exams_contributor_all` | ALL | Contributor, Main Contributor | Created by the user |
| `exams` | `exams_public_select` | SELECT | anon | `true` (published exams are public read) |
| `exam_schedules` | `exam_schedules_contributor_all` | ALL | Contributor, Main Contributor | Creator |
| `exam_schedules` | `exam_schedules_public_select` | SELECT | anon | `true` |
| `exam_countdowns` | `exam_countdowns_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |
| `grade_boundaries` | `grade_boundaries_contributor_all` | ALL | Contributor, Main Contributor | Creator |
| `grade_boundaries` | `grade_boundaries_public_select` | SELECT | anon | `true` |
| `grade_entries` | `grade_entries_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |
| `user_enrollments` | `user_enrollments_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |
| `user_exam_overrides` | `user_exam_overrides_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |
| `user_exam_history` | `user_exam_history_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |

### 25.8 Curriculum & Review

| Table | Policy Name | Operation | Target Role | Rule |
|---|---|---|---|---|
| `curriculums` | `curriculums_contributor_all` | ALL | Contributor, Main Contributor | Creator |
| `curriculums` | `curriculums_public_select` | SELECT | anon | `status = 'published'` |
| `subjects` | `subjects_contributor_all` | ALL | Contributor, Main Contributor | Creator of parent curriculum |
| `subjects` | `subjects_public_select` | SELECT | anon | Parent curriculum is published |
| `topics` | `topics_contributor_all` | ALL | Contributor, Main Contributor | Creator of parent curriculum |
| `topics` | `topics_public_select` | SELECT | anon | Parent curriculum is published |
| `resources` | `resources_contributor_all` | ALL | Contributor, Main Contributor | Creator |
| `resources` | `resources_public_select` | SELECT | anon | Published |
| `user_curriculums` | `user_curriculums_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |
| `topic_progress` | `topic_progress_owner_all` | ALL | Authenticated | `auth.uid() = user_id` |
| `editor_submissions` | `editor_submissions_owner_select` | SELECT | Contributor, Main Contributor | `auth.uid() = contributor_id` (own submissions) |
| `editor_submissions` | `editor_submissions_reviewer_select` | SELECT | Main Contributor | `true` (see all submissions) |
| `editor_submissions` | `editor_submissions_reviewer_update` | UPDATE | Main Contributor | `status = 'pending_review'` (only pending can be reviewed) |
| `review_queue` | `review_queue_reviewer_all` | ALL | Main Contributor | `true` |
| `review_queue` | `review_queue_owner_select` | SELECT | Contributor | `auth.uid() = contributor_id` |
| `version_history` | `version_history_owner_select` | SELECT | Contributor, Main Contributor | `auth.uid() = created_by` |

### 25.9 Role Upgrade System

| Table | Policy Name | Operation | Target Role | Rule |
|---|---|---|---|---|
| `role_upgrade_requests` | `role_upgrade_requests_owner_all` | ALL | Authenticated | `auth.uid() = requester_id` |
| `role_upgrade_requests` | `role_upgrade_requests_reviewer_select` | SELECT | Main Contributor | `true` (see all requests) |
| `role_upgrade_requests` | `role_upgrade_requests_reviewer_update` | UPDATE | Main Contributor | `status = 'pending'` (only pending can be actioned) |
| `role_upgrade_applications` | `role_upgrade_applications_owner_all` | ALL | Authenticated | `auth.uid() = applicant_id` |
| `role_upgrade_applications` | `role_upgrade_applications_reviewer_select` | SELECT | Main Contributor | `true` |

### 25.10 Policy Enablement
All RLS policies are enabled in the migration file `YYYYMMDDHHMMSS_enable_rls.sql`. Each `CREATE POLICY` statement includes `ON {table} FOR {operation} TO {role} USING ({condition})`. The `supabase_realtime` publication is configured to only replicate tables that require realtime subscriptions (see Section 28).

---

## 26. Database Index Specification — Detailed Specification

### 26.1 Overview
Indexes are defined to cover all high-frequency query patterns identified across features. Index design follows Supabase Postgres best practices: composite indexes for multi-column filters, partial indexes for status-scoped queries, and foreign key indexes on all referencing columns.

### 26.2 Composite Indexes

| Index Name | Table | Columns | Feature | Query Pattern |
|---|---|---|---|---|
| `idx_classroom_members_classroom_user` | `classroom_members` | `(classroom_id, user_id)` | Classrooms | Member lookup and membership verification |
| `idx_assignments_classroom_status` | `assignments` | `(classroom_id, status)` | Classrooms | Filter assignments by status within a classroom |
| `idx_assignment_submissions_assignment_user` | `assignment_submissions` | `(assignment_id, user_id)` | Classrooms | Per-student submission lookup |
| `idx_quiz_attempts_quiz_user` | `quiz_attempts` | `(quiz_id, user_id)` | Classrooms | Per-student quiz attempt lookup |
| `idx_club_members_club_user` | `club_members` | `(club_id, user_id)` | Clubs | Membership verification |
| `idx_club_messages_club_created` | `club_messages` | `(club_id, created_at)` | Clubs | Chat message history by club |
| `idx_club_join_requests_club` | `club_join_requests` | `(club_id, status)` | Clubs | Pending join requests for club leaders |
| `idx_card_reviews_user_next_review` | `card_reviews` | `(user_id, next_review_date)` | Flashcards | Due card queries for SRS |
| `idx_cards_deck_order` | `cards` | `(deck_id, order_index)` | Flashcards | Card ordering within a deck |
| `idx_decks_user_public` | `decks` | `(created_by, is_public)` | Flashcards | User's decks filtered by visibility |
| `idx_topic_progress_user_topic` | `topic_progress` | `(user_id, topic_id)` | Lesson Tracker | Per-user topic completion status |
| `idx_user_curriculums_user` | `user_curriculums` | `(user_id, curriculum_id)` | Course Manager | User enrolment lookup |
| `idx_exam_countdowns_user` | `exam_countdowns` | `(user_id, exam_date)` | Exam Countdown | User's exam list sorted by date |
| `idx_grade_entries_user` | `grade_entries` | `(user_id, created_at)` | Grade Calculator | User's saved calculations |
| `idx_notes_user_status` | `notes` | `(created_by, status)` | Notes Editor | Contributor's notes filtered by status |
| `idx_user_saved_notes_user` | `user_saved_notes` | `(user_id, note_id)` | Notes Editor | User's saved notes lookup |
| `idx_editor_submissions_status` | `editor_submissions` | `(status, created_at)` | Review Queue | Pending submissions sorted by age |
| `idx_role_upgrade_requests_status` | `role_upgrade_requests` | `(status, created_at)` | Role Upgrades | Pending requests sorted by age |

### 26.3 Partial Indexes

| Index Name | Table | Filter Condition | Purpose |
|---|---|---|---|
| `idx_notes_public_published` | `notes` | `WHERE visibility = 'public' AND status = 'published'` | Public notes library queries |
| `idx_decks_public_active` | `decks` | `WHERE is_public = true AND archived = false` | Public deck discovery |
| `idx_editor_submissions_reviewable` | `editor_submissions` | `WHERE status = 'pending_review'` | Review queue pending items |
| `idx_clubs_public_active` | `clubs` | `WHERE is_public = true` | Public club discovery |
| `idx_role_upgrade_requests_pending` | `role_upgrade_requests` | `WHERE status = 'pending'` | Pending upgrade requests |
| `idx_discussion_topics_published` | `discussion_topics` | `WHERE status = 'published'` | Public discussion topics |

### 26.4 Foreign Key Indexes
All columns that reference another table via foreign key must have an index. Key foreign key columns requiring indexes (beyond those already covered by composites above):

| Column | Referenced Table | Index Name |
|---|---|---|
| `classrooms.creator_id` | `profiles.id` | `idx_classrooms_creator` |
| `classroom_members.classroom_id` | `classrooms.id` | `idx_classroom_members_classroom` |
| `assignments.classroom_id` | `classrooms.id` | `idx_assignments_classroom` |
| `quizzes.classroom_id` | `classrooms.id` | `idx_quizzes_classroom` |
| `discussion_topics.classroom_id` | `classrooms.id` | `idx_discussion_topics_classroom` |
| `clubs.created_by` | `profiles.id` | `idx_clubs_creator` |
| `club_members.club_id` | `clubs.id` | `idx_club_members_club` |
| `club_messages.club_id` | `clubs.id` | `idx_club_messages_club` |
| `club_messages.sender_id` | `profiles.id` | `idx_club_messages_sender` |
| `decks.created_by` | `profiles.id` | `idx_decks_creator` |
| `cards.deck_id` | `decks.id` | `idx_cards_deck` |
| `card_reviews.card_id` | `cards.id` | `idx_card_reviews_card` |
| `notes.created_by` | `profiles.id` | `idx_notes_creator` |
| `user_saved_notes.note_id` | `notes.id` | `idx_user_saved_notes_note` |
| `exams.subject_id` | `subjects.id` | `idx_exams_subject` |
| `grade_boundaries.subject_id` | `subjects.id` | `idx_grade_boundaries_subject` |
| `editor_submissions.contributor_id` | `profiles.id` | `idx_editor_submissions_contributor` |
| `review_queue.contributor_id` | `profiles.id` | `idx_review_queue_contributor` |
| `role_upgrade_requests.requester_id` | `profiles.id` | `idx_role_upgrade_requests_requester` |

### 26.5 Index Creation Strategy
- All indexes are created `CONCURRENTLY` in production to avoid locking.
- Composite indexes are ordered by selectivity (most selective column first).
- Partial indexes are preferred over full-table indexes when a query always includes a status/visibility filter.
- Index maintenance (REINDEX) is scheduled quarterly via a Supabase cron job.
- New indexes are validated with `EXPLAIN ANALYZE` before deployment to confirm query plan changes.

---

## 27. Storage Bucket Configuration — Detailed Specification

### 27.1 Overview
Supabase Storage is used for file uploads across features: avatars, notes images, role upgrade evidence, and assignment attachments. Each bucket has distinct access controls, file size limits, and MIME type restrictions.

### 27.2 Bucket Definitions

| Bucket Name | Public Read | Write Access | Max File Size | Allowed MIME Types | Folder Pattern |
|---|---|---|---|---|---|
| `avatars` | Yes | Owner only (`auth.uid()`) | 5 MB | `image/jpeg`, `image/png`, `image/webp` | `{userId}/avatar.{ext}` |
| `notes-images` | No (authenticated only) | Owner only (`auth.uid()`) | 10 MB | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | `{userId}/{noteId}/{filename}` |
| `role-upgrade-evidence` | No (owner + main_contributor) | Owner only (`auth.uid()`) | 20 MB | `application/pdf`, `image/jpeg`, `image/png` | `{userId}/{requestId}/{filename}` |
| `assignment-attachments` | No (classroom members + teacher) | Teacher of classroom | 50 MB | `application/pdf`, `application/zip`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`, `image/jpeg`, `image/png` | `{classroomId}/{assignmentId}/{filename}` |

### 27.3 Bucket-Level RLS Policies

#### 27.3.1 avatars
- **Public read**: `bucket_id = 'avatars'` — `FOR SELECT TO anon USING (true)`
- **Owner write**: `bucket_id = 'avatars'` — `FOR INSERT/UPDATE/DELETE TO authenticated USING (auth.uid() = owner)`

#### 27.3.2 notes-images
- **Authenticated read**: `bucket_id = 'notes-images'` — `FOR SELECT TO authenticated USING (true)`
- **Owner write**: `bucket_id = 'notes-images'` — `FOR INSERT/UPDATE/DELETE TO authenticated USING (auth.uid() = owner)`

#### 27.3.3 role-upgrade-evidence
- **Restricted read**: `bucket_id = 'role-upgrade-evidence'` — `FOR SELECT TO authenticated USING (auth.uid() = owner OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'main_contributor'))`
- **Owner write**: `bucket_id = 'role-upgrade-evidence'` — `FOR INSERT/UPDATE/DELETE TO authenticated USING (auth.uid() = owner)`

#### 27.3.4 assignment-attachments
- **Classroom read**: `bucket_id = 'assignment-attachments'` — `FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM classroom_members WHERE classroom_id = (regexp_match(name, '^([^/]+)'))[1]::uuid AND user_id = auth.uid()))`
- **Teacher write**: `bucket_id = 'assignment-attachments'` — `FOR INSERT/UPDATE/DELETE TO authenticated USING (EXISTS (SELECT 1 FROM classrooms WHERE id = (regexp_match(name, '^([^/]+)'))[1]::uuid AND creator_id = auth.uid()))`

### 27.4 Configuration
```toml
# supabase/config.toml
[storage]
enabled = true

[storage.buckets.avatars]
public = true
file_size_limit = 5242880  # 5 MB
allowed_mime_types = ["image/jpeg", "image/png", "image/webp"]

[storage.buckets.notes-images]
public = false
file_size_limit = 10485760  # 10 MB
allowed_mime_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]

[storage.buckets.role-upgrade-evidence]
public = false
file_size_limit = 20971520  # 20 MB
allowed_mime_types = ["application/pdf", "image/jpeg", "image/png"]

[storage.buckets.assignment-attachments]
public = false
file_size_limit = 52428800  # 50 MB
allowed_mime_types = ["application/pdf", "application/zip", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/jpeg", "image/png"]
```

### 27.5 Client-Side Upload Pattern
All uploads go through a server-side helper function to generate signed URLs or validate upload tokens. The pattern:

1. Client calls `POST /api/storage/upload-url` with bucket name and file details.
2. Server validates permissions (role, ownership, membership).
3. Server returns a signed upload URL with a 60-second expiry.
4. Client uploads directly to the signed URL.
5. On success, client calls the relevant mutation (e.g., update profile avatar URL, insert note image reference).

**Never upload directly from client to Supabase Storage using the anon key.** Always use the signed URL pattern to avoid exposing storage bucket names and paths.

---

## 28. Realtime Subscriptions Architecture — Detailed Specification

### 28.1 Overview
Supabase Realtime is used for live features: club chat messages, classroom notifications, and online presence tracking. Each subscription channel is scoped to a specific resource and gated by membership-based authorization.

### 28.2 Channel Definitions

| Channel Pattern | Table(s) | Event Types | Authorization | Feature |
|---|---|---|---|---|
| `club:{club_id}` | `club_messages` | INSERT | Active club member (verified via `club_members`) | Club Chat |
| `classroom:{classroom_id}` | `assignments`, `quizzes`, `announcements` | INSERT, UPDATE | Classroom member (verified via `classroom_members`) | Classroom Notifications |
| `presence:global` | N/A (presence) | Presence sync | Authenticated user | Online Status |

### 28.3 Channel Subscription Rules

#### 28.3.1 Club Chat (`club:{club_id}`)
- **Subscription**: Client subscribes to `club:{club_id}` when the club chat tab is open.
- **Authorization**: Server-side `channel_authorization` hook checks `club_members` for `user_id = auth.uid() AND club_id = {club_id}`.
- **Events**: `INSERT` only. Clients listen for new messages. Messages are never updated or deleted via Realtime (rely on page refresh for edits/deletions).
- **Payload**: Full `club_messages` row (id, club_id, sender_id, message, created_at). Sender name resolved client-side from profile cache.
- **Cleanup**: Unsubscribe when the component unmounts or the user navigates away from the chat tab.

#### 28.3.2 Classroom Notifications (`classroom:{classroom_id}`)
- **Subscription**: Client subscribes to `classroom:{classroom_id}` when viewing the classroom page.
- **Authorization**: Server-side `channel_authorization` hook checks `classroom_members` for `user_id = auth.uid() AND classroom_id = {classroom_id}`.
- **Events**: `INSERT` on `assignments`, `quizzes` tables. `UPDATE` on `assignments` (status change).
- **Payload**: Minimal notification payload: `{ table, event, record_id, title, classroom_id }`. Full record fetched on click.
- **UI Behavior**: Shows a toast notification ("New assignment: [title]") with a link to the relevant page.

#### 28.3.3 Presence Tracking (`presence:global`)
- **Subscription**: Client subscribes to `presence:global` on app load (authenticated routes only).
- **Authorization**: Authenticated user.
- **Events**: Presence sync (enter, leave, heartbeat every 30 seconds).
- **Payload**: `{ user_id, display_name, avatar_url }`.
- **UI Behavior**: Avatar indicator (green dot) on profile cards, club member list, and classroom member list. Not shown for privacy — users must have a public profile.

### 28.4 Configuration
```toml
# supabase/config.toml
[realtime]
enabled = true
wal_level = logical

[realtime.channels.club_chat]
enabled = true
tables = ["club_messages"]
publication = "supabase_realtime"

[realtime.channels.classroom_notifications]
enabled = true
tables = ["assignments", "quizzes"]
publication = "supabase_realtime"

[realtime.channels.presence]
enabled = true
```

### 28.5 Client-Side Subscription Pattern
```typescript
// Example: Club chat subscription
import { supabase } from '@/lib/supabase/client'

export function subscribeToClubChat(clubId: string, onMessage: (msg: ClubMessage) => void) {
  const channel = supabase
    .channel(`club:${clubId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'club_messages', filter: `club_id=eq.${clubId}` },
      (payload) => onMessage(payload.new as ClubMessage)
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
```

### 28.6 Error Handling
- **Authorization failure**: If the server denies channel subscription, the client shows "You don't have access to this chat" and falls back to static list view.
- **Reconnection**: Supabase client automatically reconnects. On reconnect, the client refreshes the full list to catch missed messages.
- **Rate limiting**: Maximum 1 message per second per user per club chat. Enforced client-side and server-side.

### 28.7 Realtime Publication Configuration
The `supabase_realtime` publication must include only tables that need realtime subscriptions to minimize WAL overhead:
- `club_messages`
- `assignments`
- `quizzes`

---

## 29. Auth & Middleware Integration — Detailed Specification

### 29.1 Overview
Authentication is handled by Supabase Auth with Next.js middleware for route protection. The session is managed via `@supabase/ssr` package for server-side rendering compatibility. Roles are embedded in JWT claims via a `custom_access_token` database hook.

### 29.2 Session Management

#### 29.2.1 Session Refresh Strategy
- **Client-side**: `supabase.auth.getSession()` on app load. Session auto-refresh via `onAuthStateChange` listener.
- **Server-side (RSC)**: `createServerClient()` with cookies from `next/headers`. Session read from cookie on every request.
- **Middleware**: `createMiddlewareClient()` refreshes the session cookie on every request. If expired, clears cookie and redirects to `/login`.
- **Token expiry**: Access token expires after 3600 seconds (1 hour). Refresh token expires after 2592000 seconds (30 days). Refresh is handled transparently by the Supabase client library.

#### 29.2.2 Cookie Configuration
```typescript
// src/lib/supabase/middleware.ts
import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createMiddlewareClient({ request, response: supabaseResponse })
  const { data: { user } } = await supabase.auth.getUser()
  // No user → redirect to login unless on public route
  if (!user && !request.nextUrl.pathname.startsWith('/(public)') && request.nextUrl.pathname !== '/login' && request.nextUrl.pathname !== '/signup') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return supabaseResponse
}
```

### 29.3 Custom Access Token Hook (JWT Role Claim)
A Supabase Database Hook (`custom_access_token`) is created to embed the user's role into the JWT on every token refresh:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_custom_access_token_hook.sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
  DECLARE
    claims jsonb;
    user_role text;
  BEGIN
    claims := event->'claims';
    SELECT role INTO user_role FROM public.profiles WHERE id = (event->>'user_id')::uuid;
    claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(user_role, 'student')));
    RETURN jsonb_set(event, '{claims}', claims);
  END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

The `useRole()` hook reads `user_role` from the JWT claims:
```typescript
// src/hooks/useRole.ts
import { useSupabase } from '@/providers/SupabaseProvider'

export function useRole(): 'student' | 'teacher' | 'contributor' | 'main_contributor' | null {
  const { session } = useSupabase()
  return (session?.user?.app_metadata?.user_role as any) ?? null
}
```

### 29.4 Route Protection Matrix

| Route Pattern | Auth Required | Min Role | Redirect |
|---|---|---|---|
| `/(public)/*` | No | None | N/A |
| `/login`, `/signup` | No (redirect if authed) | None | `/dashboard` if already authed |
| `/dashboard` | Yes | Student | `/login?redirect=/dashboard` |
| `/classrooms/*` | Yes | Student | `/login` |
| `/contributor/*` | Yes | Contributor | `/dashboard` with "Access denied" toast |
| `/main-contributor/*` | Yes | Main Contributor | `/dashboard` with "Access denied" toast |
| `/settings/*` | Yes | Student | `/login` |
| `/profile/*` | No | None | N/A (public pages) |

### 29.5 Role Upgrade & JWT Refresh
When a user's role is upgraded:
1. The `profiles.role` field is updated by the main_contributor.
2. The user must sign out and sign back in to receive a new JWT with updated `user_role` claim.
3. The middleware detects the expired session and forces re-authentication.
4. Alternative: User can manually click "Refresh Session" in settings to trigger a token refresh without full logout.

### 29.6 Error Handling
- **Session expired**: Middleware redirects to `/login` with `?session_expired=true` query parameter. Login page shows "Your session has expired. Please log in again."
- **Role denied**: Component-level `useRole()` check shows a toast "You don't have access to this feature." The page renders an empty state with an upgrade prompt.
- **Auth API failure**: Fall back to cached session data for up to 5 minutes. Show "Authentication service unavailable" warning banner.

---

## 30. Seed Data Strategy — Detailed Specification

### 30.1 Overview
Seed data provides realistic development and demo datasets for all features. Seeds are loaded in dependency order to respect foreign key constraints. Environment-specific seed variants allow different data sets for development, staging, and production.

### 30.2 Seed File Structure

```
supabase/
  seed.sql                          # Main seed file (development + demo data)
  seed-dev.sql                      # Development-specific overrides (auto-generated content)
  seed-staging.sql                  # Staging-specific data (subset for testing)
```

The main `seed.sql` is loaded via `supabase db seed` and follows the dependency order below.

### 30.3 Seed Loading Order

| Order | Table(s) | Purpose | Dependencies |
|---|---|---|---|
| 1 | `profiles` | 4 sample users (one per role) | None |
| 2 | `contributor_profiles` | Extended profiles for Contributor + Main Contributor | `profiles.id` |
| 3 | `student_profiles`, `teacher_profiles` | Role-specific extensions | `profiles.id` |
| 4 | `curriculums` | 2 sample curriculums (IGCSE, A-Level) | `profiles.id` (created_by) |
| 5 | `subjects` | Subjects per curriculum (Math, Physics, Chemistry, English, Biology) | `curriculums.id` |
| 6 | `topics` | Topics per subject (5-10 each) | `subjects.id` |
| 7 | `notes` | 3 sample notes (2 published, 1 draft) | `profiles.id`, `subjects.id` |
| 8 | `decks` | 2 sample flashcard decks | `profiles.id` |
| 9 | `cards` | 10 sample cards per deck | `decks.id` |
| 10 | `classrooms` | 1 sample classroom | `profiles.id` (teacher) |
| 11 | `classroom_members` | 2 students in sample classroom | `classrooms.id`, `profiles.id` |
| 12 | `clubs` | 1 sample club | `profiles.id` (contributor) |
| 13 | `club_members` | Contributor (leader) + 1 member in sample club | `clubs.id`, `profiles.id` |
| 14 | `exams` | 5 sample exam records (IGCSE + A-Level papers) | `subjects.id` |
| 15 | `exam_schedules` | 3 sample exam schedules | `exams.id` |
| 16 | `grade_boundaries` | Boundary tables for 2 subjects | `subjects.id` |
| 17 | `timetable_events` | 5 sample events for student user | `profiles.id` |
| 18 | `pomodoro_sessions` | 3 sample session records | `profiles.id` |
| 19 | `exam_countdowns` | 2 sample countdown entries | `profiles.id`, `exams.id` |
| 20 | `grade_entries` | 1 sample grade calculation | `profiles.id` |
| 21 | `topic_progress` | 3 sample topic progress records | `profiles.id`, `topics.id` |

### 30.4 Sample Profile Data (seed.sql)

```sql
-- Sample profiles covering all 4 roles
INSERT INTO profiles (id, username, display_name, avatar_url, bio, role, is_public) VALUES
  ('00000000-0000-0000-0000-000000000001', 'alice_student', 'Alice Johnson', NULL, 'A Level student studying Maths and Physics.', 'student', true),
  ('00000000-0000-0000-0000-000000000002', 'bob_teacher', 'Bob Smith', NULL, 'Experienced Maths teacher.', 'teacher', true),
  ('00000000-0000-0000-0000-000000000003', 'carol_contributor', 'Carol Williams', NULL, 'Physics curriculum contributor.', 'contributor', true),
  ('00000000-0000-0000-0000-000000000004', 'dave_maintainer', 'Dave Brown', NULL, 'Platform maintainer and senior reviewer.', 'main_contributor', true);
```

### 30.5 Environment-Specific Seeds
- **Development (`seed.sql`)**: All sample data from the loading order table above. Used for local development and manual testing.
- **Staging (`seed-staging.sql`)**: Minimal subset — 2 profiles (student + main_contributor), 1 curriculum, 1 classroom, 1 club. Used for CI/CD pipeline tests.
- **Production**: No seed data loaded in production. The production database starts empty except for curriculum/exam boundary data loaded via CSV import (see Section 24).

### 30.6 Seed Loading Command
```bash
# Load all seeds (development)
npx supabase db seed

# Load specific seed file
psql "$DATABASE_URL" -f supabase/seed.sql

# Reset and re-seed
npx supabase db reset
```

### 30.7 Seed Data Reset
- **Local development**: `npx supabase db reset` drops all data and re-runs all migrations + seed.
- **Staging**: Seeds are loaded once during initial deployment. Manual re-seed requires a database branch reset.
- **Production**: Seeds are never automatically loaded. The database starts empty; curriculum/exam data is loaded via Contributor tools.

---

## 31. Connection Pooling Configuration — Detailed Specification

### 31.1 Overview
Supabase provides PgBouncer-based connection pooling to manage database connections efficiently. The pooler runs in **transaction mode**, which is compatible with serverless functions and Next.js server components.

### 31.2 Connection Pooler Settings

| Setting | Value | Description |
|---|---|---|
| Pool Mode | `transaction` | Connections are released after each transaction completes |
| Default Pool Size | 15 | Max concurrent connections from the pooler to the database |
| Prepared Statements | `false` (default) | Prepared statements persist across connections in transaction mode; must use `?` parameterized queries instead |
| Connection String (Pooled) | `postgresql://[user]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` | Pooled connection (port 6543) |
| Connection String (Direct) | `postgresql://[user]:[password]@aws-0-[region].supabase.com:5432/postgres` | Direct connection (port 5432) |

### 31.3 Application-Side Connection Management

#### 31.3.1 Server Components (RSC)
- Use the **pooled connection** (port 6543) via `createServerClient()`.
- Each server component creates a short-lived connection, executes the query, and releases.
- `connection_limit=1` in the connection string ensures each serverless invocation gets exactly one connection.

#### 31.3.2 Server Actions & API Routes
- Use the **pooled connection** (port 6543).
- Wrap mutations in explicit transactions to ensure PgBouncer releases the connection promptly.
- Never hold connections open across `await` boundaries inside Server Actions.

#### 31.3.3 Client-Side
- Supabase client library manages its own internal session-based connection pool.
- No direct database connections from client code — all queries go through the Supabase client which automatically routes through the pooler.

### 31.4 Prepared Statement Considerations
In transaction mode, PgBouncer does not support prepared statements across transactions. All Supabase client queries use parameterized queries (not prepared statements), so this is handled automatically.

### 31.5 Max Connections Per Feature

| Feature | Expected Concurrent Users | Estimated Queries Per Request | Recommended Pool Connections |
|---|---|---|---|
| Dashboard | High (all authenticated users) | 5-8 | 5 |
| Classroom | Medium (per classroom group) | 3-6 | 4 |
| Club Chat | Medium (per club) | 1-2 (long-poll via Realtime) | 2 |
| Flashcards | High (per user session) | 3-5 | 4 |
| Exam Countdown | Medium | 2-3 | 2 |
| Grade Calculator | Low-Medium | 4-6 | 2 |
| Notes Editor | Low (Contributor-only) | 3-4 | 1 |
| Review Queue | Very Low (Main Contributor only) | 2-3 | 1 |

### 31.6 Monitoring
- Monitor `pgbouncer.max_client_conn` — alerts if exceeding 80% (12 of 15).
- Monitor average connection wait time — alert if > 100ms.
- Monitor connection age — transaction mode connections should cycle every < 60 seconds.
- Dashboard: Supabase Studio → Database → Pooling metrics.

### 31.7 Error Handling
- **Too many connections**: Application shows "Service temporarily unavailable. Please try again." Retry with exponential backoff (1s, 2s, 4s, max 16s).
- **Connection timeout**: `statement_timeout = 30000` (30 seconds) set on the database. Queries exceeding this return a timeout error with the query text for debugging.
- **Pool exhaustion**: If pool is full, new requests queue. Queue timeout after 10 seconds returns a 503 with "Too many requests. Please try again later."

---

## 32. Migration Strategy — Detailed Specification

### 32.1 Overview
Database schema changes are managed through versioned migration files. Each migration is applied in order and is irreversible (no rollback migrations). Changes to the live database follow a review-and-test process before applying to production.

### 32.2 Migration File Naming Convention
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

Format:
- **Timestamp**: UTC timestamp of migration creation (not application), e.g., `20260701120000`.
- **Separator**: Single underscore `_`.
- **Description**: Lowercase snake_case descriptive name, e.g., `create_profiles_table`, `add_rls_policies`.
- **Extension**: `.sql`.

Examples:
```
20260701120000_create_profiles_table.sql
20260701130000_add_classroom_tables.sql
20260701140000_enable_rls.sql
20260701150000_add_indexes.sql
20260701160000_seed_initial_data.sql
```

### 32.3 Required Migration Files (In Order)

| Order | Milestone | Migration File | Description |
|---|---|---|---|
| 1 | Foundation | `20260701120000_create_profiles_table.sql` | Create `profiles`, `contributor_profiles`, `student_profiles`, `teacher_profiles` tables. Auth trigger for new user profile creation. |
| 2 | Curriculum | `20260701121000_create_curriculum_tables.sql` | Create `curriculums`, `subjects`, `topics`, `resources` tables with hierarchy. |
| 3 | Classroom | `20260701122000_create_classroom_tables.sql` | Create `classrooms`, `classroom_members`, `classroom_curriculums`, `assignments`, `assignment_submissions`, `quizzes`, `quiz_attempts`, `discussion_topics`, `discussion_replies`, `classroom_resources` tables. |
| 4 | Club | `20260701123000_create_club_tables.sql` | Create `clubs`, `club_members`, `club_messages`, `club_announcements`, `club_links`, `club_join_requests`, `club_projects`, `club_events`, `club_curriculums`, `club_subjects` tables. |
| 5 | Study Tools | `20260701124000_create_study_tool_tables.sql` | Create `timetable_events`, `pomodoro_sessions`, `decks`, `cards`, `card_reviews`, `notes`, `user_saved_notes` tables. |
| 6 | Exam | `20260701125000_create_exam_tables.sql` | Create `exams`, `exam_schedules`, `exam_countdowns`, `grade_boundaries`, `grade_entries`, `user_enrollments`, `user_exam_overrides`, `user_exam_history` tables. |
| 7 | Curriculum Tracking | `20260701126000_create_tracking_tables.sql` | Create `user_curriculums`, `topic_progress` tables. |
| 8 | Review | `20260701127000_create_review_tables.sql` | Create `editor_submissions`, `review_queue`, `version_history` tables. |
| 9 | Role Upgrade | `20260701128000_create_role_upgrade_tables.sql` | Create `role_upgrade_requests`, `role_upgrade_applications` tables. |
| 10 | Auth Hook | `20260701129000_custom_access_token_hook.sql` | Create `custom_access_token_hook` function and attach to auth event. |
| 11 | RLS Enablement | `20260701130000_enable_rls.sql` | Enable RLS on all tables. Create all RLS policies from Section 25. |
| 12 | Indexes | `20260701131000_add_indexes.sql` | Create all indexes from Section 26. |
| 13 | Storage | `20260701132000_create_storage_buckets.sql` | Create Storage buckets from Section 27. Create bucket-level RLS policies. |
| 14 | Realtime | `20260701133000_configure_realtime.sql` | Configure `supabase_realtime` publication for tables listed in Section 28. |
| 15 | Seed Data | `20260701134000_seed_initial_data.sql` | Load seed data from Section 30 for development environments. |

### 32.4 Migration Application Process

#### 32.4.1 Local Development
```bash
# Create a new migration
npx supabase migration new create_classroom_tables

# Apply all pending migrations
npx supabase db push

# Reset (drop all + re-apply all migrations + seed)
npx supabase db reset
```

#### 32.4.2 Staging
- Migrations are applied automatically via CI/CD pipeline when merged to `staging` branch.
- `npx supabase db push --db-url "$STAGING_DATABASE_URL"`
- Seed data is loaded only once during initial staging setup.

#### 32.4.3 Production
- **Review Required**: Every migration must be reviewed by a second developer (preferably PM).
- **Applied manually**: PM applies migrations via `npx supabase db push --db-url "$PRODUCTION_DATABASE_URL"`.
- **No auto-apply**: Production migrations are never applied via CI/CD.
- **Backup required**: A full database backup is taken before applying any production migration.
- **Rollback plan**: If a migration causes issues, restore from backup. There are no down migrations.

### 32.5 Migration Testing Checklist
Before applying any migration to production:
- [ ] Migration applied successfully to staging environment
- [ ] `EXPLAIN ANALYZE` run on all new queries to verify index usage
- [ ] RLS policies tested with all 4 roles (including unauthenticated)
- [ ] Seed data loads without foreign key violations
- [ ] Application starts without TypeScript errors
- [ ] No breaking changes to the `database.ts` facade interface
- [ ] Backup of production database downloaded and verified

### 32.6 Migration Version Control
- All migration files are committed to the repository under `supabase/migrations/`.
- Migrations are never edited after application (immutable).
- If a change is needed, create a new migration — never modify an existing one.
- The `supabase/migrations/` folder contains the single source of truth for database schema history.

---

## 33. Homepage Design System

### 33.1 Overview

The public landing page (`/`) implements a dedicated design layer scoped under the `.hp` CSS class. This system is independent of the authenticated app shell design tokens and provides a distinct, brand-forward visual identity for first-time visitors and unauthenticated users.

### 33.2 CSS Variable Layer

Homepage tokens are defined within `.hp` scope in `src/app/globals.css`:

```css
.hp {
  --hp-brand: #3CDBA7;          /* Primary brand — emerald green (dark) */
  --hp-brand-soft: rgba(60, 219, 167, 0.12);
  --hp-violet: #8C7FF0;         /* Secondary accent — violet */
  --hp-bg: #080B11;              /* Default section background */
  --hp-bg-soft: #0C1119;         /* Alternate section background */
  --hp-surface: rgba(255, 255, 255, 0.04);  /* Card surface */
  --hp-border: rgba(255, 255, 255, 0.08);
  --hp-border-strong: rgba(255, 255, 255, 0.14);
  --hp-text-primary: #F1F5F9;
  --hp-text-secondary: #94A3B8;
}
```

Dark/light theme variants are controlled via `[data-theme="dark"]` and `[data-theme="light"]` attribute selectors within `.hp`.

### 33.3 Component Inventory

| # | Component | File | Purpose |
|---|---|---|---|
| 1 | `HeroVisual` | `src/components/homepage/HeroVisual.tsx` | Decorative widget panel with live-ticking countdown + mini timetable |
| 2 | `RevealSection` | `src/components/homepage/RevealSection.tsx` | Apple-style scroll-reveal wrapper (IntersectionObserver, 12% threshold) |
| 3 | `SectionHead` | Inline in `page.tsx` | Section title + optional subtext with `hp-reveal` animation |
| 4 | `BentoFeatures` | `src/components/homepage/BentoFeatures.tsx` | 4-column responsive bento grid of 8 feature tiles |
| 5 | `StatsRow` | `src/components/homepage/StatsRow.tsx` | 4-column responsive animated stat blocks |
| 6 | `QualCarousel` | `src/components/homepage/QualCarousel.tsx` | Non-interactive auto-advancing qualification board carousel (4.5s interval) |
| 7 | `RoleLadder` | `src/components/homepage/RoleLadder.tsx` | Role hierarchy with baseline-aligned rungs + approval-flow indicators |
| 8 | `AntTrailPattern` | `src/components/homepage/AntTrailPattern.tsx` | Brand-specific SVG ant-trail geometric mesh background pattern |
| 9 | `DotGrid` | `src/components/homepage/DotGrid.tsx` | Decorative polka-dot overlay texture |
| 10 | `Footer` | `src/components/layout/Footer.tsx` | 4-column responsive footer with social links |

### 33.4 Section Architecture

The homepage is composed of 7 sequentially rendered sections within `page.tsx`:

| Order | Section | Background | Pattern | Key Components |
|---|---|---|---|---|
| 1 | Hero | `--hp-bg` | AntTrailPattern (`mixed`, 0.11) | HeroVisual, SectionHead, CTA buttons, "Learn more" link |
| 2 | Explore | `--hp-bg-soft` | AntTrailPattern (`brand`, 0.14) | Club/Profile cards, SectionHead |
| 3 | Stats | `--hp-bg` | AntTrailPattern (`brand`, 0.09) | StatsRow (AnimatedStat × 4) |
| 4 | Features | `--hp-bg` | AntTrailPattern (`mixed`, 0.13) + DotGrid | BentoFeatures (8 bento cards) |
| 5 | Qualifications | `--hp-bg-soft` | AntTrailPattern (`brand`, 0.14) + DotGrid | QualCarousel |
| 6 | Roles | `--hp-bg` | AntTrailPattern (`violet`, 0.10) + DotGrid | RoleLadder |
| 7 | CTA | `--hp-bg` | AntTrailPattern (`mixed`, 0.09) | Call-to-action section, Footer |

### 33.5 Ant-Trail Background Pattern

The `AntTrailPattern` component renders a repeating geometric mesh of nodes and connecting lines inspired by ant colony trail networks. It sits at the lowest visual layer in every section.

**Technical implementation:**
- SVG tile (120×120px) encoded as URL-encoded data URI in `background-image`
- 8 nodes (2px radius, opacity 0.22) + 9 trail lines (0.8px stroke, opacity 0.12) per tile
- Responsive tile scaling: 120px (desktop) → 100px (tablet) → 80px (mobile)
- `currentColor` driven by CSS `color` property — no new CSS tokens required
- Edge-fade via CSS `mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)`
- Bundle size: ~1.6KB gzipped (SVG + component + CSS)
- Hidden in `prefers-reduced-data` mode

**Visibility calibration (v1.1):**
- Low: 0.09–0.11 (Stats, CTA)
- Medium: 0.13–0.14 (Explore, Features, Qualifications)
- All content sits on solid `--hp-surface` backgrounds above the pattern — zero readability impact

### 33.6 Animation System

All homepage animations use Apple-like cubic-bezier easing curves defined as CSS custom properties:

| Token | Curve | Use Case |
|---|---|---|
| `--hp-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entrance animations |
| `--hp-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |

**Keyframe inventory:**
- `hp-float-grad` — 3s float + 4s gradient shimmer on key phrases
- `carouselSlideIn` — Fade + translateY(12px) + scale(0.98) for QualCarousel slides (4.5s interval)
- `hp-reveal` / `hp-reveal-card` — Scroll-triggered blur-to-clear + scale entrance via IntersectionObserver

All animations respect `prefers-reduced-motion: reduce`.

### 33.7 Recent Changes (2026-07-07)

| Change | Scope | Impact |
|---|---|---|
| Ant-Trail Pattern v1.1 | All 7 sections | Node size +33%, trail stroke +60%, effective visibility 3.4–3.7× higher |
| Footer extraction | `page.tsx` → `Footer.tsx` | Dedicated 4-column responsive footer component, GitHub link added |
| QualCarousel redesign | `QualCarousel.tsx` | Interactive (chevrons + dots) → non-interactive auto-advancing (4.5s) |
| RoleLadder redesign | `RoleLadder.tsx` | Staircase offsets → same baseline; added approval-flow arrows + lock icons |
| CTA button redesign | Hero section | "Sign In" converted from pill button to text link; reduced visual noise |
| Explore cards rename | Explore section | "Explore Clubs" → "Clubs", "Explore Profiles" → "Profiles" |
| Text removals | 5 locations | Removed verbose description blocks; SectionHead subtext made optional |
| "Learn more" link | Hero section | Redesigned twice: prominent pill → clean text link with arrow |
