# The ANTs — Design System & Visual Identity

## 1. Brand Philosophy & Identity

The ANTs brand identity is rooted in its logo: a dedicated student ant with a pencil, set against a warm, approachable cream background with rich golden ochre accents.

### Core Palette (Single-Scheme Architecture)

| Token | CSS Variable | Hex / Value | Description & Usage |
|---|---|---|---|
| Page Background | `--background` | `#FDF9F3` | Warm cream base for the whole app |
| Section Background | `--background-secondary` | `#F5F0E6` | Muted cream for cards, wells, and alternating sections |
| Card Surface | `--background-card` | `#FFFCF7` | Elevated card surface on cream background |
| Elevated Surface | `--background-elevated` | `#FAF6EE` | Interactive elevated elements and dropdowns |
| Ink (Primary Text) | `--foreground` | `#2A261E` | High-contrast warm charcoal-brown text |
| Ink (Secondary Text) | `--foreground-secondary` | `#4A453C` | Body and supporting text |
| Ink (Muted Text) | `--foreground-muted` | `#7A7468` | Captions, placeholders, inactive icons |
| Border | `--border` | `rgba(197, 148, 25, 0.14)` | Subtle gold-tinted border |
| Border Hover | `--border-hover` | `rgba(197, 148, 25, 0.28)` | Hover state for borders |
| Brand Gold (Primary) | `--primary` | `#C59419` | Primary action buttons, active states, key branding |
| Primary Hover | `--primary-hover` | `#A67D14` | ~15% darker gold for interactive hover |
| Primary Light | `--primary-light` | `rgba(197, 148, 25, 0.12)` | Subtle gold tint for highlights & badges |
| Primary Foreground | `--primary-foreground` | `#FFFFFF` | Text on primary gold buttons (WCAG AA) |
| Accent (Secondary) | `--accent` | `#D4A84B` | Secondary warm gold for gradients and highlights |
| Accent Hover | `--accent-hover` | `#B8901E` | Hover state for accent elements |

---

## 2. Typography

- **Primary Font**: `Quicksand` (Clean, rounded, friendly sans-serif for UI & body text)
- **Editorial / Display Font**: `Fraunces` (High-character serif for homepage headlines)
- **Monospace Font**: `JetBrains Mono` / `Geist Mono` (Code blocks, exam codes, timers)

---

## 3. Role Colors

Role indicators maintain distinctive identification within the warm brand environment:

- **Student**: `#4A7C59` (Forest Green) / `var(--color-role-student)`
- **Teacher**: `#B45309` (Warm Amber) / `var(--color-role-teacher)`
- **Contributor**: `#C59419` (Brand Gold) / `var(--color-role-contributor)`
- **Main Contributor**: `#7C3AED` (Royal Violet) / `var(--color-role-main-contributor)`

---

## 4. Architecture & Token Flow

```
globals.css (:root variables)
       ↓
Tailwind @theme inline registration
       ↓
Semantic UI Components (bg-background-card, text-primary, border-border)
```

No runtime theme-switching infrastructure is used. All components consume clean semantic tokens directly.
