# Dinoyor — Claude Project Rules

You are working on **Dinoyor**, a P2P in-game item marketplace built with Next.js App Router, Tailwind CSS, and Supabase. Follow these rules strictly when writing any UI code.

---

## Tech Stack
- Next.js 14+ (App Router, Server Components by default)
- Tailwind CSS with custom tokens: `bg-background`, `bg-surface`, `border-border`, `text-accent`
- Supabase (auth, database, storage)
- TypeScript strict mode

---

## Layout Rules
- Max content width: `max-w-7xl mx-auto px-4`
- Account/settings pages: sidebar + main content layout
  - Use `flex flex-col lg:flex-row gap-6`
  - Sidebar: `lg:w-64 shrink-0`, sticky at `lg:top-24`
  - Sidebar contains: user card (avatar + name) + nav links with icons
  - Active nav: `text-white bg-white/[0.03] border-l-2 border-accent` + accent icon
  - Inactive nav: `text-gray-400 hover:text-white hover:bg-white/[0.02] border-l-2 border-transparent`
- Detail pages (e.g. order): two-column on lg (info left `flex-1`, secondary panel right `lg:w-[380px]` sticky)
- Single column stacking on mobile

---

## Cards & Containers
- All cards: `rounded-2xl border border-border bg-surface`
- Section headers inside cards: `px-4 py-3 border-b border-border` with uppercase tracking-wide label OR semibold title
- Card body: `px-4 py-4`
- **Never** use `rounded-xl` for containers — only `rounded-2xl` for cards, `rounded-lg` for inputs/buttons/thumbnails

---

## Buttons
- Primary: `px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-bold hover:opacity-90`
- Secondary: `border border-border text-gray-400 hover:text-white hover:border-accent/50`
- **Never** use `rounded-full` for action buttons — use `rounded-lg`
- Keep buttons compact — no full-width unless it's a form submit on auth pages
- No `py-3` on buttons outside of auth

---

## Inputs
```
w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent transition-colors
```

---

## Selects
```
w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm appearance-none pr-8 focus:outline-none focus:border-accent transition-colors
```
- Always `appearance-none` to remove browser default arrow
- Custom chevron via background SVG:
```
bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat
```
- `pr-8` for arrow spacing

---

## Typography
- Page titles: `text-base font-bold text-white` (no giant headings in account pages)
- Descriptions: `text-gray-500 text-xs`
- Labels/section headers: `text-gray-500 text-xs font-medium uppercase tracking-wide`
- Body text: `text-white text-sm`
- Status: `text-green-400` (verified), `text-yellow-400` (pending), `text-red-400` (error), `text-gray-500` (empty)

---

## Status Indicators
- Icon in colored box: `w-8 h-8 rounded-lg bg-{color}-500/10 border border-{color}-500/20`
- Icon inside: `w-4 h-4 text-{color}-400`

---

## General Principles
- Design like a real e-commerce marketplace (G2G, Shopee, Amazon) — NOT an AI-generated landing page
- No oversized hero sections in account pages
- No centered "celebration" UI — keep feedback inline and minimal
- No decorative gradients or floating pill buttons
- Compact, functional, scannable — users come to do tasks, not admire the UI
- Stats grid: `grid grid-cols-2 sm:grid-cols-4 divide-x divide-border` inside a card
- Empty states: short text + small link — no giant icons or centered paragraphs
- Error messages: inline `text-red-400 text-sm` — no decorated error boxes
- Success feedback: inline text + refresh link — no modals or overlays
- No back-arrow buttons — use breadcrumb text navigation instead
- No jargon in user-facing copy (e.g. don't say "escrow" — say "secure payment" or "buyer protection")

---

## Code Style
- No comments in code
- Minimal code — only what's needed
- No `transition-all` — use specific transitions (`transition-colors`, `transition-opacity`)
- Use server components by default, `'use client'` only when needed
- No barrel exports
- Prefer `text-sm` body text, `text-xs` for meta/labels
