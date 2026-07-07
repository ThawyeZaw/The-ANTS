# The ANTS — Color Palette & Typography

> **This is the primary file for defining what The ANTS looks like.**
> Edit this file when iterating on colors, fonts, or type scales.
> Changes here flow into `src/app/globals.css` and `src/context/ThemeContext.tsx`.

**Version:** 1.0.0 | **Last Updated:** 2026-07-07

---

## Where Colors & Typography Live

| Design Decision | Implementation File |
|---|---|
| App color tokens (light) | `src/app/globals.css` — `:root` block (line ~8) |
| App color tokens (dark) | `src/app/globals.css` — `[data-theme="dark"]` block (line ~64) |
| Tailwind registration | `src/app/globals.css` — `@theme inline` block (line ~108) |
| Color presets (6 themes) | `src/context/ThemeContext.tsx` — `COLOR_PRESETS` object |
| Homepage tokens (.hp) | `src/app/globals.css` — `.hp` block (line ~388) |
| Font loading (Inter) | `src/app/layout.tsx` |
| Homepage fonts (Fraunces, JetBrains) | `src/components/homepage/HomepageFonts.tsx` |

---

## 1. App Color Palette

These tokens power the authenticated application (dashboard, flashcards, classrooms, settings, etc.).

### 1.1 Backgrounds

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--background` | `#FAFBFC` | `#141923` | Page body |
| `--background-secondary` | `#F1F3F5` | `#1C2333` | Section containers |
| `--background-card` | `#FFFFFF` | `#232D3F` | Card surfaces |
| `--background-elevated` | `#FFFFFF` | `#2A3450` | Modal/dialog surfaces |

### 1.2 Text

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--foreground` | `#0F172A` | `#F1F5F9` | Primary text |
| `--foreground-secondary` | `#475569` | `#94A3B8` | Secondary/body text |
| `--foreground-muted` | `#94A3B8` | `#718096` | Placeholder/disabled text |

### 1.3 Borders

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--border` | `#E2E8F0` | `#2E3D55` | Default borders |
| `--border-hover` | `#CBD5E1` | `#3D5070` | Border hover state |

### 1.4 Primary & Accent

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--primary` | `#6366F1` | `#818CF8` | Buttons, links, focus rings |
| `--primary-hover` | `#4F46E5` | `#6366F1` | Button hover state |
| `--primary-light` | `#E0E7FF` | `rgba(99,102,241,0.15)` | Tinted backgrounds |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on primary bg |
| `--accent` | `#10B981` | `#34D399` | Success indicators, accent |
| `--accent-hover` | `#059669` | `#10B981` | Accent hover state |
| `--accent-light` | `#D1FAE5` | `rgba(16,185,129,0.15)` | Accent tint backgrounds |
| `--accent-foreground` | `#FFFFFF` | `#FFFFFF` | Text on accent bg |

### 1.5 Semantic Colors

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--success` | `#22C55E` | `#4ADE80` | Success states |
| `--warning` | `#F59E0B` | `#FBBF24` | Warning/caution |
| `--error` | `#EF4444` | `#F87171` | Error/destructive |
| `--info` | `#3B82F6` | `#60A5FA` | Info/neutral |

### 1.6 Role Colors

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--role-student` | `#3B82F6` | `#60A5FA` | Student badge (Blue) |
| `--role-teacher` | `#10B981` | `#34D399` | Teacher badge (Emerald) |
| `--role-contributor` | `#8B5CF6` | `#A78BFA` | Contributor badge (Violet) |
| `--role-main-contributor` | `#F59E0B` | `#FBBF24` | Main contributor badge (Amber) |

