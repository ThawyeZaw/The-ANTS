<div align="center">

# 🐜 The ANTS

### The Academic Productivity Ecosystem for Myanmar Students

*Ace with us!*

*Timetables · Flashcards · Classrooms · Clubs · Quizzes · Grade Calculators · Exam Countdowns · Public Profiles · Notes*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Status-MVP%20Phase%201-amber)](./)

</div>

---

## What is The ANTS?

**The ANTS** is an organisation focused on IGCSE, A Level tutoring and CCA activities for Myanmar students pursuing international qualifications. Our platform is a curriculum-focused productivity and learning ecosystem wired directly into exam board criteria — so your timetables, flashcards, and grade calculators understand the difference between a CAIE IGCSE and an Edexcel IAL.

Whether you're targeting A* in IGCSE or A Levels, IELTS band 7+, or an OSSD diploma, The ANTS keeps your study life organised in one place — and connects you with a vibrant community of learners and contributors.

---

## Supported Qualifications

| Exam Board | Qualifications |
|---|---|
| 🎓 **Cambridge CAIE** | IGCSE, A Levels  |
| 📘 **Pearson Edexcel** | IGCSE, International A Level (IAL) |
| 🍁 **OSSD** | Ontario Secondary School Diploma |
| 🌍 **IELTS** | Academic & General Training |
| 📝 **SAT** | College Board SAT (Math + Reading/Writing) |
| 💬 **Duolingo** | Duolingo English Test (DET) |

---

## Features

### 📅 Smart Timetable
- Manage weekly self-study sessions, classes and schedules with drag-and-drop time blocks.
- Colour-code events by subject or event type (study session, class, school, gym, exam, break).
- Events can be a to-do or just an event, repeatable daily or weekly, all-day or timed.
- Events can be modified or deleted after creation.
- Daily, weekly, and monthly views.

### ⌛ Pomodoro Timer
- Launch a built-in Pomodoro timer from any study block or from the dashboard.
- Customisable work/break intervals with background music.
- Every completed session is logged to your productivity history.

### 📈 Lesson Tracker
- Select from a library of subject and curriculum templates created by contributors.
- Create your own templates or modify selected ones.
- Set confidence levels for each topic within every subject or curriculum.

### 📋 Course Manager
- Browse the library to select additional subjects or curriculums.
- Modify, manage, and remove your selected curriculums and subjects.

### 🃏 Flashcard Decks with Spaced Repetition
- Create, edit, and share your own flashcards or select ready-made decks from the library.
- Study cards with a smooth flip animation and rate each card (Again / Hard / Good / Easy).
- SM-2/FSRS spaced-repetition algorithm schedules your next review automatically.

### 📚 Notes Library & Curriculum Editor
- **Notes Library** (`/library`): Browse, search, and filter approved study notes by qualification, subject, topic, tags, and specification points.
- **My Notes** (`/my-notes`): All your created and bookmarked notes with instant search and filters.
- **Inline Note Reader**: Read notes in a slide-out drawer. Renders LaTeX, interactive animations (WebGL/Canvas), and SVG diagrams.
- **Split-Screen Editor** (`/editor/notes`): Drag-and-drop block builder (headings, paragraphs, LaTeX, code, images, tables, animations, SVGs) with live preview.
- **AI Prompt Generator Wizard**: 4-step wizard — specify context, copy the prompt, paste raw AI output, parse into editor blocks.
- **Gatekeeper Review Queue**: All public notes go through a mandatory review workflow.

### 🔗 Cross-Feature Linking (Related Content)
- When viewing a note or flashcard deck, a **Related Content** section appears below the main content.
- Automatically surfaces related flashcards and approved notes based on the same curriculum, subject, or topic.
- Does not show the currently viewed item — always shows complementary resources.

### 🏫 Virtual Classrooms — Assignments, Quizzes, Resources & More

Classrooms are virtual learning spaces with full CRUD for educational content. **Teachers** create and manage classrooms; **students** join via invite code.

| Tab | What it does | Teacher | Student |
|---|---|---|---|
| **Assignments** | Full lifecycle: create draft → publish → student submits → teacher grades | Create, edit, publish, delete, view submissions, grade | Submit work, view grades |
| **Quizzes** | Manual + AI-powered quiz creation with questions (MC/TF/Short Answer) | Create (manual or AI), edit draft, publish, delete, take to test | Take quiz, view results with per-question review |
| **Resources** | Typed resource library (PDF, video, document, link, image) | Add, edit, delete own resources | View only |
| **Discussions** | Topic-based discussion threads with pin/lock moderation | Create topics, reply, edit/delete own topics | Create topics, reply |
| **Links** | Quick link sharing | Add, edit, delete own links | View only |
| **Members** | Member directory with teacher/student labels | View all, remove members | View all |
| **Settings** | Classroom name, description, invite code, feature toggles | Full control | (hidden) |

**Key Features:**
- **Quiz AI Generator**: Configure subject/topic → copy prompt → paste LLM response → auto-parsed into quiz questions
- **Quiz Taking**: Full-screen modal, submit when all questions answered, instant scoring with per-question review
- **Retake**: Students can retake quizzes (replaces previous attempt)
- **Teachers can test their own quizzes** before publishing
- **Global Search**: Search across all classroom content (assignments, quizzes, resources, links, discussions)
- **Creator-only Edit/Delete**: Only the creator can edit or delete their own items
- **Draft/Published workflow**: Create in draft, publish when ready

