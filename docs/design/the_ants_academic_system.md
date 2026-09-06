---
name: The ANTs Academic System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#554336'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#887364'
  outline-variant: '#dbc2b0'
  surface-tint: '#904d00'
  primary: '#8d4b00'
  on-primary: '#ffffff'
  primary-container: '#b15f00'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb77d'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#ba0035'
  on-tertiary: '#ffffff'
  tertiary-container: '#e21e49'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc3'
  primary-fixed-dim: '#ffb77d'
  on-primary-fixed: '#2f1500'
  on-primary-fixed-variant: '#6e3900'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdada'
  tertiary-fixed-dim: '#ffb3b6'
  on-tertiary-fixed: '#40000c'
  on-tertiary-fixed-variant: '#920028'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  container-max: 1280px
---

## Brand & Style

The brand personality sits at the intersection of rigorous scholarship, communal diligence, and modern educational momentum. Designed for students, researchers, and educators, the UI fosters sustained focus, intellectual clarity, and active achievement without clinical coldness.

The design movement is **Modern Editorial Academic**—a synthesis of high-order minimalism, structured informational hierarchy, and tactile typographic warmth. It rejects academic clutter in favor of crisp architectural layouts, generous whitespace, deliberate structural borders, and warm golden energy that celebrates curiosity and intellectual breakthroughs.

## Colors

The palette is tuned specifically for sustained daytime readability, high legibility, and targeted semantic emphasis:

- **Canvas & Surfaces:**
  - Base canvas: `#f8fafc` (Slate 50)
  - Card & Modal elevations: `#ffffff` (Pure White)
  - Recessed / Inset utility containers: `#f1f5f9` (Slate 100)
- **Structural Outlines:**
  - Subtle divider / container borders: `#e2e8f0` (Slate 200)
  - Interactive / hover borders: `#cbd5e1` (Slate 300)
- **Typography & Core Content:**
  - Primary text: `#0f172a` (Slate 900)
  - Secondary / metadata text: `#475569` (Slate 600)
  - Tertiary / disabled text: `#94a3b8` (Slate 400)
- **Accents & Semantics:**
  - Primary (Scholarship & Energy): `#d97706` (Amber 600) with interactive hover state `#f59e0b` (Amber 500) and soft tint `#fef3c7` (Amber 100)
  - Verified / Mastery / Success: `#059669` (Emerald 600) with surface tint `#ecfdf5` (Emerald 50)
  - Urgent / Deadlines / Timers: `#e11d48` (Rose 600) with surface tint `#fff1f2` (Rose 50)

## Typography

Plus Jakarta Sans governs the entire hierarchy to preserve rhythmic balance and contemporary geometric clarity. 

- Large titles and module headers utilize tight tracking (`-0.02em` to `-0.03em`) and substantial weights (`700`–`800`) to evoke authority and structure.
- Editorial reading paragraphs leverage a baseline 15px/24px or 18px/28px proportion to prevent eye fatigue across long-form academic papers, problem sets, and syllabus reviews.
- `label-caps` is utilized exclusively for metadata tags, course levels, stage badges, and timestamps, always formatted in uppercase.

## Layout & Spacing

The layout model is anchored on an 8pt base grid within a responsive 12-column framework.

- **Breakpoints:**
  - Mobile: `< 640px` (4-column layout, 16px margins, fluid gutters)
  - Tablet: `640px` to `1024px` (8-column layout, 24px margins, 20px gutters)
  - Desktop: `> 1024px` (12-column layout, 32px margins, 24px gutters, max-width `1280px`)
- **Reading Panes & Modules:** Long-form lecture transcripts, academic proofs, and case studies are constrained to a maximum width of `68ch` to preserve comprehension.
- **Rhythm Rules:** Vertical spacing between disparate modules conforms to `space-2xl` (48px) or `space-3xl` (64px). Nested content inside cards and summary panels defaults to `space-md` (16px) or `space-lg` (24px).

## Elevation & Depth

This system avoids heavy drop shadows in favor of a crisp architectural approach based on **low-contrast outlines** paired with **soft, tinted ambient illumination**:

