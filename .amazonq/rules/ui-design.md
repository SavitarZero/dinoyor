# Dinoyor UI Design Rules

## Layout
- Account/settings pages use sidebar + main content layout (flex col on mobile, flex row on lg)
- Sidebar: `lg:w-64 shrink-0`, sticky at `lg:top-24`
- Sidebar contains: user card (avatar + name) + nav links with icons
- Active nav item: `text-white bg-white/[0.03] border-l-2 border-accent` with accent-colored icon
- Inactive nav item: `text-gray-400 hover:text-white hover:bg-white/[0.02] border-l-2 border-transparent`
- Max content width: `max-w-7xl mx-auto px-4`

## Cards & Containers
- Use `rounded-2xl border border-border bg-surface` for all cards
- Section headers inside cards: `px-4 py-3 border-b border-border` with uppercase tracking-wide label or semibold title
- Card body: `px-4 py-4`
- No `rounded-xl` on containers — only `rounded-2xl` for cards, `rounded-lg` for inputs/buttons/thumbnails

## Buttons
- Primary action: `px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-bold hover:opacity-90`
- Secondary/nav: `border border-border text-gray-400 hover:text-white hover:border-accent/50`
- Never use `rounded-full` for action buttons — use `rounded-lg`
- Keep buttons compact — no full-width unless it's a form submit in auth pages

## Inputs
- `w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent transition-colors`

## Typography
- Page titles: `text-base font-bold text-white` (not giant headings in settings pages)
- Descriptions: `text-gray-500 text-xs`
- Labels/section headers: `text-gray-500 text-xs font-medium uppercase tracking-wide`
- Body text: `text-white text-sm`
- Status text: green-400 (verified), yellow-400 (pending), red-400 (error), gray-500 (empty)

## Status Indicators
- Icon in small colored box: `w-8 h-8 rounded-lg bg-{color}-500/10 border border-{color}-500/20`
- Icon size inside: `w-4 h-4 text-{color}-400`

## General Principles
- Design like a real e-commerce marketplace (G2G, Shopee, Amazon), not an AI-generated landing page
- No oversized hero sections in account pages
- No centered "celebration" UI — keep feedback inline and minimal
- No decorative gradients or floating pill buttons
- Compact, functional, scannable — users come to do tasks, not admire the UI
- Stats grid: `grid grid-cols-2 sm:grid-cols-4 divide-x divide-border` inside a card
- Empty states: short text + small link, no giant icons or centered paragraphs
- Error messages: inline `text-red-400 text-sm`, no decorated error boxes
- Success feedback: inline text, refresh button — no modals or overlays
