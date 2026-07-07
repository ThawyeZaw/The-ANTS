# 08 — Theming Architecture

> **Source:** `src/context/ThemeContext.tsx`, `src/app/globals.css`
> **Storage keys:** `ants-theme`, `ants-theme-color`

---

## 1. Two-Layer CSS Variable Strategy

```
Layer 1 — App Tokens (:root / [data-theme="dark"])
  ├── --background, --foreground, --primary, --accent, etc.
  ├── Registered in Tailwind v4 via @theme inline
  └── Available as Tailwind classes: bg-background, text-primary, etc.

Layer 2 — Homepage Tokens (.hp / [data-theme="light"] .hp / [data-theme="dark"] .hp)
  ├── --hp-* variables (COMPLETELY ISOLATED from app tokens)
  ├── NOT registered in Tailwind
  └── Used via inline style objects and CSS classes
```

**Why two layers?** The homepage uses a dramatically different palette (darker, higher-contrast) than the authenticated app. Mixing them in one namespace would cause conflicts.

---

## 2. Theme Application Flow

```
1. App Mount
   └── ThemeProvider useEffect fires

2. Read Preferences
   ├── localStorage.getItem('ants-theme') → 'light' | 'dark'
   ├── localStorage.getItem('ants-theme-color') → 'indigo' | ...
   └── window.matchMedia('(prefers-color-scheme: dark)') → fallback

3. Apply to DOM
   ├── document.documentElement.setAttribute('data-theme', theme)
   └── applyColorVars(themeColor, theme)
       └── Sets --primary, --primary-hover, --primary-light,
           --accent, --accent-hover, --accent-light, --shadow-glow
           via element.style.setProperty()

4. CSS Cascade Takes Effect
   ├── :root or [data-theme="dark"] selects correct variable values
   ├── .hp or [data-theme="light"] .hp selects homepage values
   └── Body transitions: background-color 0.3s ease, color 0.3s ease
```

---

## 3. ThemeContext API

```tsx
// src/context/ThemeContext.tsx

import { ThemeProvider, useTheme } from '@/context/ThemeContext';

// Provider wraps the entire app
<ThemeProvider>
  <App />
</ThemeProvider>

// useTheme hook
const { theme, toggleTheme, setTheme, themeColor, setThemeColor } = useTheme();
```

| Property | Type | Description |
|---|---|---|
| `theme` | `'light' \| 'dark'` | Current theme mode |
| `toggleTheme()` | `() => void` | Toggle light ↔ dark |
| `setTheme(t)` | `(t: Theme) => void` | Set specific theme |
| `themeColor` | `ThemeColor` | Current color preset |
| `setThemeColor(c)` | `(c: ThemeColor) => void` | Change color preset |

---

## 4. Color Preset System

6 interchangeable color schemes:

```tsx
type ThemeColor = 'indigo' | 'emerald' | 'sky' | 'rose' | 'amber' | 'teal';
```

Each preset defines:
- Primary color (light + dark)
- Primary hover (light + dark)
- Primary tint (light + dark)
- Accent color (light + dark)
- Accent hover (light + dark)
- Accent tint (light + dark)
- Glow shadow (light + dark)
- Gradient (for welcome cards)

### How to Add a New Preset

1. Add entry to `COLOR_PRESETS` in `src/context/ThemeContext.tsx`
2. Define `light` and `dark` values for all 7 properties
3. Add `label` (display name) and `gradient` (Tailwind gradient)
4. Add the new value to the `ThemeColor` type union

```tsx
// Example: Adding "coral" preset
coral: {
  label: 'Coral',
  gradient: 'from-coral-500 to-pink-400',
  values: {
    light: {
      primary: '#...', primaryHover: '#...', primaryLight: '#...',
      accent: '#...', accentHover: '#...', accentLight: '#...',
      shadowGlow: '0 0 20px rgba(..., 0.15)',
    },
    dark: {
      primary: '#...', primaryHover: '#...', primaryLight: '...',
      accent: '#...', accentHover: '#...', accentLight: '...',
      shadowGlow: '0 0 20px rgba(..., 0.2)',
    },
  },
},
```

---

## 5. Theme Toggle Implementation

```tsx
// Simplified toggle button
<button
  onClick={toggleTheme}
  className="p-2 rounded-lg hover:bg-background-secondary transition-all duration-200"
  aria-label="Toggle theme"
>
  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
</button>
```

**What happens on click:**
1. `toggleTheme()` fires
2. `setThemeState(prev => prev === 'light' ? 'dark' : 'light')`
3. useEffect re-fires → applies `data-theme` attribute + localStorage write + color vars

---

## 6. Theme Persistence

| Key | Type | Default | Set When |
|---|---|---|---|
| `ants-theme` | `'light' \| 'dark'` | System preference → `'light'` | Theme toggle |
| `ants-theme-color` | `ThemeColor` | `'indigo'` | Color preset change |

Both are read on mount, written on change.

---

## 7. How to Use Themes in a Component

### App Component (Tailwind)

```tsx
function MyCard() {
  // Option 1: Tailwind classes (auto-respond to data-theme)
  return (
    <div className="bg-background-card border border-border rounded-xl p-4">
      <h3 className="text-foreground font-semibold">Title</h3>
      <p className="text-foreground-secondary text-sm">Description</p>
    </div>
  );
}
```

### App Component (Inline Styles)

```tsx
function MyCard() {
  return (
    <div style={{
      background: 'var(--background-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
    }}>
      ...
    </div>
  );
}
```

### Homepage Component

```tsx
function HeroSection() {
  return (
    <section className="hp">  {/* Required: scopes hp variables */}
      <div style={{
        background: 'var(--hp-surface)',
        border: '1px solid var(--hp-border)',
        borderRadius: 'var(--hp-radius-md)',
        color: 'var(--hp-ink)',
        fontFamily: 'var(--hp-font-body)',
      }}>
        Content
      </div>
    </section>
  );
}
```

### Testing Theme Changes

```tsx
// Simulate light mode
document.documentElement.setAttribute('data-theme', 'light');

// Simulate dark mode
document.documentElement.setAttribute('data-theme', 'dark');

// Change color preset
localStorage.setItem('ants-theme-color', 'emerald');
// Reload page
```

---

## 8. Theming Rules

| Rule | Description |
|---|---|
| **No direct data-theme manipulation** | Always use `useTheme()` or `toggleTheme()`. Never set `data-theme` manually. |
| **Test both themes** | Every PR must include screenshots in light and dark mode. |
| **Homepage isolation** | Do NOT use `--hp-*` variables in app components. Do NOT use app tokens in homepage components. |
| **Color preset awareness** | Components using `var(--primary)` automatically work with all 6 presets. No extra work needed. |
| **New variable = both themes** | Every CSS variable added to `:root` must have a corresponding `[data-theme="dark"]` value. |