- **Tier 0 (Canvas):** Flat `#f8fafc`.
- **Tier 1 (Resting Card / Module):** `#ffffff` surface, bounded by a 1px solid border in `#e2e8f0`. Elevated subtly by `box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)`.
- **Tier 2 (Interactive Hover / Floating Panels):** `#ffffff` surface, 1px border transitioned to `#cbd5e1`. Elevated by `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.05), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.
- **Tier 3 (Modals / Focus Overlays):** `#ffffff` surface, 1px border `#cbd5e1`, elevated by `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.
- **Inset Wells:** Sub-panels and code snippets use `#f1f5f9` with an inner 1px stroke in `#e2e8f0` and zero drop shadow.

## Shapes

The geometric silhouette is disciplined and structured, employing **Soft** radii (`roundedness: 1`):

- **Inputs, Buttons, and Badges:** `4px` (`0.25rem`) for a precise, scholarly appearance.
- **Cards, Panels, and Modals:** `8px` (`0.5rem`) to maintain structural coherence without roundness encroaching on layout space.
- **Pills / Status Dots:** Fully rounded (`9999px`) reserved strictly for status chips, micro notification badges, and active user avatars.

## Components

### Buttons
- **Primary:** Solid `#d97706` background, `#ffffff` text, 4px corner radius, font weight 600. Hover: `#b45309`. Active: `#92400e`.
- **Secondary:** `#ffffff` background with 1px border `#e2e8f0`, text `#0f172a`. Hover: background `#f8fafc` and border `#cbd5e1`.
- **Destructive / Urgent:** Solid `#e11d48`, text `#ffffff`. Hover: `#be123c`.
- **Ghost:** Transparent background, `#475569` text. Hover: `#f1f5f9` background, `#0f172a` text.

### Chips & Badges
- **Editorial Category:** Background `#f1f5f9`, border `#e2e8f0`, text `#475569`, uppercase `label-caps`.
- **Verified / Success:** Background `#ecfdf5`, 1px border `#a7f3d0`, text `#065f46`.
- **Deadline / Countdown:** Background `#fff1f2`, 1px border `#fecdd3`, text `#9f1239`.
- **Active Filter:** Background `#fef3c7`, border `#fde68a`, text `#92400e`.

### Lists & Data Rows
- Row items use a 1px bottom divider `#e2e8f0` with 12px vertical padding.
- Hover states transition background smoothly to `#f8fafc`.
- Academic indicators (such as problem numbers or lecture sequences) display in fixed-width tabular alignment using `label-caps` in `#94a3b8`.

### Checkboxes & Radio Buttons
- 16px boxes with 3px radii for checkboxes; circular for radios.
- Unchecked: `#ffffff` background with 1px border `#cbd5e1`.
- Checked: `#d97706` fill with crisp white iconography (`#ffffff`).
- Focus rings: 2px offset with 2px spread in `#fde68a`.

### Input Fields & Search Bars
- Background `#ffffff`, 1px solid border `#e2e8f0`, 4px radius, 10px vertical and 14px horizontal padding.
- Placeholder text in `#94a3b8`.
- Focus state transitions border to `#d97706` with a soft box-shadow ring: `0 0 0 3px rgba(217, 119, 6, 0.15)`.

### Cards
- Base surface `#ffffff` enclosed in a 1px border `#e2e8f0`, 8px radius.
- Header sections feature a clean bottom divider `#f1f5f9` separating titles from card bodies.
- Actionable cards implement a translateY(-2px) elevation lift on hover with border darkening to `#cbd5e1`.

### Platform-Specific Modules
- **Academic Progress Bar:** 6px track height in `#f1f5f9`, filled with `#d97706` indicator and smooth ease-out transitions.
- **Verification Seal:** 20px badge utilizing `#059669` icon alongside `#065f46` text on `#ecfdf5` backing for peer-reviewed or verified solutions.
- **Countdown Timer Display:** High-contrast badge with `#e11d48` text and pulsating indicator dot for timed examinations.
