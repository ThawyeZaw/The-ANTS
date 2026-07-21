# The ANTs — Color Palette & Typography

> **This is the primary file for defining what The ANTs looks like.**
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
| Font loading (Quicksand) | `src/app/layout.tsx` |
| Brand font (Queensides) | `src/app/globals.css` — `@font-face` rules + `.font-brand` utility |
| Homepage fonts (Fraunces, JetBrains) | `src/components/homepage/HomepageFonts.tsx` |

---

## 1. App Color Palette

These tokens power the authenticated application (dashboard, flashcards, classrooms, settings, etc.).

### 1.1 Backgrounds

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--background` | `#FFFFFF` | `#1A1B17` | Page body |
| `--background-secondary` | `#E6F4E3` | `#1F211C` | Section containers |
| `--background-card` | `#FFFFFF` | `#252722` | Card surfaces |
| `--background-elevated` | `#FFFFFF` | `#2B2D28` | Modal/dialog surfaces |

### 1.2 Text

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--foreground` | `#2D2E29` | `#F0F0EB` | Primary text |
| `--foreground-secondary` | `#353831` | `#C8C9C3` | Secondary/body text |
| `--foreground-muted` | `#6B6D67` | `#8A8B86` | Placeholder/disabled text |

### 1.3 Borders

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--border` | `#D8DBD0` | `#353731` | Default borders |
| `--border-hover` | `#BFC2B5` | `#4A4C46` | Border hover state |

### 1.4 Primary & Accent

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--primary` | `#3B7DB8` | `#6AADDE` | Buttons, links, focus rings |
| `--primary-hover` | `#5298D3` | `#5298D3` | Button hover state |
| `--primary-light` | `rgba(59,125,184,0.10)` | `rgba(106,173,222,0.12)` | Tinted backgrounds |
| `--primary-foreground` | `#FFFFFF` | `#000000` | Text on primary bg |
| `--accent` | `#28BF7F` | `#28FFBF` | Success indicators, accent |
| `--accent-hover` | `#1FA06A` | `#06FF00` | Accent hover state |
| `--accent-light` | `rgba(40,191,127,0.10)` | `rgba(40,255,191,0.10)` | Accent tint backgrounds |
| `--accent-foreground` | `#FFFFFF` | `#000000` | Text on accent bg |

### 1.5 Semantic Colors

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--success` | `#28BF7F` | `#28FFBF` | Success states |
| `--warning` | `#F2B84B` | `#F2B84B` | Warning/caution |
| `--error` | `#DC3545` | `#F87171` | Error/destructive |
| `--info` | `#3B7DB8` | `#6AADDE` | Info/neutral |

### 1.6 Role Colors

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--role-student` | `#5B6CBF` | `#8B9CFF` | Student badge (Blue-Violet) |
| `--role-teacher` | `#E8853B` | `#FFA560` | Teacher badge (Warm Orange) |
| `--role-contributor` | `#8C00FF` | `#B066FF` | Contributor badge (Purple) |
| `--role-main-contributor` | `#F2B84B` | `#F2B84B` | Main contributor badge (Amber) |

