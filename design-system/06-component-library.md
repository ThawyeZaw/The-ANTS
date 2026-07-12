# 06 — Component Library

> **Source:** `src/components/ui/`, `src/components/layout/`, `src/components/**/`
> **Total components:** ~90

---

## Core UI Components (`src/components/ui/`)

---

### 1. Button

**File:** `src/components/ui/Button.tsx`

```tsx
import Button from '@/components/ui/Button';
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'outline'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size preset |
| `isLoading` | `boolean` | `false` | Shows Loader2 spinner, disables |
| `icon` | `ReactNode` | — | Icon before text |
| `iconRight` | `ReactNode` | — | Icon after text |
| `fullWidth` | `boolean` | `false` | `w-full` |

**Variants:**

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| `primary` | `--primary` | `--primary-foreground` | none | `--primary-hover` + `shadow-lg` |
| `secondary` | `--background-card` | `--foreground` | `--border` | `--border-hover` + `--background-secondary` |
| `ghost` | transparent | `--foreground` | none | `--background-secondary` |
| `danger` | `--error` | white | none | `opacity: 0.9` |
| `outline` | transparent | `--primary` | `--primary` | `--primary-light` |

**Sizes:**

| Size | Padding | Font | Radius |
|---|---|---|---|
| `sm` | `px-3 py-1.5` | `text-sm` | `rounded-lg` |
| `md` | `px-5 py-2.5` | `text-sm` | `rounded-xl` |
| `lg` | `px-7 py-3.5` | `text-base` | `rounded-xl` |

**Usage:**

```tsx
<Button variant="primary" size="md" icon={<Save />}>Save Changes</Button>
<Button variant="danger" size="sm" isLoading={isDeleting}>Delete</Button>
<Button variant="outline" iconRight={<ArrowRight />}>Learn More</Button>
```

---

### 2. Input

**File:** `src/components/ui/Input.tsx`

```tsx
import Input from '@/components/ui/Input';
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | — | Label above input |
| `error` | `string` | — | Error message (turns border red) |
| `icon` | `ReactNode` | — | Left icon (adds `pl-10`) |
| `iconRight` | `ReactNode` | — | Right icon (adds `pr-10`) |

**Styling:** `rounded-xl border bg-background-card px-4 py-2.5 text-sm`
- Placeholder: `text-foreground-muted`
- Focus: `ring-2 ring-primary/50 border-primary outline-none`
- Error: `border-error ring-error/50`
- Hover: `border-border-hover`

**Usage:**

```tsx
<Input label="Email" placeholder="you@example.com" icon={<Mail />} />
<Input label="Password" type="password" error="Too short" iconRight={<Eye />} />
```

---

### 3. Badge & RoleBadge

**File:** `src/components/ui/Badge.tsx`

```tsx
import Badge, { RoleBadge } from '@/components/ui/Badge';
```

| Prop | Type | Default |
|---|---|---|
| `variant` | `'default' \| 'student' \| 'teacher' \| 'contributor' \| 'main_contributor' \| 'success' \| 'warning' \| 'error'` | `'default'` |
| `children` | `ReactNode` | required |

**Styling:** `inline-flex gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full`

**Usage:**

```tsx
<Badge variant="success">Approved</Badge>
<Badge variant="error">Rejected</Badge>
<RoleBadge role="teacher" />  {/* Auto-maps to variant + label */}
```

---

### 4. BackButton

**File:** `src/components/ui/BackButton.tsx`

| Prop | Type | Default |
|---|---|---|
| `href` | `string` | `'/dashboard'` |
| `label` | `string` | `'Back'` |
| `className` | `string` | — |

**Behavior:** Tries `router.back()`, falls back to `router.push(href)`.

```tsx
<BackButton href="/dashboard" label="Back to Dashboard" />
```

---

### 5. AnimatedStat

**File:** `src/components/ui/AnimatedStat.tsx`

Count-up animation via IntersectionObserver (30% threshold, 1200ms easeOutCubic).

| Prop | Type |
|---|---|
| `endValue` | `number` |
| `label` | `string` |
| `suffix` | `string` (optional) |

