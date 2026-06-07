# Dinoyor — Task Handoff Document

> Read AGENTS.md first for project rules and UI conventions.

## Project Overview

P2P gaming item marketplace for SEA gamers. Sellers list in-game items, buyers pay USDT into a platform escrow, seller delivers, buyer confirms, platform pays seller monthly.

**Stack:** Next.js 16 App Router · Supabase (Auth + DB + Storage + Realtime) · Tailwind CSS · TypeScript

**Key env vars needed:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SIGHTENGINE_API_USER`
- `SIGHTENGINE_API_SECRET`

---

## Current Payment Flow

```
Buyer clicks Buy
  → order created (status: awaiting_payment)
  → UI shows platform escrow wallet address (from platform_settings table)

Buyer sends USDT to escrow wallet (manual, no blockchain webhook yet)
  → Admin manually updates order status to paid_escrow in Supabase dashboard

Seller uploads delivery proof screenshots
  → order status: delivered
  → auto_release_at set to 7 days from now

Buyer confirms receipt (or auto-release timer expires)
  → order status: completed
  → seller_balances.pending_amount += (order.amount - platform_fee)

Admin pays out on 1st of month
  → reads seller_balances.pending_amount + profiles.wallet_address + profiles.wallet_network
  → sends USDT manually
  → records in payouts table (tx_hash, wallet_address, processed_by)
  → resets seller_balances.pending_amount = 0
```

---

## Database Schema Summary

| Table | Purpose |
|---|---|
| `profiles` | User profiles — username, avatar, kyc_status, role, wallet_address, wallet_network, pending_email |
| `games` | Game reference — name, slug, logo_url, banner_url, category |
| `listings` | Item listings — price_amount, price_currency, images[], status |
| `orders` | Orders — amount, platform_fee_pct, status, auto_release_at |
| `order_proofs` | Delivery screenshots per order |
| `disputes` | Open disputes, resolution tracking |
| `conversations` | One per order, links buyer + seller |
| `messages` | Chat messages — sender_id null = system message |
| `seller_balances` | Accumulated pending payout per seller (currency: USDT) |
| `payouts` | Payout history with tx_hash |
| `platform_settings` | Key-value: platform_fee_pct, escrow_wallet_address, escrow_wallet_network |
| `kyc_submissions` | KYC document uploads, review status |
| `listing_likes` | User likes on listings |
| `listing_comments` | Reviews — only buyers who completed a purchase can post |
| `balance_transactions` | **NOT YET CREATED** — see tasks below |
| `order_status_logs` | **NOT YET CREATED** — see tasks below |

**Important:** `orders.currency` column was DROPPED. Do not reference it anywhere.

---

## Auth System

- Username/password users: Supabase stores email as `{username}@dinoyor.internal` internally
- Google OAuth users also supported
- KYC required only for SELLERS (not buyers)
- Password reset via email verification (user must add a real email in `/profile/email` first)

---

## File Structure (key files)

```
app/
  [locale]/
    (auth)/         — login, register, forgot-password, reset-password
    (main)/
      market/       — listing grid + [id] detail page
      orders/       — order list + [id] detail with chat
      profile/      — dashboard, KYC, email settings
      wallet/       — balance + payout wallet address
      admin/        — KYC review, admin tools
  auth/callback/    — handles email verification + OAuth

components/
  layout/           — Navbar (streaming with Suspense), Footer
  listings/         — ListingForm, ListingImages (slideshow), LikeButton, CommentsSection
  orders/           — BuyButton, ChatWindow (realtime), AutoReleaseTimer, ProofUpload
  profile/          — EmailForm
  wallet/           — WalletAddressForm

lib/
  actions/          — Server actions: auth, listings, orders, chat, wallet, admin, kyc
  cache/games.ts    — unstable_cache for games list (5 min TTL)
  moderation.ts     — Sightengine nudity check for uploaded images
  supabase/
    server.ts       — cookie-based client (SSR)
    client.ts       — browser client
    admin.ts        — service role client