### 1.7 Shadows & Glass

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.2)` | Subtle card |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | `0 4px 12px rgba(0,0,0,0.3)` | Medium card |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | `0 8px 24px rgba(0,0,0,0.4)` | Strong card |
| `--shadow-glow` | `0 0 20px rgba(99,102,241,0.15)` | `0 0 20px rgba(129,140,248,0.2)` | Primary glow |
| `--glass-bg` | `rgba(255,255,255,0.7)` | `rgba(15,23,42,0.75)` | Glass bg |
| `--glass-border` | `rgba(255,255,255,0.3)` | `rgba(255,255,255,0.08)` | Glass border |
| `--glass-shadow` | `0 8px 32px rgba(0,0,0,0.06)` | `0 8px 32px rgba(0,0,0,0.3)` | Glass shadow |

### 1.8 Layout Token

| Token | Value | Usage |
|---|---|---|
| `--nav-height` | `4rem` | Navigation bar height |

---

## 2. Homepage Color Palette (`.hp` scope)

These tokens power the public landing page. They are isolated from app tokens.

### 2.1 Dark Theme (Default — `.hp`)

| Token | Value | Usage |
|---|---|---|
| `--hp-bg` | `#080B11` | Page background |
| `--hp-bg-soft` | `#0C1119` | Soft section backgrounds |
| `--hp-surface` | `#121926` | Card surfaces |
| `--hp-surface-2` | `#161E2C` | Secondary surfaces |
| `--hp-border` | `rgba(148,163,184,0.14)` | Default borders |
| `--hp-border-strong` | `rgba(148,163,184,0.26)` | Strong borders |
| `--hp-ink` | `#F3F6FB` | Primary text |
| `--hp-ink-muted` | `#9AA7BD` | Secondary text |
| `--hp-ink-faint` | `#5C6880` | Tertiary text |
| `--hp-brand` | `#3CDBA7` | Brand primary (teal-green) |
| `--hp-brand-deep` | `#1E9E78` | Brand darker variant |
| `--hp-amber` | `#F2B84B` | Highlight accent |
| `--hp-amber-deep` | `#C98F2A` | Amber darker variant |
| `--hp-violet` | `#8C7FF0` | Secondary accent |

### 2.2 Light Theme Override (`[data-theme="light"] .hp`)

| Token | Light Value |
|---|---|
| `--hp-bg` | `#F8FAFC` |
| `--hp-bg-soft` | `#F1F5F9` |
| `--hp-surface` | `#FFFFFF` |
| `--hp-surface-2` | `#F8FAFC` |
| `--hp-border` | `rgba(15,23,42,0.10)` |
| `--hp-border-strong` | `rgba(15,23,42,0.18)` |
| `--hp-ink` | `#0F172A` |
| `--hp-ink-muted` | `#475569` |
| `--hp-ink-faint` | `#94A3B8` |
| `--hp-brand` | `#059669` |
| `--hp-brand-deep` | `#047857` |
| `--hp-amber` | `#D97706` |
| `--hp-amber-deep` | `#B45309` |
| `--hp-violet` | `#7C3AED` |

### 2.3 Homepage Layout Tokens

| Token | Value | Usage |
|---|---|---|
| `--hp-radius-sm` | `10px` | Feature icon containers |
| `--hp-radius-md` | `16px` | Card corners, bento tiles |
| `--hp-radius-lg` | `26px` | Browser chrome wrapper |
| `--hp-maxw` | `1180px` | Max section width |

---

## 3. Color Presets

The app supports 6 interchangeable color themes. Users switch them in Settings → Theme.

Each preset overrides `--primary`, `--primary-hover`, `--primary-light`, `--accent`, `--accent-hover`, `--accent-light`, and `--shadow-glow`.

| Preset | Primary (Light) | Primary (Dark) | Gradient |
|---|---|---|---|
| **indigo** (default) | `#6366F1` | `#818CF8` | `from-indigo-500 to-violet-400` |
| **emerald** | `#10B981` | `#34D399` | `from-emerald-500 to-teal-400` |
| **sky** | `#0EA5E9` | `#38BDF8` | `from-sky-500 to-cyan-400` |
| **rose** | `#F43F5E` | `#FB7185` | `from-rose-500 to-pink-400` |
| **amber** | `#F59E0B` | `#FBBF24` | `from-amber-500 to-orange-400` |
| **teal** | `#14B8A6` | `#2DD4BF` | `from-teal-500 to-cyan-400` |

---

## 4. Typography

### 4.1 Font Families

| Font | Role | Source | CSS Variable |
|---|---|---|---|
| **Inter** | Primary body (app + homepage) | `next/font/google` | `--font-inter` |
| **Fraunces** | Homepage display headings | Google Fonts (dynamic) | `--hp-font-display` |
| **JetBrains Mono** | Homepage mono text | Google Fonts (dynamic) | `--hp-font-mono` |
| **Geist Mono** | App monospace | Next.js built-in | `--font-geist-mono` |

### 4.2 App Type Scale

Used throughout the authenticated application.