```tsx
<AnimatedStat endValue={120} label="ACTIVE CLUBS" suffix="+" />
```

---

### 6. AvatarImage

**File:** `src/components/ui/AvatarImage.tsx`

| Prop | Type | Default |
|---|---|---|
| `avatar` | `string` | required (URL, `preset:*`, or empty) |
| `name` | `string` | required |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` |

**Fallback chain:** Preset emoji → uploaded image → gradient initials

| Size | Container | Emoji Size |
|---|---|---|
| `sm` | `h-10 w-10` | `text-xl` |
| `md` | `h-16 w-16` | `text-3xl` |
| `lg` | `h-24 w-24` | `text-5xl` |
| `xl` | `h-32 w-32` | `text-6xl` |

```tsx
<AvatarImage avatar="" name="Aye Chan Thu" size="lg" />
<AvatarImage avatar="preset:fox" name="May" size="md" />
```

---

### 7. RelatedContent

**File:** `src/components/ui/RelatedContent.tsx`

Content-aware cross-feature linking. Shows related flashcards, notes, exams, and lesson tracker based on curriculum/subject/topic context.

```tsx
<RelatedContent curriculumId="curr-igcse-cie" subjectId="subj-cie-physics" />
```

---

## Layout Components

---

### 8. NavBar

**File:** `src/components/layout/NavBar.tsx`

Floating glassmorphism navigation with 7 role-aware grouped dropdowns.

**Structure:**
```
Header (sticky, top-0, z-50, scroll-aware hide/show)
└── Container (max-w-7xl, px-4, pt-3)
    └── Nav (glass rounded-2xl, animate-glow)
        ├── Logo (🐜 + gradient "The ANTs")
        ├── Desktop Groups (md:flex, 7 dropdowns)
        │   ├── Learn: Course Manager, Lesson Tracker, My Workspace
        │   ├── Study: Flashcards, Notes, Pomodoro
        │   ├── Plan: Timetable, Exam Countdown, Grade Calculator
        │   ├── Library: Courses, Flashcards, Notes, Exams
        │   ├── Community: Classrooms, Clubs, Explore Profiles
        │   ├── Contribute (contributor+): Editors, Presets, Countdown
        │   └── Admin (main_contributor only): Review Queue, Role Upgrades
        ├── Theme Toggle (Sun/Moon icon)
        ├── User Avatar Menu (initials + dropdown)
        └── Mobile Hamburger (md:hidden)
```

**Role Visibility:**

| Group | Student | Teacher | Contributor | Main Contributor |
|---|---|---|---|---|
| Learn, Study, Plan, Library, Community | ✅ | ✅ | ✅ | ✅ |
| Contribute | — | — | ✅ | ✅ |
| Admin | — | — | — | ✅ |

**Behaviors:**
- Scroll hide when scrolling down >80px
- Dropdown: click to open, outside click to close
- Active route highlighting (startsWith item.href)
- Recently visited tracking (localStorage, max 5)
- Mobile: full-screen overlay

---

### 9. DashboardLayout

**File:** `src/components/layout/DashboardLayout.tsx`

| Prop | Type | Description |
|---|---|---|
| `firstName` | `string` | Welcome greeting |
| `welcomeSubtitle` | `string` | Contextual text |
| `stats` | `StatItem[]` | 4 stat cards |
| `alertBanner` | `ReactNode` | Optional alert |
| `mainContent` | `ReactNode` | 2/3 width main area |
| `sidebarContent` | `ReactNode` | 1/3 width sidebar |

```tsx
<DashboardLayout
  firstName="Aye Chan"
  welcomeSubtitle="Keep up the momentum — you're on a 5-day streak!"
  stats={[
    { label: 'Study Streak', value: 5, color: 'orange', key: 'study-streak' },
    { label: 'Cards Due', value: 42, color: 'violet', key: 'cards-due' },
    { label: 'Next Exam', value: '18d', color: 'red', key: 'next-exam' },
    { label: 'Avg Confidence', value: '82%', color: 'emerald', key: 'avg-confidence' },
  ]}
  mainContent={<RecentActivity />}
  sidebarContent={<UpcomingExams />}