```

---

## Pending Tasks

### TASK 1 — Chat Realtime (PARTIALLY DONE, needs DB step)

**Status:** Code is complete. `ChatWindow.tsx` subscribes to `postgres_changes` on `messages`. Optimistic update shows own messages immediately. The OTHER party receives via realtime.

**What's needed:**
1. Run migration `supabase/migrations/20260607000008_chat_realtime.sql` in Supabase — this creates `conversations` + `messages` tables and enables `supabase_realtime` publication on `messages`.
2. In Supabase Dashboard → Realtime → confirm `messages` table is in the replication list.

**If the tables already exist in Supabase:** Run only:
```sql
alter publication supabase_realtime add table public.messages;
```

**Files:** `components/orders/ChatWindow.tsx`, `lib/actions/chat.ts`

---

### TASK 2 — balance_transactions table

Add audit trail for every change to `seller_balances.pending_amount`.

**Migration to create:**
```sql
create table public.balance_transactions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) not null,
  order_id uuid references public.orders(id),     -- null for manual adjustments
  payout_id uuid references public.payouts(id),   -- null unless this is a payout deduction
  type text not null check (type in ('credit', 'debit')),
  amount numeric(20, 8) not null,
  currency text not null default 'USDT',
  note text,
  created_at timestamptz not null default now()
);

alter table public.balance_transactions enable row level security;
create policy "btx_self" on public.balance_transactions for select using (auth.uid() = seller_id);
create policy "btx_admin" on public.balance_transactions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
```

**Update `increment_seller_balance` function** in `supabase/migrations/20260605000003_functions.sql` to also insert a `balance_transactions` row (type: 'credit').

**Update `buyerConfirmReceived`** in `lib/actions/orders.ts` to pass `order_id` when calling the RPC.

---

### TASK 3 — order_status_logs table

Track who changed an order status and when.

**Migration:**
```sql
create table public.order_status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id), -- null = system/trigger
  note text,
  created_at timestamptz not null default now()
);

alter table public.order_status_logs enable row level security;
create policy "statuslog_participant" on public.order_status_logs for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
  )
);
create policy "statuslog_admin" on public.order_status_logs for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
```

**Add a Postgres trigger** on `orders` table that auto-inserts a row into `order_status_logs` whenever `status` changes.

---

### TASK 4 — Admin Payout UI

Admin page at `/admin/payouts` that:
1. Lists all sellers with `pending_amount > 0` + their `wallet_address` + `wallet_network`
2. Admin marks a payout as done: enters `tx_hash` → inserts into `payouts` table → resets `pending_amount = 0` → inserts a 'debit' row in `balance_transactions`

**Files to create:**
- `app/[locale]/admin/payouts/page.tsx` — server component listing sellers to pay
- `components/admin/PayoutForm.tsx` — client form for tx_hash entry
- `lib/actions/admin.ts` — add `processPayout(sellerId, txHash, amount, currency)` server action

---

### TASK 5 — Admin: manually confirm payment (awaiting_payment → paid_escrow)

Admin needs a way to mark an order as paid without going into Supabase dashboard.

**Add to** `app/[locale]/admin/` — orders list with a "Mark as Paid" button for `awaiting_payment` orders.

**Server action:** `confirmPayment(orderId)` — updates status to `paid_escrow`, logs to `order_status_logs`.

---

## Supabase SQL still to run manually

```sql
-- 1. Chat tables + realtime (if not already created)
-- Run: supabase/migrations/20260607000008_chat_realtime.sql

-- 2. Wallet fields on profiles
-- Run: supabase/migrations/20260607000007_wallet_fields.sql

-- 3. Profile email field
-- Run: supabase/migrations/20260607000004_profile_email.sql
```

---

## Known Issues / Notes

- `listings.price_currency` check constraint includes USDT/ETH/BTC but the market currently targets USDT only
- `seller_balances.currency` check constraint: USDT/ETH/BTC — code always uses USDT
- Auto-release (7 days after delivery) timer shows in UI but the actual DB update on timeout is NOT implemented — needs a Supabase Edge Function or cron job
- Sightengine content moderation runs server-side on listing image upload (fails open on API error)
- Image compression runs client-side via `browser-image-compression` before upload
