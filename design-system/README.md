# The ANTs Design System

**Version:** 1.0.0
**Last Updated:** 2026-07-07
**Target Standard:** WCAG 2.1 AA
**Tech Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript · Lucide React · KaTeX

---

## Purpose

The ANTs Design System is the single source of truth for all visual, interaction, and accessibility standards across [The ANTs](https://the-ants.org/) platform. It ensures every developer and designer speaks the same language — from color tokens to component behavior to keyboard navigation.

---

## Quick Start

> **[[design-system.md](./design-system.md)] is the file to edit for colors and typography.**
> The palette and font choices are not yet finalized — iterate on them here first,
> then apply to `globals.css` and `ThemeContext.tsx`.

### For Developers

1. **Design the look.** Edit [design-system.md](./design-system.md) for color palette and typography decisions.
2. **Know your components.** Browse [06-component-library.md](./06-component-library.md) before building new UI.
3. **Use the right icons.** Check [04-icons.md](./04-icons.md) — we use Lucide React exclusively.
4. **Respect animation rules.** [05-animation-motion.md](./05-animation-motion.md) defines all transitions and easing.
5. **Be accessible.** [10-accessibility.md](./10-accessibility.md) is mandatory reading before PR.

### How to Use Tokens in Code

```tsx
// ✅ CORRECT — Use CSS variables
<div style={{ color: 'var(--foreground)', background: 'var(--background-card)' }}>

// ✅ CORRECT — Use Tailwind utility classes (registered via @theme inline)
<div className="text-foreground bg-background-card">

// ❌ WRONG — Hardcoded colors
<div style={{ color: '#0f172a' }}>
```

### How to Use Components

```tsx
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

// Primary button
<Button variant="primary" size="md">Save</Button>

// Input with error
<Input label="Email" error="Invalid email" />

// Role badge
<Badge variant="student">Student</Badge>
```

### How to Add a New Component

See [12-contribution-guide.md](./12-contribution-guide.md) for the full governance process. TL;DR:

1. Propose in the design-system channel
2. Build in `src/components/ui/` or feature folder
3. Use existing tokens — no new hardcoded colors
4. Include all states (hover, focus, loading, disabled, error)
5. Meet WCAG 2.1 AA contrast
6. Update the relevant `.md` file in this folder

---

## File Index

| # | File | What It Covers |
|---|---|---|
| — | [README.md](./README.md) | You are here — index + quick start |
| — | [design-system.md](./design-system.md) | **Color palette & typography** — the primary file to iterate on. Contains all color tokens (app + homepage), all 6 color presets, font families, type scales, and letter spacing rules. |
| 03 | [03-layout-grid.md](./03-layout-grid.md) | Breakpoints, responsive grid system, spacing scale, container widths |
| 04 | [04-icons.md](./04-icons.md) | Lucide icon inventory (55 icons), sizing rules, stroke width, usage locations |
| 05 | [05-animation-motion.md](./05-animation-motion.md) | Keyframes, easing curves, scroll-reveal system, interactive transitions, reduced motion |
| 06 | [06-component-library.md](./06-component-library.md) | Full spec for all ~90 components: Button, Input, Badge, NavBar, DashboardLayout, Cards, Timetable, etc. |
| 07 | [07-interaction-flows.md](./07-interaction-flows.md) | Button/input states, card hover, dropdown mechanics, theme toggle, scroll behavior, countdown timer |
| 08 | [08-theming.md](./08-theming.md) | Two-layer CSS variable strategy, localStorage persistence, color preset system, ThemeContext |
| 09 | [09-content-guidelines.md](./09-content-guidelines.md) | Real-text mandate, image/media specs, KaTeX rendering, writing tone |
| 10 | [10-accessibility.md](./10-accessibility.md) | WCAG 2.1 AA compliance audit, contrast ratios, focus indicators, keyboard nav, ARIA patterns |
| 11 | [11-figma-handoff.md](./11-figma-handoff.md) | Design token → Figma style mapping, component structure, spacing/radius scales |
| 12 | [12-contribution-guide.md](./12-contribution-guide.md) | How to propose, build, review, and ship new design system additions |

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2 |
| UI Library | React | 19.2 |
| Styling | Tailwind CSS | v4 |
| Icons | Lucide React | 1.18 |
| Math | KaTeX / react-katex | 0.17 / 3.1 |
| Diagrams | Mermaid | 11.16 |
| Drag & Drop | @dnd-kit/core | 6.3 |
| Backend | Supabase | JS v2.110 |
| Auth | Supabase Auth (SSR) | 0.12 |
| Language | TypeScript | 5.x |
| Sanitization | DOMPurify | 3.4 |

---

## Key Principles

1. **CSS Variables First.** Every color, shadow, and radius comes from a token. No exceptions.
2. **Theme-Agnostic.** Components work in light and dark modes without modification.
3. **Accessible by Default.** All interactive elements ship with focus indicators, ARIA labels, and keyboard support.
4. **Lucide Only.** One icon library. Import from `lucide-react` only.
5. **Real Content ALWAYS.** No lorem ipsum in production code. No placeholder images in shipped components.
6. **Reduced Motion.** Every animation respects `prefers-reduced-motion: reduce`.