/>
```

---

## Homepage Components (`src/components/homepage/`)

---

### 10. HeroVisual

Decorative widget panel: live-ticking countdown + mini timetable grid. Purely decorative data.

```tsx
import HeroVisual from '@/components/homepage/HeroVisual';
<HeroVisual />
```

---

### 11. RevealSection

Scroll-reveal wrapper (IntersectionObserver, 12% threshold).

| Prop | Type | Default |
|---|---|---|
| `children` | `ReactNode` | required |
| `className` | `string` | — |
| `delayMs` | `number` | `0` |
| `stagger` | `boolean` | `false` |

```tsx
<RevealSection delayMs={200}>
  <h2>Features</h2>
</RevealSection>

<RevealSection stagger>
  <div className="hp-reveal">Card 1</div>
  <div className="hp-reveal">Card 2</div>
</RevealSection>
```

---

### 12. BentoFeatures

4-column (4→2→1 responsive) bento grid of 8 feature tiles with interactive demos.

```tsx
import BentoFeatures from '@/components/homepage/BentoFeatures';
<BentoFeatures />
```

---

### 13. StatsRow

4-column (4→2 responsive) animated stat blocks.

---

### 14. QualCarousel

**File:** `src/components/homepage/QualCarousel.tsx`

Non-interactive auto-advancing carousel for qualification board display. Replaces the previous interactive chevron-based carousel.

| Behavior | Detail |
|---|---|
| Auto-advance interval | 4.5 seconds |
| Transition | `carouselSlideIn` keyframe: fade + translateY(12px) + scale(0.98) |
| Navigation dots | Purely decorative — `<span aria-hidden="true" role="presentation">` |
| Interaction | None — no click handlers, no pause on hover |

```tsx
import QualCarousel from '@/components/homepage/QualCarousel';
<QualCarousel />
```

Slides are keyed on `current` index for React animation replay on each transition. The component is entirely decorative — users cannot manually navigate between slides.

---

### 15. RoleLadder

**File:** `src/components/homepage/RoleLadder.tsx`

Visual role hierarchy: Student → Teacher → Contributor → Main Contributor. All rungs aligned at the same baseline with approval-flow indicators.

**Redesign highlights:**
- All role cards share the same baseline — no staircase offsets
- Between each tier: vertical `↑` (ArrowUp) icon + `🔒` (Lock) icon, indicating "needs approval to rise"
- Step tags reflect the approval workflow:
  - Teacher: "Upgrade · requires approval"
  - Contributor: "Upgrade · requires approval"  
  - Main Contributor: "Gatekeeper · approves every upgrade"
- Main Contributor card features a `ShieldCheck` icon for gatekeeper role
- Bottom note styled as a centered flow pill with "Main Contributor" badge

```tsx
import RoleLadder from '@/components/homepage/RoleLadder';
<RoleLadder />
```

---

### 16. AntTrailPattern

**File:** `src/components/homepage/AntTrailPattern.tsx`

Brand-distinctive background pattern rendering an ant-trail geometric mesh via SVG data URI. Applied to all 7 homepage sections.

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'brand' \| 'violet' \| 'mixed'` | `'brand'` | Color tint — references `--hp-brand` or `--hp-violet` |
| `opacity` | `number` | `0.12` | Override base opacity |
| `fadeEdges` | `boolean` | `true` | Enable CSS mask-image gradient fade at top/bottom edges |

**Pattern Spec:**
- Tile size: 120px × 120px (responsive: 100px tablet, 80px mobile)
- 8 nodes (2px radius) + 9 trail lines (0.8px stroke) per tile
- Inline SVG encoded as URL-encoded data URI (~1.1KB)
- `currentColor` driven by `color` CSS property for per-variant tinting

**Accessibility:**
- `aria-hidden="true"` + `role="presentation"` — hidden from assistive technology
- `pointer-events: none` — never intercepts clicks or focus
- Hidden entirely in `prefers-reduced-data` mode