### 1.7 Shadows & Glass

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(45,46,41,0.04)` | `0 1px 2px rgba(0,0,0,0.20)` | Subtle tooltip |
| `--shadow-sm` | `0 2px 8px rgba(45,46,41,0.06)` | `0 2px 8px rgba(0,0,0,0.30)` | Card rest |
| `--shadow-md` | `0 4px 16px rgba(45,46,41,0.08)` | `0 4px 16px rgba(0,0,0,0.40)` | Card hover |
| `--shadow-lg` | `0 8px 32px rgba(45,46,41,0.10)` | `0 8px 32px rgba(0,0,0,0.50)` | Modal/dialog |
| `--shadow-xl` | `0 16px 48px rgba(45,46,41,0.14)` | `0 16px 48px rgba(0,0,0,0.60)` | Highest elevation |
| `--shadow-glow` | `0 0 24px rgba(59,125,184,0.18)` | `0 0 24px rgba(106,173,222,0.25)` | Primary glow |
| `--shadow-hover-sm` | `0 4px 12px rgba(45,46,41,0.10)` | `0 4px 12px rgba(0,0,0,0.40)` | Interactive hover |
| `--shadow-hover-md` | `0 8px 24px rgba(45,46,41,0.14)` | `0 8px 24px rgba(0,0,0,0.50)` | Large interactive hover |
| `--glass-bg` | `rgba(255,255,255,0.75)` | `rgba(26,27,23,0.80)` | Glass bg |
| `--glass-border` | `rgba(45,46,41,0.10)` | `rgba(240,240,235,0.08)` | Glass border |
| `--glass-shadow` | `0 8px 32px rgba(45,46,41,0.08)` | `0 8px 32px rgba(0,0,0,0.35)` | Glass shadow |

### 1.8 Layout Token

| Token | Value | Usage |
|---|---|---|
| `--nav-height` | `4rem` | Navigation bar height |

---

## 2. Homepage Color Palette (`.hp` scope)

These tokens power the public landing page. They are isolated from app tokens.

### 2.1 Dark / Neon Theme (`[data-theme="dark"] .hp`) — Nighttime Study

| Token | Value | Usage |
|---|---|---|
| `--hp-bg` | `#060B14` | Page background (deep indigo-black) |
| `--hp-bg-soft` | `#090E1A` | Section backgrounds |
| `--hp-surface` | `#0C1220` | Card surfaces |
| `--hp-surface-2` | `#111827` | Elevated surfaces |
| `--hp-surface-hover` | `#161E30` | Hover state surfaces |
| `--hp-border` | `rgba(91,158,255,0.08)` | Default borders (blue-tinted) |
| `--hp-border-strong` | `rgba(91,158,255,0.16)` | Strong borders |
| `--hp-ink` | `#E8EDF4` | Primary text |
| `--hp-ink-muted` | `#B0BFD4` | Secondary text |
| `--hp-ink-faint` | `#7A8FA8` | Tertiary text |
| `--hp-brand` | `#5B9EFF` | Soft neon blue (primary accent) |
| `--hp-brand-deep` | `#3B7DD8` | Blue darker variant |
| `--hp-amber` | `#FF7EB3` | Pink accent |
| `--hp-amber-deep` | `#E06095` | Pink darker variant |
| `--hp-violet` | `#B98FFF` | Neon purple secondary accent |
| `--hp-btn-text` | `#060B14` | Text on brand buttons |
| `--hp-cta-text-muted` | `rgba(6,11,20,0.78)` | Muted CTA text |

### 2.2 Light Theme (`.hp` Default) — Warm Paper + Refined Tones

| Token | Value | WCAG on `#FFFDF9` |
|---|---|---|
| `--hp-bg` | `#FFFDF9` | — (background) |
| `--hp-bg-soft` | `#F5F1EA` | — |
| `--hp-surface` | `#FFFFFF` | — |
| `--hp-surface-2` | `#FAF8F4` | — |
| `--hp-surface-hover` | `#F0ECE5` | — |
| `--hp-border` | `rgba(59,108,181,0.10)` | — |
| `--hp-border-strong` | `rgba(59,108,181,0.18)` | — |
| `--hp-ink` | `#1A1C20` | 17.21:1 AAA |
| `--hp-ink-muted` | `#3D4048` | 8.37:1 AAA |
| `--hp-ink-faint` | `#54575E` | 5.87:1 AA |
| `--hp-brand` | `#3B6CB5` | 5.01:1 AA |
| `--hp-brand-deep` | `#2C5282` | 7.56:1 AAA |
| `--hp-amber` | `#D0692B` | 4.50:1 AA |
| `--hp-amber-deep` | `#A84E1F` | 6.97:1 AA |
| `--hp-violet` | `#7847C7` | 7.85:1 AAA |
| `--hp-btn-text` | `#FFFFFF` | — |
| `--hp-cta-text-muted` | `rgba(255,255,255,0.88)` | — |

### 2.3 Neon Glow Effects

| Token | CSS Value | Usage |
|---|---|---|
| `--neon-glow-cyan` | `0 0 4px #5B9EFF, 0 0 8px rgba(91,158,255,0.5), 0 0 14px rgba(91,158,255,0.25)` | Brand glow shadow |
| `--neon-glow-pink` | `0 0 4px #FF7EB3, 0 0 8px rgba(255,126,179,0.5), 0 0 14px rgba(255,126,179,0.25)` | Amber/pink glow shadow |
| `--neon-glow-purple` | `0 0 4px #B98FFF, 0 0 8px rgba(185,143,255,0.4), 0 0 12px rgba(185,143,255,0.20)` | Violet glow shadow |

