# 07 — Interaction Flows

> **Applies to:** All interactive elements across the platform
> **Related:** [06-component-library.md](./06-component-library.md), [05-animation-motion.md](./05-animation-motion.md)

---

## 1. Button State Machine

Every button in the system follows this flow:

```
Default → Hover → Active/Pressed → (Loading) → (Disabled)
                                    ↓
                               Focus-visible
```

| State | Visual Change | Duration |
|---|---|---|
| **Default** | Base styles per variant (see Button component) | — |
| **Hover** | Lighter/darker background, shadow increase, border color change | 200ms ease |
| **Active/Pressed** | Implicit from native `<button>` | Instant |
| **Focus-visible** | `outline: 2px solid var(--primary)`, `outline-offset: 2px` | Instant |
| **Loading** | Replace icon/content with `Loader2` spinner, disable interaction | 200ms |
| **Disabled** | `opacity: 0.5`, `cursor: not-allowed`, `pointer-events: none` | Instant |

### Primary Button Example

```tsx
/* Default:  bg-primary text-primary-foreground shadow-md */
/* Hover:    bg-primary-hover shadow-lg */
/* Focus:    outline: 2px solid var(--primary) offset 2px */
/* Loading:  Loader2 spinner */
/* Disabled: opacity-50 cursor-not-allowed pointer-events-none */
```

---

## 2. Input State Machine

```
Default → Hover → Focus → (Error / Success)
                ↓
             Filled (browser-native)
```

| State | Visual |
|---|---|
| **Default** | `border-border`, `bg-background-card`, `text-sm` |
| **Hover** | `border-border-hover` |
| **Focus** | `ring-2 ring-primary/50 border-primary`, `outline: none` |
| **Error** | `border-error`, focus ring becomes `ring-error/50 border-error`, error message below |
| **Filled** | No visual change (handled natively by the browser) |

```tsx
<Input
  label="Email"
  error="Please enter a valid email"
  icon={<Mail className="h-4 w-4" />}
/>
```

---

## 3. Card Hover Behavior

All card-type components share a consistent hover language:

| Card Type | Hover Effect |
|---|---|
| Dashboard stat cards | `-translate-y-0.5` (0.5px lift) + glass shadow |
| **DeckCard** | `border-primary`, `shadow-lg` (elevated shadow), `-translate-y-0.5` |
| **CountdownCard** | `border-primary/30` (subtle border highlight) |
| **Bento feature cards** | `border-color → --hp-border-strong`, `translateY(-4px)`, green glow box-shadow |
| **Explore cards** | Inherits from `.hp` unified hover transition (see animation docs) |
| NavBar dropdown items | `bg-primary/10` (active route) or `bg-background-secondary` (hover) |
| **BackButton** | `border-primary/40`, `shadow-md`, icon `-translate-x-0.5` + color change |

### DeckCard Hover Code

```tsx
<div className="group rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5
  transition-all duration-300
  hover:border-[var(--primary)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5">
```

---

## 4. Dropdown Menu Mechanics

### NavBar Dropdown

```
Closed → Click trigger → Open (animate-slide-down 0.3s)
                         ├── Hover over items
                         ├── Click item → Navigate + Close
                         ├── Click outside → Close
                         └── Re-click trigger → Close
```

| Event | Trigger | Behavior |
|---|---|---|
| **Open** | Click on parent button | `isOpen = true`, chevron rotates 180°, menu slides down |
| **Close** | Click outside (mousedown listener) | `isOpen = false` |
| **Close** | Click on a menu item (route navigation) | `isOpen = false` via `onClose` callback |
| **Close** | Re-click the parent trigger | `isOpen = false` (toggle behavior) |
| **Active state** | Route matches `item.href` | Item gets `bg-primary/10 text-primary` |

```tsx
// Outside click detection
useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      onClose();
    }
  }
  if (isOpen) document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen, onClose]);
```

### User Avatar Menu

Same mechanics as NavBar dropdown:
- Open: Click avatar button
- Close: Click outside, click item, or press Escape
- Menu items: Profile, Settings, About, Sign Out
- Sign Out button: Red text, `hover:bg-error/10`

---