```tsx
import AntTrailPattern from '@/components/homepage/AntTrailPattern';
<AntTrailPattern variant="mixed" opacity={0.11} />
<AntTrailPattern variant="brand" opacity={0.14} fadeEdges={false} />
```

**Section assignment (v1.1):**

| Section | Variant | Opacity |
|---|---|---|
| Hero | `mixed` | 0.11 |
| Explore | `brand` | 0.14 |
| Stats | `brand` | 0.09 |
| Features | `mixed` | 0.13 |
| Qualifications | `brand` | 0.14 |
| Roles | `violet` | 0.10 |
| CTA | `mixed` | 0.09 |

---

### 17. DotGrid

Decorative polka-dot background pattern. Used alongside AntTrailPattern in select sections.

---

## Feature Components

### Flashcards

| Component | File |
|---|---|
| `DeckCard` | `src/components/flashcards/DeckCard.tsx` |
| `CreateDeckModal` | `src/components/flashcards/CreateDeckModal.tsx` |
| `DeckLibrary` | `src/components/flashcards/DeckLibrary.tsx` |
| `StudySession` | `src/components/flashcards/StudySession.tsx` |
| `SessionSummary` | `src/components/flashcards/SessionSummary.tsx` |
| `CardCreatorAI` | `src/components/flashcards/CardCreatorAI.tsx` |
| `CardCreatorManual` | `src/components/flashcards/CardCreatorManual.tsx` |
| `AICardParser` | `src/components/flashcards/AICardParser.tsx` |
| `AIPromptGenerator` | `src/components/flashcards/AIPromptGenerator.tsx` |
| `FlashcardText` | `src/components/flashcards/FlashcardText.tsx` |
| `DeckEditView` | `src/components/flashcards/DeckEditView.tsx` |

### Countdown

| Component | File |
|---|---|
| `CountdownCard` | `src/components/countdown/CountdownCard.tsx` |
| `CountdownManager` | `src/components/countdown/CountdownManager.tsx` |
| `AddCountdownModal` | `src/components/countdown/AddCountdownModal.tsx` |

### Timetable

| Component | File |
|---|---|
| `TimetableManager` | `src/components/timetable/TimetableManager.tsx` |
| `WeekView` | `src/components/timetable/WeekView.tsx` |
| `DayView` | `src/components/timetable/DayView.tsx` |
| `MonthView` | `src/components/timetable/MonthView.tsx` |
| `TimeBlock` | `src/components/timetable/TimeBlock.tsx` |
| `EventModal` | `src/components/timetable/EventModal.tsx` |
| `InlineCreate` | `src/components/timetable/InlineCreate.tsx` |
| `TimetableFilters` | `src/components/timetable/TimetableFilters.tsx` |
| `IntegrationBanner` | `src/components/timetable/IntegrationBanner.tsx` |

### Classrooms

| Component | File |
|---|---|
| `ClassroomList` | `src/components/classrooms/ClassroomList.tsx` |
| `ClassroomCard` | `src/components/classrooms/ClassroomCard.tsx` |
| `ClassroomDetail` | `src/components/classrooms/ClassroomDetail.tsx` |
| `AssignmentsPanel` | `src/components/classrooms/AssignmentsPanel.tsx` |
| `DiscussionsPanel` | `src/components/classrooms/DiscussionsPanel.tsx` |
| `MembersPanel` | `src/components/classrooms/MembersPanel.tsx` |
| `ResourcesPanel` | `src/components/classrooms/ResourcesPanel.tsx` |
| `LinksPanel` | `src/components/classrooms/LinksPanel.tsx` |
| `QuizzesPanel` | `src/components/classrooms/QuizzesPanel.tsx` |
| `QuizCreator` | `src/components/classrooms/QuizCreator.tsx` |
| `QuizTakeModal` | `src/components/classrooms/QuizTakeModal.tsx` |

### Clubs

| Component | File |
|---|---|
| `ClubDiscovery` | `src/components/clubs/ClubDiscovery.tsx` |
| `ClubDetail` | `src/components/clubs/ClubDetail.tsx` |
| `MemberProgressPanel` | `src/components/clubs/MemberProgressPanel.tsx` |
| `MilestoneTracker` | `src/components/clubs/MilestoneTracker.tsx` |