### 🐜 Clubs (Community Spaces)
- **Contributors** can create and lead Clubs focused on CCA activities, subjects, or projects.
- Each club can be linked to one or more subjects or curriculums.
- Club leaders control which features to enable: chat, announcements, links, members, projects, activity timeline.
- Join modes: open, invite-link, or approval-based.
- **Admin/Moderator/Member** role hierarchy with granular permissions.
- Members can leave at any time.

### 👤 Public Profiles (All Roles)
- Every user has a publicly visible profile page (toggleable in settings).
- Includes bio, role badge, project showcase, CCA timeline, and achievements.
- Shareable via direct link — perfect for university applications and CVs.
- Customisable theme, spacing, and section layout.

### 🏠 Explore Pages
- **Explore Clubs** (`/explore/clubs`): Browse all clubs with search, member counts, and join modes — no login required.
- **Explore Profiles** (`/explore/profiles`): Discover community members with role-based filters and portfolio previews.

### ⏳ Exam Countdown
- Set countdowns for every upcoming exam.
- Visual urgency indicators across multiple subjects.
- Can be selected from the library of specific subjects, curriculums, and exam series.

### 🧮 Grade Calculator
- Enter raw marks across paper components.
- Converts to correct grades using official boundary tables for IGCSE, A Level, IAL, and OSSD.
- Supports weighted multi-component calculations.

### ✨ Smooth Animations & Transitions
- **Apple-like scroll reveals** — Every section fades in with a blur-to-clear and scale-up entrance using Apple's `cubic-bezier(0, 0, 0.2, 1)` curve for a polished, cohesive feel.
- **Connected cascade** — Hero elements (badge, heading, description, CTAs) enter one after another in a natural 80ms stagger rhythm — no manual delays needed.
- **Floating gradient text** — Key phrases like "global education" gently levitate with a slow 3-second float while the gradient shimmer shifts across 4 seconds.
- **Theme-synced glow effects** — The nav bar, bento cards, and hover states glow with the brand colour (emerald in dark mode, forest green in light mode), all driven by the same unified cubic-bezier curve.
- **Reduced motion respected** — All animations respect `prefers-reduced-motion` — users who prefer less motion see a clean static layout.

### 🔄 Role System
- **Signup defaults to `student`.** Users can only select `student` at registration.
- **Upgrade-only policy:** Roles can only be upgraded (student → teacher → contributor → main_contributor). Downgrades are not permitted.
- **Upgrade requests:** Users submit a role upgrade request with a reason. A **Main Contributor** reviews and approves/rejects it.
- **One account, one role.** An email can only hold a single role at any time.

---

## User Roles

| Role | Who | What they can do |
|---|---|---|
| **Student** | Primary users | Timetable, Pomodoro, Flashcards, Lessons, Courses, Exams, Grade Calculator, join Classrooms, join Clubs, public profile, browse & save notes |
| **Teacher** | Paid tier | Everything above + create & manage Classrooms, issue Assignments & Quizzes, monitor student progress, Clubs (join & participate) |
| **Contributor** | Verified experts | Everything above + Curriculum & Notes Editor, Exam Data Editor, create & lead Clubs, submit notes to library |
| **Main Contributor** | Senior verified experts | Everything above + Gatekeeper Review Queue, approve role upgrade requests, promote users directly |

> **Important:** You can only sign up as a **Student**. Other roles require a Main Contributor to approve a role upgrade request.

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
- **MVP Phase 1:** Mock data facade (`src/lib/mock/database.ts`) before Supabase binding
- **Hosting:** Vercel

---

## Project Structure

```
the-ants/
├── src/
│   ├── app/                     # Next.js App Router pages
│   ├── components/
│   │   ├── homepage/            # Public landing page components (RevealSection, BentoFeatures, HeroVisual, QualTrail, QualCarousel, RoleLadder, StatsRow, DotGrid, HomepageFonts)
│   │   ├── ui/                  # Shared atomic components (Button, Badge, BackButton, RelatedContent, etc.)
│   │   ├── layout/              # NavBar
│   │   ├── classrooms/          # Classroom components (11 files)
│   │   ├── clubs/               # Club components (ClubDetail, ClubDiscovery)
│   │   ├── flashcards/          # Flashcard components (11 files)
│   │   ├── notes/               # Notes components (13 files)
│   │   ├── countdown/           # Exam countdown components
│   │   └── ...                  # Other feature components
│   ├── hooks/                   # Custom React hooks
│   ├── actions/                 # Next.js Server Actions
│   ├── lib/                     # Infrastructure & utilities
│   │   ├── mock/database.ts     # Single mock data facade
│   │   └── quiz-ai.ts           # AI quiz prompt/parser
│   ├── types/                   # Shared TypeScript definitions
│   ├── constants/               # Static reference data
│   └── context/                 # React context providers
├── schema.md                    # Database schema reference
└── spec.md                      # System specification
```

---

<div align="center">

Built with ❤️ for Myanmar students by The ANTS team

*Ace with us! 🐜*

</div>