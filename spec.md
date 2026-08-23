# The ANTs — System Specification & Integration Manifest (`spec.md`)

## 1. Project Architecture & Tech Stack (HONC Monorepo)
- **Frontend Framework:** Next.js 16 (App Router), React 19, Turbopack (`apps/web`)
- **Styling:** Tailwind CSS v4, Lucide React icons
- **Language:** TypeScript 5 (Strict Mode)
- **API Backend:** Hono deployed on Cloudflare Workers (`apps/api`)
- **Database & ORM:** Neon Serverless PostgreSQL with Drizzle ORM (`packages/db`)
- **Shared Contracts:** TypeScript Interfaces & Zod Validation Schemas (`packages/shared-types`)
- **Authentication:** Better Auth with session management and multi-role access
- **Object Storage:** Cloudflare R2 (S3-compatible presigned upload/download, zero egress fees)
- **Background Jobs & Notifications:** Cloudflare Scheduled Cron Triggers + Telegram Bot API
- **Hosting & CDN:** Vercel for Frontend (`https://the-ants.org`), Cloudflare for API & Edge Caching

---

## 2. User Roles & Permissions
Privacy and access boundaries are strictly enforced. The system supports multi-role accounts with native PostgreSQL arrays (`roles: text[]`).

### The Four Roles:
| Role | Who | Capabilities & Tooling Access |
|---|---|---|
| **Student** | Default for all users | Full access to Library (Courses, Notes, Flashcards SRS, Exams, Quizzes) and Study Tools (Smart Timetable, Pomodoro, Exam Countdown, Grade Calculator, Workspace), Public Profile. |
| **Tutor** | Teaching educators | Everything Student gets + Public Tutor Profile with Sunday–Saturday Weekly Teaching Schedule, Telegram direct inquiry modal with mobile QR code, and Tutor Profile Editor tab. |
| **Contributor** | Verified academic authors | Everything Student gets + Curriculum & Notes Editor, Exam Data Editor, Review Queue proposal submissions, Contributor Profile tab. |
| **Admin** | Platform managers | Everything Contributor gets + User Management & direct role assignment (multi-select badge toggle), Organization mission/team editor, and full moderation review queue. |

### Role Management Rules
- **Signup defaults strictly to `student`.** Users can only register as students.
- **Multi-Role Assignment:** Administrators assign or revoke roles (`tutor`, `contributor`, `admin`) directly from the Admin User Management table.
- **Immediate Multi-Role Access:** Users automatically have access to all portals and features permitted by any of their assigned roles simultaneously (no manual role switching required).
- **Session Verification:** User permissions are verified via `useRole()` hook and server-side authorization guards on the Hono backend and Server Actions.

---

## 3. Core Product Pillars & Navigation Architecture

The top navigation bar (`apps/web/src/components/layout/NavBar.tsx`) is structured into **3 core pillars**:

### Pillar 1: Library (`/library`)
- **Courses & Curriculums:** Cambridge IGCSE / A-Level, Edexcel, and Matriculation syllabi.
- **Notes Library:** Syllabus-mapped study summaries, revision guides, and formula sheets.
- **Flashcards (SRS):** Spaced repetition flashcard decks with SM-2 recall rating.
- **Past Exams & Papers:** Exam series papers, grade boundary tables, and specimen questions.
- **Revision Quizzes:** Self-assessment quizzes with answer explanations.

### Pillar 2: Tools (`/tools`)
- **Smart Timetable (`/timetable`):** Weekly schedule planner with class and study session scheduling.
- **Pomodoro Focus Timer (`/pomodoro`):** Customizable work/break focus intervals with session logging.
- **Exam Countdown (`/countdown`):** Live day/hour counters for target syllabus exams.
- **Grade Calculator (`/calculator`):** Weighted composite grade calculation.
- **My Workspace (`/workspace`):** Personal study hub for saved notes and bookmarks.

### Pillar 3: Explore & Tutors (`/explore`)
- **Tutor Directory:** Filter verified tutors by subjects, rate, and qualifications.
- **Visitor Tutor Profile (`/profile/[username]`):**
  - Displays hourly rate, subjects taught, and credentials.
  - Sunday-to-Saturday weekly timetable schedule view (3 states: Available/Free [emerald], Flexible [amber], Taken/Busy [muted]).
  - Telegram Inquiry Modal: prefilled formatted text message + mobile QR code scanner.
- **Academic Contributors:** Directory of curriculum editors and resource authors.

---

## 4. Profile Editor Consolidation

The Profile Editor (`apps/web/src/components/settings/AdvancedProfileEditor.tsx`) is organized into **2 streamlined tabs**:
1. **Tab 1: Profile Editor (Personal & Student):** Display name, avatar upload (R2 presigned URL), bio, headline, social links, portfolio projects, CCA activities, academic grades, awards, certifications, and theme presets.
2. **Tab 2: Tutor & Contributor Profile:**
   - **If Tutor:** Telegram handle, hourly rate, teaching subjects/curriculums, quick schedule presets (Weekday Evenings, Weekend Mornings, Reset), and interactive weekly slot grid editor.
   - **If Contributor / Admin:** Website, LinkedIn, GitHub URLs, contributor level, and contribution logs.

---

## 5. Engineering Guardrails
1. **Database Source of Truth:** Database schemas and migrations reside in `packages/db` with Drizzle ORM.
2. **Direct Neon Database Actions:** Next.js Server Actions query Neon PostgreSQL directly via `getDb()`.
3. **Typed API Layer:** Edge workers and client communication go through typed Hono endpoints (`apps/api`).
4. **Client Directive:** Interactive UI components must include `'use client';` as the very first line.
5. **No Secret Leaks:** Never commit credentials or `.env.local` to git.
