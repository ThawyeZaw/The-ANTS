# 11 — Figma Handoff Specification

> **Purpose:** Map all design tokens to Figma styles for pixel-perfect designer ↔ developer handoff.

---

## 1. Color Style Mapping (App Tokens)

Create these as Figma Color Styles:

| Figma Style Name | CSS Variable | Light Hex | Dark Hex |
|---|---|---|---|
| `background/default` | `--background` | `#FFFFFF` | `#1A1B17` |
| `background/secondary` | `--background-secondary` | `#E6F4E3` | `#1F211C` |
| `background/card` | `--background-card` | `#FFFFFF` | `#252722` |
| `background/elevated` | `--background-elevated` | `#FFFFFF` | `#2B2D28` |
| `text/primary` | `--foreground` | `#2D2E29` | `#F0F0EB` |
| `text/secondary` | `--foreground-secondary` | `#353831` | `#C8C9C3` |
| `text/muted` | `--foreground-muted` | `#6B6D67` | `#8A8B86` |
| `border/default` | `--border` | `#D8DBD0` | `#353731` |
| `border/hover` | `--border-hover` | `#BFC2B5` | `#4A4C46` |
| `primary/default` | `--primary` | `#3B7DB8` | `#6AADDE` |
| `primary/hover` | `--primary-hover` | `#5298D3` | `#5298D3` |
| `primary/light` | `--primary-light` | `rgba(59,125,184,0.10)` | `rgba(106,173,222,0.12)` |
| `accent/default` | `--accent` | `#28BF7F` | `#28FFBF` |
| `accent/hover` | `--accent-hover` | `#1FA06A` | `#06FF00` |
| `accent/light` | `--accent-light` | `rgba(40,191,127,0.10)` | `rgba(40,255,191,0.10)` |
| `semantic/success` | `--success` | `#28BF7F` | `#28FFBF` |
| `semantic/warning` | `--warning` | `#F2B84B` | `#F2B84B` |
| `semantic/error` | `--error` | `#DC3545` | `#F87171` |
| `semantic/info` | `--info` | `#3B7DB8` | `#6AADDE` |
| `role/student` | `--role-student` | `#5B6CBF` | `#8B9CFF` |
| `role/teacher` | `--role-teacher` | `#E8853B` | `#FFA560` |
| `role/contributor` | `--role-contributor` | `#8C00FF` | `#B066FF` |
| `role/main-contributor` | `--role-main-contributor` | `#F2B84B` | `#F2B84B` |

---

## 2. Typography Style Mapping

Create these as Figma Text Styles:

| Style Name | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| `heading/h1` | Quicksand | 30px | Bold (700) | 36px (1.2) | 0 |
| `heading/h2` | Quicksand | 24px | SemiBold (600) | 31px (1.3) | 0 |
| `heading/h3` | Quicksand | 18px | SemiBold (600) | 25px (1.4) | 0 |
| `body/default` | Quicksand | 14px | Regular (400) | 22px (1.6) | 0 |
| `body/large` | Quicksand | 16px | Regular (400) | 26px (1.65) | 0 |
| `caption/default` | Quicksand | 12px | Regular (400) | 17px (1.4) | 0 |
| `caption/bold` | Quicksand | 12px | Medium (500) | 17px (1.4) | 0 |
| `micro/uppercase` | Quicksand | 10px | Medium (500) | 13px (1.3) | 0.1em |
| `mono/countdown` | Geist Mono | 30px | Bold (700) | 36px (1.2) | 0 |
| `homepage/hero` | Fraunces | 48px (clamp) | 560 | 52px (1.08) | -0.01em |
| `homepage/section` | Fraunces | 36px (clamp) | 560 | 41px (1.15) | -0.01em |
| `homepage/eyebrow` | JetBrains Mono | 11px | SemiBold (600) | 14px (1.3) | 0.16em |

---

## 3. Effect Style Mapping

Create these as Figma Effect Styles:

| Style Name | Value |
|---|---|
| `shadow/sm` | Drop shadow: `0px 2px 8px rgba(45,46,41,0.06)` |
| `shadow/md` | Drop shadow: `0px 4px 16px rgba(45,46,41,0.08)` |
| `shadow/lg` | Drop shadow: `0px 8px 32px rgba(45,46,41,0.10)` |
| `shadow/glow-primary` | Drop shadow: `0px 0px 24px rgba(59,125,184,0.18)` |
| `glass/background` | Background blur: 16px. Background: `rgba(255,255,255,0.75)` |