| Level | Font | Font Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| **H1** | Inter | 30px | 700 Bold | 1.2 | Page titles |
| **H2** | Inter | 24px | 600 SemiBold | 1.3 | Section headers |
| **H3** | Inter | 18px | 600 SemiBold | 1.4 | Card titles |
| **Body** | Inter | 14px | 400 Regular | 1.6 | Paragraphs, descriptions |
| **Body Large** | Inter | 16px | 400 Regular | 1.65 | Form labels, prominent text |
| **Caption** | Inter | 12px | 400 Regular | 1.4 | Metadata, timestamps |
| **Caption Bold** | Inter | 12px | 500–600 | 1.4 | Countdown labels |
| **Micro** | Inter | 10px | 500 Medium | 1.3 | Nav group headers, uppercase |
| **Mono** | Geist Mono | inherit | 600–700 | 1.2 | Countdown digits, code |

### 4.3 Homepage Type Scale

Used only within `.hp` scope on the landing page.

| Level | Font | Font Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| **Hero Heading** | Fraunces | `clamp(2.6rem, 5vw, 3.8rem)` | 560 | 1.08 | Main hero title |
| **Section Heading** | Fraunces | `clamp(1.9rem, 3.4vw, 2.7rem)` | 560 | 1.15 | Section titles |
| **Card Title** | Fraunces | 17–19px | 600 | 1.3 | Bento card titles |
| **Body** | Inter | 16–17px | 400 | 1.65 | Hero subtext |
| **Card Description** | Inter | 13.5–14px | 400 | 1.6 | Bento card descriptions |
| **Eyebrow** | JetBrains Mono | 11px | 600 | 1.3 | Section eyebrow |
| **Stat Value** | Fraunces | `clamp(2.8rem, 5vw, 4.2rem)` | 560 | 1 | Animated numbers |
| **Stat Label** | JetBrains Mono | 10.5px | 500 | 1.3 | Stat labels (uppercase) |

### 4.4 Letter Spacing

| Context | Value | How Applied |
|---|---|---|
| Normal text | `0` (default) | Do nothing |
| Uppercase labels (homepage) | `0.18em` | `.hp-spaced` CSS class |
| Eyebrow (homepage) | `0.16em` | `.hp-eyebrow` CSS class |
| Nav group headers | `tracking-widest` | Tailwind class |
| Section labels (app) | `tracking-wide` | Tailwind class |

---

## 5. How to Apply Changes

When you've finalized a color or typography change in this file, follow these steps:

### To change a color value:

1. **App token** → Edit the value in `src/app/globals.css` under `:root` (light) and `[data-theme="dark"]` (dark)
2. **New token** → Also register it in the `@theme inline` block in `src/app/globals.css`
3. **Homepage token** → Edit the value in `.hp` (dark) and `[data-theme="light"] .hp` (light) in `src/app/globals.css`
4. **Color preset** → Edit `COLOR_PRESETS` in `src/context/ThemeContext.tsx`
5. **Verify** → Test both light and dark themes, all 6 color presets

### To change a font:

1. **Inter** → Edit `src/app/layout.tsx`
2. **Fraunces or JetBrains Mono** → Edit `src/components/homepage/HomepageFonts.tsx`
3. **Font stack** → Edit `@theme inline` in `src/app/globals.css`

### To change a type scale value:

1. Update the table above in this file
2. Find and update all components using that font size/weight/line-height
3. There is no centralized type-scale config — it's enforced by convention

---

## 6. Design Decisions Log

> **Document why design choices were made here.** This helps future maintainers understand intent.

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-07 | Initial tokens from project setup | Default palette, not yet customized for The ANTs brand |
| — | — | — |

---

## 7. Rules

| # | Rule |
|---|---|
| 1 | **No hardcoded colors in components.** Always use `var(--token)` or Tailwind `text-primary`. |
| 2 | **Every new token needs light + dark values.** Never add a CSS variable to `:root` without its `[data-theme="dark"]` counterpart. |
| 3 | **Homepage tokens are isolated.** `--hp-*` variables only work inside `.hp` scope. Don't use them in the app. |
| 4 | **Inter is the only body font.** No other sans-serif font in the app. Fraunces is homepage-only. |
| 5 | **Type scale is enforced by convention.** If you change a font size, update this file AND the components that use it. |
| 6 | **Test all 6 color presets.** A color change in the default preset must not break the other 5. |
| 7 | **WCAG 2.1 AA contrast required.** All text must meet 4.5:1 (normal) or 3:1 (large text ≥18px bold). |