## 5. Theme Toggle Flow

```
Click Sun/Moon button
  → ThemeContext.toggleTheme()
  → setThemeState(prev === 'light' ? 'dark' : 'light')
  → document.documentElement.setAttribute('data-theme', theme)
  → localStorage.setItem('ants-theme', theme)
  → applyColorVars(themeColor, theme) — reapply preset colors
  → All CSS variables swap instantly
  → Body transitions: background-color 0.3s ease, color 0.3s ease
```

---

## 6. NavBar Scroll Hide/Show

```
Scroll down >80px from top:
  isNavHidden = true → header gets '-translate-y-full' class (300ms transition)

Scroll up (any amount):
  isNavHidden = false → header returns to position

Implementation: requestAnimationFrame-scoped scroll listener
```

```tsx
useEffect(() => {
  let lastScrollY = window.scrollY;
  function handleScroll() {
    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY && currentScrollY > 80) {
      setIsNavHidden(true);
    } else {
      setIsNavHidden(false);
    }
    lastScrollY = currentScrollY;
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

## 7. Countdown Timer Lifecycle

```
Component mounts
  → Target timestamp = now + 18 days + 4 hours (frozen in useState)
  → setInterval(tick, 1000ms)
  → Every second:
      diff = Math.max(0, target - now)
      Calculate d, h, m, s
      setCd({ d, h, m, s })
      Render updated digits

When countdown reaches 0:
  → Show static message: "Exam time has passed!" (success color)
  → No more ticking needed (diff = 0, display stays)
```

```tsx
useEffect(() => {
  function tick() {
    let diff = Math.max(0, target.getTime() - new Date().getTime());
    const d = Math.floor(diff / 86_400_000); diff -= d * 86_400_000;
    const h = Math.floor(diff / 3_600_000);  diff -= h * 3_600_000;
    const m = Math.floor(diff / 60_000);      diff -= m * 60_000;
    const s = Math.floor(diff / 1_000);
    setCd({ d: pad(d), h: pad(h), m: pad(m), s: pad(s) });
  }
  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, [target]);
```

---

## 8. Scroll-Triggered Animations

### RevealSection (Homepage)

```
IntersectionObserver threshold: 12%
  → Element enters viewport → add class "hp-visible"
  → CSS transition: opacity 0→1, blur 6px→0, translateY 18px→0, scale 0.96→1
  → Element leaves viewport → remove class "hp-visible"
  → CSS transition (faster): 0.35s ease-in, blur 0→4px
```

### AnimatedStat (Homepage)

```
IntersectionObserver threshold: 30%
  → Triggers ONCE (gated by hasAnimated state)
  → 1200ms easeOutCubic count-up via requestAnimationFrame
  → 60fps smooth animation
```

---

## 9. Flip Card (Homepage Demo)

```
Click on card
  → setFlipped(f => !f)
  → Add/remove "flipped" class
  → CSS: transform: rotateY(180deg) on .hp-flip-inner (0.6s transition)
  → Front face (backface-visibility: hidden) → Back face visible
```

---

## 10. Navigation (BackButton)

```
Click BackButton
  → Check window.history.length > 1
  → Yes: router.back()
  → No:  router.push(fallbackHref)
  → Default fallback: '/dashboard'
```

---

## 11. Recently Visited Pages

```
On every route change (except /dashboard and /):
  → Check if pathname is a valid NavBar item
  → Read existing recentPages from localStorage
  → Add current path with timestamp to front
  → Remove duplicates
  → Keep max 5 entries
  → Write back to localStorage
```

---

## 12. Interaction Rules

| Rule | Description |
|---|---|
| **Transitions under 300ms** | No user-triggered UI transition should exceed 300ms. |
| **Always show loading** | Any async action >100ms must show a loading state (spinner, skeleton, disabled button). |
| **Click-outside closes** | All dropdowns, menus, and modals must close on outside click. |
| **Keyboard parity** | Every mouse interaction must have a keyboard equivalent (Enter/Space for click, Escape for close, Tab for navigate). |
| **No layout shift** | Hover effects must not cause layout shift. Use `transform` (GPU-composited) not `margin` or `padding` changes. |