---

## 4. Spacing Scale

| Token | REM | Pixels |
|---|---|---|
| `space-1` | 0.25rem | 4px |
| `space-2` | 0.5rem | 8px |
| `space-3` | 0.75rem | 12px |
| `space-4` | 1rem | 16px |
| `space-5` | 1.25rem | 20px |
| `space-6` | 1.5rem | 24px |
| `space-8` | 2rem | 32px |
| `space-10` | 2.5rem | 40px |
| `space-12` | 3rem | 48px |
| `space-14` | 3.5rem | 56px |
| `space-16` | 4rem | 64px |

---

## 5. Border Radius Scale

| Token | Pixels | Tailwind |
|---|---|---|
| `radius-sm` | 4px | `rounded` |
| `radius-md` | 8px | `rounded-lg` |
| `radius-lg` | 12px | `rounded-xl` |
| `radius-xl` | 16px | `rounded-2xl` |
| `radius-full` | 9999px | `rounded-full` |

---

## 6. Figma Component Structure

```
📁 The ANTs Design System
├── 🎨 Tokens
│   ├── Colors (Light)
│   ├── Colors (Dark)
│   ├── Typography
│   ├── Effects (Shadows + Glass)
│   └── Spacing & Radius
├── 🧩 Core Components
│   ├── Button
│   │   ├── Primary (sm / md / lg × default / hover / focus / loading / disabled)
│   │   ├── Secondary
│   │   ├── Ghost
│   │   ├── Danger
│   │   └── Outline
│   ├── Input
│   │   ├── Default
│   │   ├── Focus
│   │   ├── Error
│   │   ├── With Left Icon
│   │   └── With Right Icon
│   ├── Badge
│   │   ├── Default
│   │   ├── Role: Student / Teacher / Contributor / Main Contributor
│   │   └── Semantic: Success / Warning / Error
│   ├── BackButton
│   └── Avatar
│       ├── Preset (sm / md / lg / xl)
│       ├── Image Upload
│       └── Initials Fallback
├── 🧩 Layout
│   ├── NavBar
│   │   ├── Default (Desktop)
│   │   ├── Dropdown Open
│   │   ├── User Menu Open
│   │   ├── Mobile
│   │   └── Light / Dark
│   ├── DashboardLayout
│   │   ├── Student View
│   │   ├── Teacher View
│   │   ├── Contributor View
│   │   └── Admin View
│   └── GlassCard
├── 🧩 Feature Components
│   ├── CountdownCard
│   │   ├── Active (high / medium / low priority)
│   │   └── Past (exam passed)
│   ├── DeckCard
│   │   ├── Default
│   │   ├── Hover
│   │   ├── Owned (with edit/delete)
│   │   └── Library (with clone)
│   ├── StudySession
│   │   ├── Card Front
│   │   ├── Card Back (flipped)
│   │   └── Session Summary
│   ├── Timetable (Week / Day / Month)
│   └── ClassroomCard / ClubCard
├── 🏠 Homepage
│   ├── Hero Section
│   ├── BentoFeatures Grid
│   │   ├── Desktop (4-col)
│   │   ├── Tablet (2-col)
│   │   └── Mobile (1-col)
│   ├── StatsRow
│   ├── QualTrail
│   ├── RoleLadder
│   └── HeroVisual
├── 📱 Auth
│   ├── Login
│   ├── Signup
│   └── Forgot Password
└── ⚠️ Empty / Error / Loading
    ├── Empty State (no results)
    ├── Error State
    └── Loading Skeleton
```

---

## 7. Breakpoints for Figma Frames

| Frame Name | Width | Simulates |
|---|---|---|
| Desktop | 1440px | >1280px (xl) |
| Laptop | 1024px | 1024px (lg) |
| Tablet | 768px | 768px (md) |
| Mobile Large | 390px | <640px (sm) |
| Mobile Small | 320px | Minimum supported |

---

## 8. Handoff Checklist

- [ ] All color styles created with light + dark variants
- [ ] All text styles created
- [ ] All effect styles (shadows + glass) created
- [ ] Component variants use Figma component properties (not separate components)
- [ ] Auto layout enabled on all components
- [ ] Responsive frames for each breakpoint
- [ ] Components named to match code (`Button/Primary/Md` → `<Button variant="primary" size="md">`)
- [ ] Design tokens doc linked in Figma file description