### 2.4 Homepage Grid Colors

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--hp-grid-color` | `rgba(59,108,181,0.12)` | `rgba(91,158,255,0.09)` | Grid line base |
| `--hp-grid-color-strong` | `rgba(59,108,181,0.20)` | `rgba(91,158,255,0.16)` | Strong grid lines |
| `--hp-grid-color-card` | `rgba(59,108,181,0.08)` | `rgba(91,158,255,0.06)` | Grid on cards |
| `--hp-grid-color-dense` | `rgba(59,108,181,0.17)` | `rgba(91,158,255,0.13)` | Dense grid areas |
| `--hp-grid-color-accent` | `rgba(59,108,181,0.24)` | `rgba(91,158,255,0.20)` | Accent grid lines |

### 2.5 Homepage Layout Tokens

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
| **steel** (default) | `#3B7DB8` | `#6AADDE` | `from-blue-400 to-cyan-300` |
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
| **Queensides** | Brand typeface ("The ANTs" text) | `@font-face` (local TTF/OTF) | `font-brand` class |
| **Quicksand** | Primary body (app + homepage) | `next/font/google` | `--font-quicksand` |
| **Fraunces** | Homepage display headings | Google Fonts (dynamic) | `--hp-font-display` |
| **JetBrains Mono** | Homepage mono text | Google Fonts (dynamic) | `--hp-font-mono` |
| **Geist Mono** | App monospace | Next.js built-in | `--font-geist-mono` |

### 4.2 App Type Scale

Used throughout the authenticated application.

| Level | Font | Font Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| **H1** | Quicksand | 30px | 600 SemiBold | 1.3 | Page titles |
| **H2** | Quicksand | 24px | 600 SemiBold | 1.3 | Section headers |
| **H3** | Quicksand | 18px | 600 SemiBold | 1.3 | Card titles |
| **Body** | Quicksand | 14px | 400 Regular | 1.55 | Paragraphs, descriptions |
| **Body Large** | Quicksand | 16px | 400 Regular | 1.55 | Form labels, prominent text |
| **Caption** | Quicksand | 12px | 400 Regular | 1.4 | Metadata, timestamps |
| **Caption Bold** | Quicksand | 12px | 500 Medium | 1.4 | Countdown labels |
| **Micro** | Quicksand | 10px | 500 Medium | 1.3 | Nav group headers, uppercase |
| **Mono** | Geist Mono | inherit | 600–700 | 1.2 | Countdown digits, code |

### 4.3 Homepage Type Scale

Used only within `.hp` scope on the landing page.

| Level | Font | Font Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| **Hero Heading** | Fraunces | `clamp(2.6rem, 5vw, 3.8rem)` | 560 | 1.08 | Main hero title |
| **Section Heading** | Fraunces | `clamp(1.9rem, 3.4vw, 2.7rem)` | 560 | 1.15 | Section titles |
| **Card Title** | Fraunces | 17–19px | 600 | 1.3 | Bento card titles |
| **Body** | Quicksand | 16–17px | 400 | 1.55 | Hero subtext |
| **Card Description** | Quicksand | 13.5–14px | 400 | 1.55 | Bento card descriptions |
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

1. **Quicksand** → Edit `src/app/layout.tsx`
2. **Queensides (brand font)** → Place font file in `public/fonts/` and edit `@font-face` rules in `src/app/globals.css`
3. **Fraunces or JetBrains Mono** → Edit `src/components/homepage/HomepageFonts.tsx`
4. **Font stack** → Edit `@theme inline` in `src/app/globals.css`

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
| 4 | **Quicksand is the primary body/heading font.** All body text and headings use Quicksand. Queensides is reserved exclusively for "The ANTs" brand text via the `.font-brand` utility class. Fraunces is homepage-only. |
| 5 | **Type scale is enforced by convention.** If you change a font size, update this file AND the components that use it. |
| 6 | **Test all 6 color presets.** A color change in the default preset must not break the other 5. |
| 7 | **WCAG 2.1 AA contrast required.** All text must meet 4.5:1 (normal) or 3:1 (large text ≥18px bold). |
