# 03 — Layout & Responsive Grid

> **Source files:** `src/app/globals.css`, `src/components/homepage/BentoFeatures.tsx`, `src/components/layout/DashboardLayout.tsx`

---

## 1. Breakpoints

### Standard Tailwind v4 Breakpoints

| Breakpoint | Min Width | Typical Usage |
|---|---|---|
| **sm** | 640px | Phones landscape, small tablets |
| **md** | 768px | Tablets, small laptops |
| **lg** | 1024px | Desktop, larger tablets |
| **xl** | 1280px | Large desktop monitors |

### Custom Breakpoints (CSS Media Queries)

| Breakpoint | Width | Where Used | What It Controls |
|---|---|---|---|
| 580px | `max-width: 580px` | BentoFeatures | Grid collapses from 2 → 1 column |
| 640px | `max-width: 640px` | StatsRow, QualTrail | Stats grid 4→2, dividers hide |
| 720px | `max-width: 720px` | HeroVisual | Two-column grid collapses to single |
| 820px | `max-width: 820px` | Homepage Nav | Desktop nav links hide |
| 900px | `max-width: 900px` | RoleLadder, QualTrail | Ladder goes vertical, quals line hides |
| 960px | `max-width: 960px` | BentoFeatures | Grid 4 → 2 column |

### Example Responsive Pattern

```tsx
// Homepage-style responsive grid with inline media queries
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}
     className="bento-features-grid">
  <style>{`
    @media (max-width: 960px) {
      .bento-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 580px) {
      .bento-features-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
    }
  `}</style>
</div>

// App-style responsive grid with Tailwind classes
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

---

## 2. Grid System

### App Grid Patterns

```
12-column implicit grid via Tailwind utilities
```

| Pattern | Tailwind Classes | Usage |
|---|---|---|
| Card grid (3-col) | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` | Deck cards, note cards, classrooms |
| Card grid (4-col) | `grid grid-cols-2 lg:grid-cols-4 gap-4` | Dashboard stat cards |
| Main + Sidebar | `grid grid-cols-1 lg:grid-cols-3 gap-6` | Dashboard layout |
| 2-col | `grid grid-cols-1 sm:grid-cols-2 gap-3` | Related content, form layouts |

### Homepage Bento Grid

```css
/* 4-column dense grid */
grid-template-columns: repeat(4, 1fr);
grid-auto-flow: dense;
gap: 18px;

/* Big cards span 2 columns */
.big-card { grid-column: span 2; }

/* Responsive collapse:
   ≤960px → 2 columns
   ≤580px → 1 column */
```

**Card layout:**
- 2 big cards (col-span-2): Smart Timetable, Flashcard Decks
- 6 standard cards (col-span-1): remaining features

### Code Example — DashboardLayout

```tsx
export default function DashboardLayout({ mainContent, sidebarContent, ... }) {
  return (
    <div className="space-y-6">
      {/* Welcome card (full width) */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-8">
        ...
      </div>

      {/* Stats row (4 → 2 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => <StatCard key={stat.key} {...stat} />)}
      </div>

      {/* Main content + Sidebar (3-col split) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">{mainContent}</div>
        <div className="lg:col-span-1 space-y-6">{sidebarContent}</div>
      </div>
    </div>
  );
}
```

---

## 3. Spacing Scale

| Token | Pixels | REM | Tailwind | Usage |
|---|---|---|---|---|
| `space-1` | 4px | 0.25rem | `gap-1`, `p-1` | Tight icon+text gaps |
| `space-2` | 8px | 0.5rem | `gap-2`, `p-2` | Button groups, compact padding |
| `space-3` | 12px | 0.75rem | `gap-3`, `p-3` | Related content cards |
| `space-4` | 16px | 1rem | `gap-4`, `p-4` | Standard card gap/padding |
| `space-5` | 20px | 1.25rem | `gap-5`, `p-5` | HeroVisual widget padding |
| `space-6` | 24px | 1.5rem | `gap-6`, `p-6` | Major section gaps |
| `space-8` | 32px | 2rem | `gap-8`, `p-8` | Welcome card padding |
| `space-10` | 40px | 2.5rem | `gap-10` | Large section separators |
| `space-12` | 48px | 3rem | `gap-12` | |
| `space-14` | 56px | 3.5rem | `gap-14` | Homepage section gutters |
| `space-16` | 64px | 4rem | `gap-16` | Extra-large separators |

---

## 4. Container Widths

| Context | Max Width | How Applied |
|---|---|---|
| **App NavBar** | 1280px (`max-w-7xl`) | `<div className="mx-auto max-w-7xl">` |
| **Homepage sections** | 1180px (`--hp-maxw`) | `maxWidth: 'var(--hp-maxw)'` |
| **Section headings** | 640px | `maxWidth: 640` on heading container |
| **Hero text** | 620px | `maxWidth: 620` on hero paragraph |
| **Nav dropdown** | 288px (`w-72`) | `className="w-72"` on dropdown container |
| **User menu** | 256px (`w-64`) | `className="w-64"` on user dropdown |
| **Dashboard content** | Full width | Auto within parent layout |

---

## 5. Border Radius Scale

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `radius-sm` | 4px | `rounded` | Focus rings, small pills |
| `radius-md` | 8px | `rounded-lg` | Small elements, badge pills |
| `radius-lg` | 12px | `rounded-xl` | Buttons, inputs, standard cards |
| `radius-xl` | 16px | `rounded-2xl` | Glass cards, modals, NavBar container |
| `radius-full` | 9999px | `rounded-full` | Avatars, pill badges, homepage nav |

### Homepage-Specific Radii

```css
.hp {
  --hp-radius-sm: 10px;   /* Feature icon containers */
  --hp-radius-md: 16px;   /* Card corners, bento tiles */
  --hp-radius-lg: 26px;   /* Browser chrome wrapper */
}
```

---

## 6. Layout Rules

| Rule | Description |
|---|---|
| **Mobile-first** | All Tailwind classes use the mobile-first pattern. `grid-cols-1 md:grid-cols-2` means 1 column default, 2 columns at md+. |
| **Homepage uses inline styles** | Landing page components use inline `style` objects + scoped `<style>` tags for responsive overrides. Do NOT mix Tailwind and inline styles on the homepage. |
| **App uses Tailwind** | Authenticated app components use Tailwind utility classes. Inline styles are acceptable for dynamic values only. |
| **Gap, not margin** | Use `gap-*` on grid/flex parents instead of `margin` on children for spacing between items. |
| **No magic numbers** | All widths, paddings, and gaps must come from the spacing scale above. |
