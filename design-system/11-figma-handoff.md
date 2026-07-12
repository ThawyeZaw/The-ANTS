# 11 — Figma Handoff Specification

> **Purpose:** Map all design tokens to Figma styles for pixel-perfect designer ↔ developer handoff.

---

## 1. Color Style Mapping (App Tokens)

Create these as Figma Color Styles:

| Figma Style Name | CSS Variable | Light Hex | Dark Hex |
|---|---|---|---|
| `background/default` | `--background` | `#FAFBFC` | `#141923` |
| `background/secondary` | `--background-secondary` | `#F1F3F5` | `#1C2333` |
| `background/card` | `--background-card` | `#FFFFFF` | `#232D3F` |
| `background/elevated` | `--background-elevated` | `#FFFFFF` | `#2A3450` |
| `text/primary` | `--foreground` | `#0F172A` | `#F1F5F9` |
| `text/secondary` | `--foreground-secondary` | `#475569` | `#94A3B8` |
| `text/muted` | `--foreground-muted` | `#94A3B8` | `#718096` |
| `border/default` | `--border` | `#E2E8F0` | `#2E3D55` |
| `border/hover` | `--border-hover` | `#CBD5E1` | `#3D5070` |
| `primary/default` | `--primary` | `#6366F1` | `#818CF8` |
| `primary/hover` | `--primary-hover` | `#4F46E5` | `#6366F1` |
| `primary/light` | `--primary-light` | `#E0E7FF` | `rgba(99,102,241,0.15)` |
| `accent/default` | `--accent` | `#10B981` | `#34D399` |
| `accent/hover` | `--accent-hover` | `#059669` | `#10B981` |
| `accent/light` | `--accent-light` | `#D1FAE5` | `rgba(16,185,129,0.15)` |
| `semantic/success` | `--success` | `#22C55E` | `#4ADE80` |
| `semantic/warning` | `--warning` | `#F59E0B` | `#FBBF24` |
| `semantic/error` | `--error` | `#EF4444` | `#F87171` |
| `semantic/info` | `--info` | `#3B82F6` | `#60A5FA` |
| `role/student` | `--role-student` | `#3B82F6` | `#60A5FA` |
| `role/teacher` | `--role-teacher` | `#10B981` | `#34D399` |
| `role/contributor` | `--role-contributor` | `#8B5CF6` | `#A78BFA` |
| `role/main-contributor` | `--role-main-contributor` | `#F59E0B` | `#FBBF24` |

---

## 2. Typography Style Mapping

Create these as Figma Text Styles:

| Style Name | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| `heading/h1` | Inter | 30px | Bold (700) | 36px (1.2) | 0 |
| `heading/h2` | Inter | 24px | SemiBold (600) | 31px (1.3) | 0 |
| `heading/h3` | Inter | 18px | SemiBold (600) | 25px (1.4) | 0 |
| `body/default` | Inter | 14px | Regular (400) | 22px (1.6) | 0 |
| `body/large` | Inter | 16px | Regular (400) | 26px (1.65) | 0 |
| `caption/default` | Inter | 12px | Regular (400) | 17px (1.4) | 0 |
| `caption/bold` | Inter | 12px | Medium (500) | 17px (1.4) | 0 |
| `micro/uppercase` | Inter | 10px | Medium (500) | 13px (1.3) | 0.1em |
| `mono/countdown` | Geist Mono | 30px | Bold (700) | 36px (1.2) | 0 |
| `homepage/hero` | Fraunces | 48px (clamp) | 560 | 52px (1.08) | -0.01em |
| `homepage/section` | Fraunces | 36px (clamp) | 560 | 41px (1.15) | -0.01em |
| `homepage/eyebrow` | JetBrains Mono | 11px | SemiBold (600) | 14px (1.3) | 0.16em |

---

## 3. Effect Style Mapping

Create these as Figma Effect Styles:

| Style Name | Value |
|---|---|
| `shadow/sm` | Drop shadow: `0px 1px 2px rgba(0,0,0,0.05)` |
| `shadow/md` | Drop shadow: `0px 4px 12px rgba(0,0,0,0.08)` |
| `shadow/lg` | Drop shadow: `0px 8px 24px rgba(0,0,0,0.12)` |
| `shadow/glow-indigo` | Drop shadow: `0px 0px 20px rgba(99,102,241,0.15)` |
| `glass/background` | Background blur: 16px. Background: `rgba(255,255,255,0.7)` |

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
