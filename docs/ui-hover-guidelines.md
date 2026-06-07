# Button & Hover Interaction Guidelines

## Rule: Always Use CSS hover, Not JS Mouse Events

Use Tailwind `hover:` classes — **never** `onMouseEnter` / `onMouseLeave` in React.

```tsx
// ✅ Correct
<button className="bg-accent hover:opacity-90 transition-opacity">
  Buy Now
</button>

// ❌ Wrong
<button onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
  Buy Now
</button>
```

---

## Why

| Reason | Detail |
|--------|--------|
| Mobile | Touch screens have no hover state — JS mouse events never fire |
| Performance | CSS is GPU-accelerated; JS re-renders are not |
| Accessibility | Screen readers and keyboard navigation handle CSS hover correctly |
| Simplicity | No state, no cleanup, no bugs |

---

## Standard Hover Effects by Element Type

### Primary Button (accent)
```tsx
className="bg-accent text-black font-bold hover:opacity-90 transition-opacity"
```
Effect: **opacity fade** — keeps the color, slightly dims

### Secondary / Outline Button
```tsx
className="border border-border text-gray-400 hover:text-white hover:border-accent transition-colors"
```
Effect: **border + text color change**

### Ghost / Icon Button
```tsx
className="text-gray-500 hover:text-white hover:bg-background transition-colors rounded-xl p-2"
```
Effect: **text + background fill**

### Destructive Button (delete, cancel)
```tsx
className="border border-red-700/50 text-red-400 hover:bg-red-900/20 transition-colors"
```
Effect: **background tint** — never full red (too aggressive)

### Card / Link Card
```tsx
className="border border-border hover:border-accent transition-all group"
```
Effect: **border accent** + use `group-hover:` on children

---

## Always Add `transition-*`

Every element with a `hover:` class **must** have a `transition-*` class.

| Changing | Transition class |
|----------|-----------------|
| colors, border, text | `transition-colors` |
| opacity | `transition-opacity` |
| transform (scale, translate) | `transition-transform` |
| multiple / unknown | `transition-all duration-200` |

---

## Group Hover (parent → child effects)

When hovering a card should change something inside it:

```tsx
// Parent has `group`
<Link href="..." className="group border border-border hover:border-accent ...">
  <img className="group-hover:scale-105 transition-transform duration-300" />
  <p className="text-gray-400 group-hover:text-accent transition-colors">Title</p>
</Link>
```

---

## Do NOT Hover On

| Element | Reason |
|---------|--------|
| `<a>` / `<Link>` that looks like plain text | Underline is enough |
| Disabled buttons | Already has `disabled:opacity-50`, hover would be confusing |
| Static labels / badges | Not interactive, hover implies clickable |
| Loading spinners | User can't interact |

```tsx
// Disabled — no hover needed, opacity handles it
<button disabled className="bg-accent opacity-50 cursor-not-allowed">
  Loading...
</button>
```

---

## Mobile Consideration

Hover effects are **decoration only** — never put essential information behind hover.

```tsx
// ❌ Bad — mobile users can't see tooltip on hover
<button className="hover:tooltip">?</button>

// ✅ Good — show info inline or in a visible label
<p className="text-gray-500 text-xs">Platform fee: 5%</p>
```

---

## Quick Reference

```
Primary CTA     → hover:opacity-90 transition-opacity
Outline/Ghost   → hover:text-white hover:border-accent transition-colors
Icon button     → hover:text-white hover:bg-background transition-colors
Card            → hover:border-accent transition-all + group-hover: children
Danger          → hover:bg-red-900/20 transition-colors
Image in card   → group-hover:scale-105 transition-transform duration-300
```
