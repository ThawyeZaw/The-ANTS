# 12 — Contribution & Governance

> **How to propose, build, review, and ship additions to The ANTs Design System.**

---

## 1. When to Contribute

You should contribute to the design system when:

- You're building a **new reusable component** that will be used in 2+ places
- You need a **new color, shadow, or spacing token** not in the existing palette
- You discover a **visual inconsistency** across components that needs standardization
- You're adding a **new icon** that replaces a pattern of custom SVGs
- You're fixing an **accessibility gap** (e.g., missing `aria-label`, contrast issue)

You should NOT contribute to the design system when:

- You're building a **one-off page-specific component** (keep in the page file)
- You're adding a **minor visual tweak** that doesn't set a pattern
- The component is **still experimental** — prototype first, then propose

---

## 2. Contribution Workflow

```
Propose → Design → Build → Review → Document → Ship
```

### Step 1: Propose

Create a proposal with:

```markdown
## Component Proposal: [Name]

### Purpose
What problem does this solve? Where will it be used?

### Design
- [Link to Figma mockup]
- Light mode screenshot
- Dark mode screenshot

### API Preview
```tsx
<ComponentName prop1="value" prop2={value} />
```

### States Covered
- [ ] Default
- [ ] Hover
- [ ] Focus
- [ ] Active
- [ ] Loading (if async)
- [ ] Disabled
- [ ] Error
- [ ] Empty

### Accessibility
- [ ] Keyboard navigable
- [ ] ARIA labels where needed
- [ ] WCAG 2.1 AA contrast
- [ ] Screen reader tested
```

### Step 2: Design

Create the component in Figma following [11-figma-handoff.md](./11-figma-handoff.md):
- Use existing color/text/effect styles
- Create component variants (not separate components)
- Include all states
- Test at all breakpoints

### Step 3: Build

Follow these code conventions:

```tsx
'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — ComponentName
// Brief description of what this component does.
// ──────────────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';

interface ComponentNameProps {
  /** Description of prop */
  propName: string;
  /** Optional prop with default */
  optionalProp?: boolean;
}

export default function ComponentName({ propName, optionalProp = false }: ComponentNameProps) {
  return (
    <div className={cn(
      'base-styles-here',
      optionalProp && 'conditional-styles'
    )}>
      {propName}
    </div>
  );
}
```

**File placement:**
- Core UI → `src/components/ui/ComponentName.tsx`
- Feature-specific → `src/components/feature-name/ComponentName.tsx`

**Rules:**
- Default export
- `'use client'` on first line
- Named props interface
- JSDoc comments on props
- Tailwind classes via `cn()` utility
- Use existing CSS variables — NO hardcoded colors

### Step 4: Review

Review checklist:

| Check | Pass? |
|---|---|
| Uses existing design tokens (no new hardcoded colors) | ☐ |
| Works in both light and dark themes | ☐ |
| All states implemented (hover, focus, active, disabled, loading, error, empty) | ☐ |
| Keyboard accessible (Tab, Enter, Escape) | ☐ |
| Focus indicator visible (`.focus-ring` or equivalent) | ☐ |
| ARIA labels on icon-only elements | ☐ |
| WCAG 2.1 AA contrast (all text) | ☐ |
| `prefers-reduced-motion` respected | ☐ |
| Responsive (tested at 320px, 768px, 1024px, 1440px) | ☐ |
| No layout shift on state change | ☐ |
| Uses proper semantic HTML (`<button>` not `<div onClick>`) | ☐ |
| No console warnings or errors | ☐ |

### Step 5: Document

Update the relevant design system file(s):

| If you... | Update this file |
|---|---|
| Added a component | [06-component-library.md](./06-component-library.md) |
| Added a color/token | [01-design-tokens.md](./01-design-tokens.md) |
| Changed a font rule | [02-typography.md](./02-typography.md) |
| Added an icon | [04-icons.md](./04-icons.md) |
| Changed interaction behavior | [07-interaction-flows.md](./07-interaction-flows.md) |
| Added an animation | [05-animation-motion.md](./05-animation-motion.md) |
| Fixed accessibility | [10-accessibility.md](./10-accessibility.md) |

### Step 6: Ship

- Open PR with component code + design system doc updates
- Include screenshots (light + dark) in PR description
- Tag design-system reviewer
- After merge, notify the team channel

---

## 3. Governance Principles

### Design System Ownership

The design system is a **shared resource**. Everyone is responsible for keeping it accurate and up-to-date.

### Breaking Changes

| Change Type | Process |
|---|---|
| New component | Propose → build → PR |
| New prop on existing component | PR with backward compatibility |
| Change default value of existing prop | Discuss first — may break consumers |
| Remove a component or prop | Major version bump after deprecation period |
| Change a CSS variable value | Audit all usages first |

### Deprecation Policy

1. Mark as deprecated with JSDoc `@deprecated` tag
2. Document migration path
3. Remove in next major version

---

## 4. Adding a New Design Token

### Color Token

```css
/* 1. Add to :root (light theme) */
:root {
  --new-color: #HEXVAL;
}

/* 2. Add to [data-theme="dark"] (dark theme) */
[data-theme="dark"] {
  --new-color: #HEXVAL_DARK;
}

/* 3. Register in @theme inline */
@theme inline {
  --color-new-color: var(--new-color);
}

/* 4. Now usable as Tailwind class: bg-new-color, text-new-color */
```

### Shadow Token

```css
:root {
  --shadow-new: 0 4px 16px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  --shadow-new: 0 4px 16px rgba(0, 0, 0, 0.3);
}
```

### Typography Token

Add to [02-typography.md](./02-typography.md) type scale table and use Tailwind utility classes.

---

## 5. File Structure Conventions

```
design-system/
├── README.md                     # Index + quick start
├── 01-design-tokens.md           # Colors, CSS variables
├── 02-typography.md              # Fonts, type scale
├── 03-layout-grid.md             # Breakpoints, grid, spacing
├── 04-icons.md                   # Icon inventory + rules
├── 05-animation-motion.md        # Keyframes, easing, transitions
├── 06-component-library.md       # All component specs
├── 07-interaction-flows.md       # State machines, behaviors
├── 08-theming.md                 # Theme architecture
├── 09-content-guidelines.md      # Text, images, KaTeX
├── 10-accessibility.md           # WCAG 2.1 AA compliance
├── 11-figma-handoff.md           # Figma token mapping
└── 12-contribution-guide.md      # You are here
```

---

## 6. Quick Reference: Where Everything Lives

| What | Code Location | Doc Location |
|---|---|---|
| CSS variables | `src/app/globals.css` | `01-design-tokens.md` |
| Tailwind registration | `src/app/globals.css` (`@theme inline`) | `01-design-tokens.md` |
| Theme context | `src/context/ThemeContext.tsx` | `08-theming.md` |
| Button | `src/components/ui/Button.tsx` | `06-component-library.md` |
| Input | `src/components/ui/Input.tsx` | `06-component-library.md` |
| Badge | `src/components/ui/Badge.tsx` | `06-component-library.md` |
| NavBar | `src/components/layout/NavBar.tsx` | `06-component-library.md` |
| Homepage components | `src/components/homepage/*.tsx` | `06-component-library.md` |
| Feature components | `src/components/{feature}/*.tsx` | `06-component-library.md` |
| Icon import | `lucide-react` | `04-icons.md` |
| CN utility | `src/lib/utils.ts` | — |