### Notes

| Component | File |
|---|---|
| `NotesEditor` | `src/components/notes/NotesEditor.tsx` |
| `NoteViewer` | `src/components/notes/NoteViewer.tsx` |
| `BlockEditor` | `src/components/notes/BlockEditor.tsx` |
| `BlockPreview` | `src/components/notes/BlockPreview.tsx` |
| `NoteCard` | `src/components/notes/NoteCard.tsx` |
| `NoteFilters` | `src/components/notes/NoteFilters.tsx` |
| `NoteSubmitModal` | `src/components/notes/NoteSubmitModal.tsx` |
| `NoteReaderModal` | `src/components/notes/NoteReaderModal.tsx` |
| `NotesLibrary` | `src/components/notes/NotesLibrary.tsx` |
| `MyNotesLibrary` | `src/components/notes/MyNotesLibrary.tsx` |
| `SavedNotesLibrary` | `src/components/notes/SavedNotesLibrary.tsx` |
| `AnimationBlock` | `src/components/notes/AnimationBlock.tsx` |
| `AIPromptGenerator` | `src/components/notes/AIPromptGenerator.tsx` |

### Library

| Component | File |
|---|---|
| `CoursesLibraryBrowser` | `src/components/library/CoursesLibraryBrowser.tsx` |
| `ExamsLibraryBrowser` | `src/components/library/ExamsLibraryBrowser.tsx` |
| `FlashcardsLibraryBrowser` | `src/components/library/FlashcardsLibraryBrowser.tsx` |

### 10. Footer

**File:** `src/components/layout/Footer.tsx`

Dedicated 4-column responsive footer component replacing the previous inline footer in `page.tsx`.

**Structure:**
```
Footer (role="contentinfo", wrapped with DotGrid)
├── Container (max-w-7xl)
│   ├── Brand Column — Logo + tagline + social icons (GitHub, Discord, Email)
│   ├── Quick Links — About, Features, Clubs, Profiles, Blog
│   ├── Account — Sign In, Sign Up, Dashboard, Settings
│   └── Contact — Email, Location, Hours, Support
└── Bottom Bar — Copyright + Privacy/Terms links
```

**Responsive:**
| Viewport | Columns |
|---|---|
| Desktop (≥860px) | 4 columns |
| Tablet (501-859px) | 2 columns |
| Mobile (≤500px) | 1 column |

**Icons:**
- GitHub: inline SVG (not lucide-react — avoids missing icon issue)
- Discord: `MessageCircle` (lucide-react)
- Email: `Mail` (lucide-react)

**Accessibility:** `role="contentinfo"`, `aria-label` on sections, semantic `<nav>` with `role="list"`.

```tsx
import Footer from '@/components/layout/Footer';
<Footer />
```

---

### Auth

| Component | File |
|---|---|
| `LoginForm` | `src/components/auth/LoginForm.tsx` |
| `SignupForm` | `src/components/auth/SignupForm.tsx` |
| `ForgotPasswordPanel` | `src/components/auth/ForgotPasswordPanel.tsx` |

### Profile

| Component | File |
|---|---|
| `ProfileHero` | `src/components/profile/ProfileHero.tsx` |
| `ProfileStats` | `src/components/profile/ProfileStats.tsx` |
| `ProfileActivity` | `src/components/profile/ProfileActivity.tsx` |
| `ClubMembershipsPanel` | `src/components/profile/ClubMembershipsPanel.tsx` |
| `CertificationSection` | `src/components/profile/CertificationSection.tsx` |
| `ShareProfileButton` | `src/components/profile/ShareProfileButton.tsx` |

### Settings

| Component | File |
|---|---|
| `ProfileEditor` | `src/components/settings/ProfileEditor.tsx` |
| `AdvancedProfileEditor` | `src/components/settings/AdvancedProfileEditor.tsx` |
| `RoleSwitcher` | `src/components/settings/RoleSwitcher.tsx` |
| `RoleUpgradeForm` | `src/components/settings/RoleUpgradeForm.tsx` |
| `CertificationEditor` | `src/components/settings/CertificationEditor.tsx` |

