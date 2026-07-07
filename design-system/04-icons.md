# 04 — Icons

> **Library:** Lucide React v1.18.0
> **Import:** `import { IconName } from 'lucide-react'`

---

## 1. Icon Library Policy

**Lucide React is the ONLY permitted icon library.** No other icon set (Heroicons, Font Awesome, Material Icons, custom SVGs) may be used without design system approval.

All icons are SVG-based React components from the `lucide-react` package.

---

## 2. Sizing Rules

| Context | Size Classes | Rendered Size | Example |
|---|---|---|---|
| Navigation items | `h-4 w-4` | 16×16px | NavBar dropdown items, nav links |
| Button icons | `h-4 w-4` | 16×16px | Leading/trailing icons in Button |
| Card stat icons | `h-3.5 w-3.5` to `h-5 w-5` | 14–20px | DeckCard stats, Dashboard stat cards |
| Dashboard stat icons | `h-5 w-5` | 20×20px | DashboardLayout stat cards |
| Feature tile icons | `w-[22px] h-[22px]` to `w-[26px] h-[26px]` | 22–26px | BentoFeatures big cards |
| Section header icons | `h-4 w-4` | 16×16px | RelatedContent section headers |
| Back button icon | `h-4 w-4` | 16×16px | BackButton component |

### Code Examples

```tsx
// Standard 16px nav icon
<GraduationCap className="h-4 w-4" />

// 20px dashboard stat icon
<Flame className="h-5 w-5" />

// Big feature card icon (26px with thinner stroke)
<CalendarDays style={{ width: 26, height: 26 }} strokeWidth={1.5} />
```

---

## 3. Stroke Width

| Context | Stroke | How |
|---|---|---|
| Feature tile icons (homepage) | 1.5 | `strokeWidth={1.5}` |
| All other icons | 2 (default) | No `strokeWidth` prop needed |

---

## 4. Complete Icon Inventory (55 Icons)

### Navigation & UI

| Icon | Used In |
|---|---|
| `ArrowLeft` | BackButton — all pages |
| `ArrowRight` | Homepage CTA links |
| `ChevronDown` | NavBar dropdowns, user menu — rotates 180° on open |
| `Home` | Homepage sticky nav |
| `Menu` | NavBar mobile hamburger (open state) |
| `X` | NavBar mobile hamburger (close state) |
| `Settings` | NavBar user menu |
| `Info` | NavBar user menu (About) |
| `LogOut` | NavBar user menu (Sign Out) |
| `Sun` | Theme toggle (show in dark mode) |
| `Moon` | Theme toggle (show in light mode) |
| `ExternalLink` | RelatedContent external links |
| `Link` (as `LinkIcon`) | DeckCard shared badge |

### Feature Icons (BentoFeatures + NavBar)

| Icon | Used In |
|---|---|
| `CalendarDays` | BentoFeatures (Smart Timetable), NavBar (Plan group), RelatedContent |
| `Layers` | BentoFeatures (Flashcards), DeckCard section header, NavBar (Study) |
| `Timer` | BentoFeatures (Pomodoro), NavBar |
| `ClipboardCheck` | BentoFeatures (Lesson Tracker), NavBar, DashboardLayout |
| `GraduationCap` | BentoFeatures (Virtual Classrooms), NavBar (Learn), DashboardLayout |
| `MessageSquare` | BentoFeatures (Clubs), NavBar, DashboardLayout |
| `Clock` | BentoFeatures (Exam Countdown), CountdownCard, NavBar |
| `Calculator` | BentoFeatures (Grade Calculator), NavBar, CountdownEditor |
| `Sparkles` | NavBar (Study group) |
| `BookMarked` | NavBar (Library group) |
| `Users` | NavBar (Community group), Homepage explore cards |
| `Pencil` | NavBar (Contribute group), DeckCard (edit) |
| `ShieldCheck` | NavBar (Admin group, Review Queue) |

### Library & Content

