# 05 — Animation & Motion

> **Source file:** `src/app/globals.css`, Lines 194–538
> **Homepage easing:** `src/app/globals.css`, Lines 450–456

---

## 1. Easing Curves

### App-Wide (inherited from Tailwind defaults)

All app UI transitions use CSS `ease` (the browser default). The app does not define custom easing for interactive elements.

### Homepage — Apple-Like Easing Curves

```css
:root .hp {
  --hp-ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1);      /* Deceleration — use for entrances */
  --hp-ease-in:     cubic-bezier(0.4, 0.0, 1, 1);         /* Acceleration — use for exits */
  --hp-ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);       /* Smooth — use for both */
  --hp-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);    /* Bouncy overshoot — sparingly */
  --hp-ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);     /* Very smooth — subtle motions */
}
```

---

## 2. Keyframe Animations

### Built-in CSS Keyframes

All defined in `src/app/globals.css`.

#### fadeIn
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
/* Duration: 0.5s ease-out */
/* Usage: .animate-fade-in */
```

#### fadeInUp
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Duration: 0.6s ease-out */
/* Usage: .animate-fade-in-up */
```

#### slideDown
```css
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Duration: 0.3s ease-out */
/* Usage: .animate-slide-down — dropdown menus, mobile nav */
```

#### float
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
/* Duration: 3s ease-in-out infinite */
/* Usage: .animate-float — decorative elements */
```

#### glow
```css
@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.15); }
  50%      { box-shadow: 0 0 30px rgba(99, 102, 241, 0.3); }
}
/* Duration: 2s ease-in-out infinite */
/* Usage: .animate-glow — NavBar container */
```

#### shimmer
```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
/* Duration: 1.5s infinite */
/* Usage: .animate-shimmer — skeleton loading states */
```

#### pulse-soft
```css
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.7; }
}
/* Duration: 2s ease-in-out infinite */
/* Usage: .animate-pulse-soft — subtle indicators */
```

#### spin-slow
```css
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
/* Duration: linear infinite */
/* Usage: Loader2 spinner in Button component */
```

#### Homepage Gradient Animations

```css
/* Float motion for gradient text */
@keyframes hp-float-grad {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
/* Duration: 3s ease-in-out infinite */

/* Background position shift for gradient sheen */
@keyframes hp-shimmer-grad {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
/* Duration: 4s ease-in-out infinite */
/* Both applied to .hp-grad class */
```

---

## 3. Scroll Reveal System (Homepage Only)

The `.hp-reveal` system creates Apple-style blur + scale entrance animations using IntersectionObserver.

### States

```css
/* Hidden (default) */
.hp-reveal {
  opacity: 0;
  transform: translateY(18px) scale(0.96);
  filter: blur(6px);
  transition: opacity 0.7s var(--hp-ease-out),
              transform 0.7s var(--hp-ease-out),
              filter 0.7s var(--hp-ease-out);
  transition-delay: var(--hp-delay, 0ms);
}

/* Visible (when .hp-visible is added by IntersectionObserver) */
.hp-reveal.hp-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

/* Exit (when scrolling away) — faster for snappy feel */
.hp-reveal:not(.hp-visible) {
  transition-duration: 0.35s;
  transition-timing-function: var(--hp-ease-in);
  transition-delay: 0ms;
  filter: blur(4px);
}
```

### Card Variant (Stronger Effect)

```css
.hp-reveal-card {
  opacity: 0;
  transform: translateY(24px) scale(0.94);
  filter: blur(8px);
  transition: opacity 0.8s var(--hp-ease-out),
              transform 0.8s var(--hp-ease-out),
              filter 0.8s var(--hp-ease-out);
}
```

### Stagger Cascade

```css
/* Each child staggers by 80ms × index */
.hp-stagger > .hp-reveal {
  transition-delay: calc(var(--hp-stagger-index, 0) * 80ms);
}

.hp-stagger.hp-visible > .hp-reveal {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}
```

### Usage in React

```tsx
import RevealSection from '@/components/homepage/RevealSection';

// Single element with delay
<RevealSection delayMs={200}>
  <h2>Hello</h2>
</RevealSection>

// Staggered children (each child must have class "hp-reveal")
<RevealSection stagger>
  <div className="hp-reveal">Item 1</div>
  <div className="hp-reveal">Item 2</div>
  <div className="hp-reveal">Item 3</div>
</RevealSection>
```

---

## 4. Interactive Transition Durations

| Element | Transition Property | Duration | Easing |
|---|---|---|---|
| **Buttons (app)** | `all` | `200ms` | `ease` (browser default) |
| **NavBar links/buttons** | `all` | `200ms` | `ease` |
| **NavBar scroll hide/show** | `transform` | `300ms` | `ease` |
| **Cards (hover lift)** | `transform, box-shadow, border-color` | `300ms` | `ease-out` |
| **Theme toggle** | `background-color, color` | `300ms` | `ease` (on body) |
| **Bento cards (hover)** | `border-color, transform, box-shadow` | `300ms` | `var(--hp-ease-out)` |
| **Homepage nav/buttons** | `all` | `300ms` | `var(--hp-ease-out)` |
| **Dropdown menus** | `opacity, transform` | `300ms` | `ease-out` (via animate-slide-down) |
| **Homepage unified hover** | `all` | `300ms` | `var(--hp-ease-out)` |

### Code Example — App Card Hover

```tsx
// DeckCard hover pattern
<div className="group rounded-2xl border border-border bg-background-card
  transition-all duration-300
  hover:border-primary hover:shadow-lg hover:-translate-y-0.5">
```

### Code Example — Homepage Card Hover

```tsx
// Bento card hover (uses CSS class for specificity)
<style>{`
  .bento-card {
    transition: border-color 0.3s var(--hp-ease-out),
                transform 0.3s var(--hp-ease-out),
                box-shadow 0.3s var(--hp-ease-out);
  }
  .bento-card:hover {
    border-color: var(--hp-border-strong) !important;
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -12px rgba(60, 219, 167, 0.18);
  }
`}</style>
```

---

## 5. Reduced Motion

All animations respect the user's system preference:

```css
@media (prefers-reduced-motion: reduce) {
  .hp-reveal,
  .hp-reveal-card {
    opacity: 1;
    transform: none;
    filter: none;
    transition: none;
  }

  .hp-stagger > .hp-reveal {
    transition-delay: 0ms;
  }

  .hp .animate-float,
  .hp .hp-grad {
    animation: none;
  }

  .hp-flip-inner {
    transition: none;
  }
}
```

### Developer Checklist

- [ ] All new animations have a `prefers-reduced-motion` fallback
- [ ] Animations use `transform` and `opacity` (GPU-composited) — never animate `width`, `height`, `top`, `left`
- [ ] No animation exceeds 800ms for user-triggered interactions
- [ ] Infinite animations (float, glow, shimmer) are used sparingly and only for decoration