### Shared Views

| Component | File |
|---|---|
| `SharedCountdownView` | `src/components/share/SharedCountdownView.tsx` |
| `SharedDeckView` | `src/components/share/SharedDeckView.tsx` |
| `SharedNoteView` | `src/components/share/SharedNoteView.tsx` |

### Contributor / Admin

| Component | File |
|---|---|
| `ReviewQueue` | `src/components/review-queue/ReviewQueue.tsx` |
| `ReviewQueuePanel` | `src/components/exam-data/ReviewQueuePanel.tsx` |
| `MySubmissions` | `src/components/exam-data/MySubmissions.tsx` |
| `CountdownEditor` | `src/components/exam-data/CountdownEditor.tsx` |
| `GradeCalculator` | `src/components/exam-data/GradeCalculator.tsx` |
| `GradeCalculatorEditor` | `src/components/exam-data/GradeCalculatorEditor.tsx` |
| `ExamDataEditor` | `src/components/exam-editor/ExamDataEditor.tsx` |
| `CurriculumLibraryAdmin` | `src/components/editor/CurriculumLibraryAdmin.tsx` |
| `UsersTable` | `src/components/contributor-manager/UsersTable.tsx` |
| `InviteForm` | `src/components/contributor-manager/InviteForm.tsx` |
| `CompleteProfileForm` | `src/components/contributor-manager/CompleteProfileForm.tsx` |
| `OtpVerification` | `src/components/contributor-manager/OtpVerification.tsx` |
| `StepIndicator` | `src/components/contributor-manager/StepIndicator.tsx` |
| `OnboardingWizard` | `src/components/onboarding/OnboardingWizard.tsx` |

### Lessons

| Component | File |
|---|---|
| `LessonTracker` | `src/components/Lessons/LessonTracker.tsx` |
| `TopicCard` | `src/components/Lessons/TopicCard.tsx` |

### Courses

| Component | File |
|---|---|
| `CourseManagerWizard` | `src/components/courses/CourseManagerWizard.tsx` |

### Workspace

| Component | File |
|---|---|
| `MyWorkspace` | `src/components/workspace/MyWorkspace.tsx` |

### About

| Component | File |
|---|---|
| `OrgTimeline` | `src/components/about/OrgTimeline.tsx` |
| `TeamMemberCard` | `src/components/about/TeamMemberCard.tsx` |

---

## Utility Classes

### Glassmorphism

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}

.glass-subtle {
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
}
```

```tsx
<div className="glass rounded-2xl p-4">Glass card content</div>
```

### Focus Ring

```css
.focus-ring {
  outline: none;
}
.focus-ring:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

```tsx
<button className="focus-ring">Click me</button>
```

### Animation Utilities

| Class | Effect |
|---|---|
| `.animate-fade-in` | Fade in (0.5s) |
| `.animate-fade-in-up` | Fade + slide up (0.6s) |
| `.animate-slide-down` | Slide down from top (0.3s) |
| `.animate-float` | Floating up/down (3s infinite) |
| `.animate-glow` | Box-shadow pulse (2s infinite) |
| `.animate-shimmer` | Shimmer loading (1.5s infinite) |
| `.animate-pulse-soft` | Soft opacity pulse (2s infinite) |

### Staggered Delays

```tsx
<div className="animate-fade-in-up delay-100">Item 1</div>
<div className="animate-fade-in-up delay-200">Item 2</div>
<div className="animate-fade-in-up delay-300">Item 3</div>
```

---

## Component Rules

| Rule | Description |
|---|---|
| **One file per component** | No multiple components in a single file (except tightly coupled sub-components like RoleBadge in Badge.tsx). |
| **Default export** | All reusable components use `export default function`. |
| **Props interface** | Every component has a named interface for its props. |
| **'use client'** | Every interactive component starts with `'use client'`. |
| **No hardcoded styles** | Use CSS variables or Tailwind classes. Never hardcode colors, spacing, or font sizes. |
| **All states covered** | Every component handles: default, hover, focus, active, loading, disabled, error, empty. |