| Icon | Used In |
|---|---|
| `BookOpen` | NavBar, DeckCard stats, DashboardLayout |
| `Library` | NavBar (Notes Library) |
| `ScrollText` | NavBar (Courses Library) |
| `SquareStack` | NavBar (Flashcards Library) |
| `FlaskConical` | NavBar (Exams Library) |
| `NotebookPen` | NavBar (Notes, Notes Editor) |
| `Package` | RelatedContent |
| `LineChart` | RelatedContent (Your Progress) |
| `Bookmark` | NavBar |
| `Briefcase` | NavBar (My Workspace) |

### Countdown & Exams

| Icon | Used In |
|---|---|
| `Calendar` | CountdownCard |
| `ArrowUpCircle` | CountdownCard (high priority) |
| `MinusCircle` | CountdownCard (medium priority) |
| `ArrowDownCircle` | CountdownCard (low priority) |

### Flashcards & Study

| Icon | Used In |
|---|---|
| `Play` | DeckCard study button |
| `Brain` | DeckCard SRS due indicator |
| `Pencil` | DeckCard edit button |
| `Copy` | DeckCard clone button |
| `Trash2` | DeckCard delete, CountdownCard delete |
| `Globe` | DeckCard public badge |
| `Lock` | DeckCard private badge |
| `BookOpen` | DeckCard card count |
| `Zap` | DashboardLayout (cards due) |

### Dashboard Stats

| Icon | Used In |
|---|---|
| `Flame` | DashboardLayout (study streak) |
| `TrendingUp` | DashboardLayout (avg confidence) |
| `FileText` | DashboardLayout (pending assignments) |
| `CheckSquare` | DashboardLayout (completed) |
| `Star` | DashboardLayout (published) |
| `Send` | DashboardLayout (pending review) |
| `UserCircle` | NavBar, DashboardLayout (profile views) |
| `AlertTriangle` | DashboardLayout (pending reviews) |
| `CheckCircle` | DashboardLayout (approved) |
| `XCircle` | DashboardLayout (rejected) |

### User & Admin

| Icon | Used In |
|---|---|
| `UserPlus` | NavBar (Add User) |
| `Compass` | NavBar (Explore Profiles) |
| `LayoutGrid` | NavBar (Manage Org) |
| `Loader2` | Button loading state |

---

## 5. Icon Usage Patterns

### With Button Component

```tsx
// Leading icon
<Button icon={<Save className="h-4 w-4" />}>Save</Button>

// Trailing icon
<Button iconRight={<ArrowRight className="h-4 w-4" />}>Next</Button>

// Icon with loading state (icon auto-hides when loading)
<Button isLoading={isSaving} icon={<Save className="h-4 w-4" />}>Save</Button>
```

### With Input Component

```tsx
// Leading icon
<Input icon={<Search className="h-4 w-4" />} placeholder="Search..." />

// Trailing icon
<Input iconRight={<Eye className="h-4 w-4" />} type="password" />
```

### Inline with Text

```tsx
// Faded icon inline with text
<span className="inline-flex items-center gap-1.5 text-sm text-foreground-muted">
  <Calendar className="h-4 w-4" />
  15 May 2027
</span>

// Color-coded stat icon in container
<div className="inline-flex p-2 rounded-xl bg-orange-500/10 text-orange-500">
  <Flame className="h-5 w-5" />
</div>
```

---

## 6. Icon Rules

| Rule | Description |
|---|---|
| **No other libraries** | Only `lucide-react`. No Heroicons, no custom SVGs without approval. |
| **Consistent sizing** | Use the sizing table above. Don't use `h-6 w-6` for a button icon. |
| **No color override** | Icons inherit color from parent via `text-*` or `currentColor`. Don't hardcode `color` on icons. |
| **Always pair with text** | Every icon in a button or link should have visible or `sr-only` text. |
| **aria-hidden for decorative** | If an icon is purely decorative, add `aria-hidden="true"`. |
