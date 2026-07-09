# 09 — Content Guidelines

> **Applies to:** All production code, mockups, component examples, and demo content.

---

## 1. Text Content Mandate

### Rule: NO Lorem Ipsum or Placeholder Text

Every piece of text in production code must be real, meaningful, and appropriate for the context. Placeholder text is banned from all shipped components, pages, and mockups.

### Examples of Current Production Text

| Context | Example |
|---|---|
| Homepage hero heading | "Your Academic Command Centre" |
| Feature description | "Drag-and-drop weekly planner with colour-coded events..." |
| Countdown card title | "IGCSE Physics · Paper 1" |
| Deck name | "Physics Formulas — Mechanics & Forces" |
| Section eyebrow | "Features" / "Explore" / "Roles" |
| Stat label | "EXAM BOARDS" / "ACTIVE CLUBS" |
| Welcome subtitle | "Keep up the momentum — you're on a 5-day streak!" |

### What to Use Instead of Placeholders

```tsx
// ❌ WRONG
<h2>Lorem ipsum dolor sit amet</h2>
<p>Consectetur adipiscing elit. Sed do eiusmod tempor.</p>

// ✅ CORRECT — Use real, contextual text
<h2>Master IGCSE Physics with Spaced Repetition</h2>
<p>Review key formulas and concepts using our adaptive flashcard system.</p>
```

---

## 2. Writing Tone & Voice

| Context | Tone | Example |
|---|---|---|
| **App UI** | Concise, helpful, encouraging | "You're on a 5-day streak! Keep it going." |
| **Homepage** | Confident, aspirational, clear | "Your Academic Command Centre" |
| **Error messages** | Actionable, blame-free | "We couldn't find that deck. It may have been deleted." |
| **Empty states** | Inviting, instructive | "No countdowns yet. Add your first exam to get started." |
| **Labels & CTAs** | Action-oriented | "Start Studying" / "Browse Library" / "Create Deck" |

---

## 3. Image & Media Specifications

| Asset Type | Format | Dimensions | Notes |
|---|---|---|---|
| **Preset avatars** | Emoji in div | 40/64/96/128px | Gradient background + emoji character |
| **Uploaded avatars** | JPEG/PNG/WebP | Container: per size prop | `object-cover`, `rounded-full` |
| **Qualification logos** | SVG (preferred) | 48–64px height | Used in QualTrail/Carousel |
| **Favicon** | ICO | 32×32px | `src/app/favicon.ico` |
| **OG image** | PNG | 1200×630px | Not yet implemented |
| **Deck/Note icons** | Lucide SVG | 14–22px | Color-coded per category |
| **Dashboard stat icons** | Lucide SVG | 20px | Color-coded per stat type |

### Avatar Example

```tsx
// Preset emoji avatar (no image file needed)
<AvatarImage avatar="preset:fox" name="May" size="lg" />

// Uploaded image avatar
<AvatarImage avatar="https://example.com/photo.jpg" name="Aye Chan" size="md" />

// Empty → initials fallback
<AvatarImage avatar="" name="Thiri Aung" size="md" />
```

### No Placeholder Images

```tsx
// ❌ WRONG
<img src="https://via.placeholder.com/150" alt="placeholder" />

// ✅ CORRECT — Use the AvatarImage component with initials fallback
<AvatarImage avatar={user.avatar_url} name={user.name} size="md" />

// ✅ CORRECT — For illustrations, use Lucide icons or CSS gradients
<div className="rounded-xl bg-gradient-to-br from-primary to-accent p-8" />
```

---

## 4. KaTeX & Math Rendering

- **Library:** `react-katex` v3.1.0 + `katex` v0.17.0
- **Fonts:** Served locally from `public/fonts/` (WOFF2 format)
- **Styles:** `src/app/katex-local.css`

### Where KaTeX Is Used

- FlashcardText (`src/components/flashcards/FlashcardText.tsx`)
- NoteViewer (`src/components/notes/NoteViewer.tsx`)
- BlockEditor (math blocks)

### Usage Example

```tsx
import { InlineMath, BlockMath } from 'react-katex';

// Inline formula
<InlineMath math="E = mc^2" />

// Block formula
<BlockMath math="F = G\frac{m_1 m_2}{r^2}" />
```

### Content Rule for Math

- Use proper LaTeX syntax
- No text mixed with math in the same equation without `\text{}`
- Keep displayed equations on their own line with BlockMath
- Inline math for formulas within paragraphs

---

## 5. Mermaid Diagrams

- **Library:** `mermaid` v11.16.0
- **Used in:** NoteViewer, BlockEditor (diagram blocks)

```tsx
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'default' });
```

---

## 6. Content Rules Summary

| # | Rule |
|---|---|
| 1 | No lorem ipsum in any production component, page, or mockup |
| 2 | No placeholder images — use AvatarImage, Lucide icons, or CSS gradients |
| 3 | Error messages are actionable, not technical |
| 4 | Empty states invite action, not dead ends |
| 5 | Math uses proper LaTeX via KaTeX |
| 6 | All user-facing text must be grammatically correct and spelled correctly |
| 7 | CTAs use active verbs: "Create", "Start", "Browse", "Save" |
| 8 | No emoji in app UI (homepage decorative emoji like 🐜 is allowed) |
