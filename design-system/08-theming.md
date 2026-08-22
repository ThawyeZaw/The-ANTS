# The ANTs — Theming Architecture

## 1. Single-Scheme Unified Theme

The ANTs uses a single brand-locked Warm Cream + Golden Ochre color scheme derived directly from the logo.

### Principles:
1. **Zero Runtime Theme Switching**: No `ThemeProvider`, `ThemeContext`, or `data-theme` switching logic.
2. **Single Source of Truth**: All design tokens are declared in `:root` inside `src/app/globals.css`.
3. **No `dark:` Utility Classes**: All UI components consume semantic token classes (`bg-background-card`, `text-foreground`, `border-border`, `text-primary`, etc.) without conditional modifiers.
4. **Cohesive Experience**: The public homepage (`.hp`) and the authenticated application share the same warm cream/gold aesthetic.

---

## 2. Token References

### Background Tokens
- `bg-background`: `#FDF9F3`
- `bg-background-secondary`: `#F5F0E6`
- `bg-background-card`: `#FFFCF7`
- `bg-background-elevated`: `#FAF6EE`

### Text & Ink Tokens
- `text-foreground`: `#2A261E`
- `text-foreground-secondary`: `#4A453C`
- `text-foreground-muted`: `#7A7468`

### Brand & Interactive Tokens
- `bg-primary` / `text-primary`: `#C59419`
- `bg-primary-hover`: `#A67D14`
- `text-primary-foreground`: `#FFFFFF`
- `border-border`: `rgba(197, 148, 25, 0.14)`
- `border-border-hover`: `rgba(197, 148, 25, 0.28)`

### Elevation & Glow Tokens
- `--shadow-sm`: `0 2px 8px rgba(42, 38, 30, 0.06)`
- `--shadow-md`: `0 4px 16px rgba(42, 38, 30, 0.08)`
- `--shadow-lg`: `0 8px 32px rgba(42, 38, 30, 0.10)`
- `--shadow-glow`: `0 0 24px rgba(197, 148, 25, 0.20)`
