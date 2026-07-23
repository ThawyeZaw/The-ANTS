# 10 — Accessibility Compliance

> **Target:** WCAG 2.1 Level AA
> **Sources:** All `.tsx` components, `src/app/globals.css`

---

## 1. Color Contrast Audit

### App Tokens

| Element Pair | Light | Dark | AA Pass? |
|---|---|---|---|
| `--foreground` on `--background` | 15.9:1 | 12.9:1 | ✅ AAA |
| `--foreground-secondary` on `--background` | 8.5:1 | 6.2:1 | ✅ AA |
| `--foreground` on `--background-card` | 15.9:1 | 12.9:1 | ✅ AAA |
| `--primary-foreground` on `--primary` | 5.3:1 | 4.6:1 | ✅ AA |
| `--accent-foreground` on `--accent` | 4.9:1 | 4.6:1 | ✅ AA (borderline) |

### Action Required

**Dark theme primary button text** (`#1A1B17` on `#6AADDE`) has a contrast ratio of approximately **4.2:1**, which is below the WCAG AA minimum of 4.5:1 for normal text.

**Recommended fix:** Either:
1. Darken the dark theme primary-foreground from `#1A1B17` to a darker shade (or lighten `#6AADDE` slightly)
2. Add `text-shadow: 0 1px 2px rgba(0,0,0,0.1)` to primary button text in dark mode
3. Adjust dark theme primary value to achieve at least 4.5:1 contrast

---

## 2. Focus Indicators

All interactive elements use the `.focus-ring` pattern:

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

### Where It's Applied

| Component | How |
|---|---|
| **Button** | `className="focus-ring"` in base classes |
| **Input** | Custom focus style via Tailwind: `focus:ring-2 focus:ring-primary/50` |
| **Nav links** | `focus-visible:ring-2` pattern |
| **BackButton** | Inherits button focus |
| **Deck action buttons** | Native button focus |
| **Countdown delete** | `focus-visible:ring-2 focus-visible:ring-error` |

### Requirement

Every interactive element MUST have a visible focus indicator. The default browser outline is acceptable, but our `.focus-ring` pattern is preferred for consistency.

---

## 3. Keyboard Navigation

| Element | Key | Action |
|---|---|---|
| Nav dropdown trigger | `Enter` / `Space` | Open dropdown |
| Nav dropdown (open) | `Escape` | Close dropdown |
| Dropdown items | `Tab` / `Shift+Tab` | Navigate between items |
| Dropdown items | `Enter` | Activate link |
| Mobile hamburger | `Enter` / `Space` | Toggle menu |
| Theme toggle | `Enter` / `Space` | Toggle theme |
| Flip card demo | `Enter` / `Space` | Flip card |
| Deck study button | `Enter` / `Space` | Open study session |
| Form inputs | `Tab` / `Shift+Tab` | Navigate between fields |
| Modal | `Escape` | Close modal |
| Loading button | — | Cannot be activated (disabled) |

### Tab Order

The logical tab order should follow the visual layout:
1. Skip link (not yet implemented → **needs adding**)
2. NavBar logo
3. NavBar groups (left to right)
4. Theme toggle
5. User avatar menu
6. Main content
7. Sidebar (if present)

---

## 4. ARIA & Semantic HTML

### Currently Implemented

| Pattern | Implementation | Location |
|---|---|---|
| Theme toggle | `aria-label="Toggle theme"` | NavBar, Homepage nav |
| Mobile menu | `aria-label="Toggle menu"` | NavBar |
| Flip card demo | `aria-label="Flip flashcard demo"` | BentoFeatures |
| Countdown delete | `aria-label={"Delete ${title} countdown"}` | CountdownCard |
| Priority icons | `aria-hidden="true"` | CountdownCard |
| Priority label | `<span className="sr-only">Priority</span>` | CountdownCard |
| Nav landmark | `<header>` + `<nav>` elements | NavBar |
| Layout landmark | `<main>`, `<section>` | Pages |

### Required But Missing

| Pattern | Priority | Description |
|---|---|---|
| **Skip-to-content link** | High | `<a href="#main-content" className="sr-only focus:not-sr-only">` at top of each layout |
| **Modal focus trap** | High | Focus must be trapped inside open modals |
| **Form error association** | Medium | `aria-describedby` linking inputs to error messages |
| **Loading announcements** | Medium | `aria-live="polite"` for async content updates |
| **Table sorting** | Low | `aria-sort` on sortable table headers |

---

## 5. Alt Text

| Element | Alt Text Strategy |
|---|---|
| Uploaded avatar | Uses `name` prop: `<img alt={name}>` |
| Preset avatar | No `<img>` — emoji in div (purely decorative) |
| Qualification logos | Descriptive alt text per logo |
| Deck/Note card images | Contextual alt text from data |

---

## 6. Reduced Motion

Full support implemented in `src/app/globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all scroll-reveal animations */
  .hp-reveal, .hp-reveal-card {
    opacity: 1;
    transform: none;
    filter: none;
    transition: none;
  }

  /* Remove stagger delays */
  .hp-stagger > .hp-reveal {
    transition-delay: 0ms;
  }

  /* Stop infinite animations */
  .hp .animate-float,
  .hp .hp-grad {
    animation: none;
  }

  /* Stop flip card transition */
  .hp-flip-inner {
    transition: none;
  }
}
```

---

## 7. Screen Reader Accessibility

| Element | How It's Accessible |
|---|---|
| **Icons** | All Lucide icons are SVGs. Decorative icons use `aria-hidden="true"`. Functional icons (in buttons) get accessible names from parent button text or `aria-label`. |
| **Badges** | Text content is directly readable (e.g., "Student", "Approved", "3 due"). |
| **Loading states** | `Loader2` spinner gets accessible name from parent button. |
| **Countdown** | Digits are visible text. Labels (DAYS/HRS/MIN/SEC) provide context. |
| **Nav dropdown** | Button text + `aria-expanded` (should be added → **needs work**). |

---

## 8. Accessibility Checklist for New Components

Every new component must:

- [ ] Have visible focus indicators for all interactive elements
- [ ] Support keyboard activation (Enter/Space for clickable, Escape for dismissible)
- [ ] Use semantic HTML (`<button>` not `<div onClick>`, `<nav>` not `<div>`)
- [ ] Include `aria-label` on icon-only buttons
- [ ] Pass WCAG 2.1 AA contrast for all text
- [ ] Work with `prefers-reduced-motion: reduce`
- [ ] Not rely solely on color to convey information (add icons or text)
- [ ] Have alt text (`alt` attribute, `aria-label`, or `sr-only` text)

---

## 9. Known Gaps (To Be Addressed)

| Gap | Impact | Priority |
|---|---|---|
| Skip-to-content link missing | Keyboard users must tab through full nav | High |
| `aria-expanded` on dropdowns | Screen readers don't know dropdown state | Medium |
| Modal focus trap | Focus can escape modals | Medium |
| `aria-describedby` on form errors | Screen readers don't announce errors | Medium |
| Dark primary button contrast | Falls below AA in dark mode | Medium |
| `aria-live` regions for dynamic content | Async updates not announced | Low |
| Table `aria-sort` | Sortable columns not indicated | Low |
