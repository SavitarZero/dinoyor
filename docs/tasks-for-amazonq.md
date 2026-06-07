# Dinoyor — Implementation Tasks

**Project:** Dinoyor (P2P Game Item Marketplace)  
**Stack:** Next.js App Router · Supabase · Tailwind CSS · TypeScript  
**Working directory:** repo root (where `package.json` lives)

---

## Context

Dinoyor is a game-item escrow marketplace. Sellers list items, buyers pay USDT to an escrow wallet, admin confirms payment, seller delivers, buyer confirms → seller balance credited.

### Current state (already built)
- Listings list + single listing page
- Order flow: `awaiting_payment → paid_escrow → delivered → completed`
- Manual crypto payment (buyer submits TX hash, admin confirms)
- KYC submission + admin review
- Seller wallet page (shows pending balance only)
- Admin: confirm payment, review KYC, resolve disputes, process payouts
- Roles: only `user` and `admin` exist in `profiles.role`

### What is NOT built yet (your tasks)
1. Balance transaction log
2. Seller payout request
3. Seller role + permission tiers
4. Profile buyer/seller view
5. Payout settings
6. Auto-release cron

---

## Supabase Client Setup

```ts
// lib/supabase/server.ts — already exists, use as-is
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { try { s.forEach(({name,value,options}) => cookieStore.set(name,value,options)) } catch {} } } }
  )
}

// lib/supabase/admin.ts — already exists, use for service_role operations
import { createClient } from '@supabase/supabase-js'
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
}
```

All server actions use `'use server'` directive. All DB calls go through the Supabase client above.

---

## Current Database Schema (relevant tables)

```sql
profiles (id, username, avatar_url, role, kyc_status, wallet_address, wallet_network, email, created_at)
  role: CHECK ('user' | 'admin')
  kyc_status: CHECK ('none' | 'pending' | 'approved' | 'rejected')
  wallet_network: CHECK ('TRC20' | 'ERC20' | 'BEP20')

orders (id, listing_id, buyer_id, seller_id, amount, platform_fee_pct, status,
        payment_tx_hash, payment_network, payment_notified_at, auto_release_at, created_at)
  status: CHECK ('awaiting_payment'|'paid_escrow'|'delivered'|'completed'|'disputed'|'cancelled')

seller_balances (id, seller_id, currency, pending_amount)
  currency: CHECK ('USDT' | 'ETH' | 'BTC')

payouts (id, seller_id, amount, currency, wallet_address, tx_hash, processed_by, processed_at)
```

Migration files go in `supabase/migrations/` named `YYYYMMDDHHMMSS_description.sql`.  
Use `alter table ... add column if not exists` and `create table if not exists`.

---

## Task 1 — Balance Transaction Log

**Goal:** Every time `seller_balances.pending_amount` changes, log the reason so sellers and admins can audit it.

### 1a. Migration

File: `supabase/migrations/20260608000001_balance_transactions.sql`

```sql
create table if not exists public.balance_transactions (
  id           uuid primary key default gen_random_uuid(),
  seller_id    uuid references public.profiles(id) not null,
  order_id     uuid references public.orders(id),
  payout_id    uuid references public.payouts(id),
  type         text not null check (type in ('credit', 'debit')),
  amount       numeric(20, 8) not null,
  currency     text not null,
  note         text,
  created_at   timestamptz not null default now()
);

alter table public.balance_transactions enable row level security;

create policy "balance_tx_self" on public.balance_transactions
  for select using (auth.uid() = seller_id);

create policy "balance_tx_admin" on public.balance_transactions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
```

### 1b. Update `lib/actions/orders.ts` — function `buyerConfirmReceived`

After the existing `increment_seller_balance` RPC call, add an insert into `balance_transactions`:

```ts
// after supabase.rpc('increment_seller_balance', ...)
await supabase.from('balance_transactions').insert({
  seller_id: order.seller_id,
  order_id: orderId,
  type: 'credit',
  amount: sellerAmount,
  currency: 'USDT',
  note: `Order #${orderId.slice(0, 8).toUpperCase()} completed`,
})
```

### 1c. Update `lib/actions/admin.ts` — function `processPayout`

After clearing `seller_balances.pending_amount`, insert a debit log:

```ts
// after updating seller_balances to 0
await supabase.from('balance_transactions').insert({
  seller_id: sellerId,
  payout_id: insertedPayoutId, // capture .select('id').single() from the payouts insert
  type: 'debit',
  amount: balance.pending_amount,
  currency,
  note: `Payout processed`,
})
```

### 1d. Update `app/[locale]/(main)/wallet/page.tsx`

Add a "Transaction History" section below the existing payout history. Query:

```ts
const { data: txLog } = await supabase
  .from('balance_transactions')
  .select('*')
  .eq('seller_id', user.id)
  .order('created_at', { ascending: false })
  .limit(50)
```

Display each row as a list item:
- Green `+` for `credit`, red `-` for `debit`
- Show amount + currency, note, date
- If `order_id` present, link to `/orders/${order_id}`

---

## Task 2 — Seller Payout Request

**Goal:** Seller can request a payout from their wallet page. Admin sees requests and approves (records TX hash).

### 2a. Migration

File: `supabase/migrations/20260608000002_payout_requests.sql`

```sql
create table if not exists public.payout_requests (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid references public.profiles(id) not null,
  amount         numeric(20, 8) not null,
  currency       text not null,
  wallet_address text not null,
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note           text,
  reviewed_by    uuid references public.profiles(id),
  reviewed_at    timestamptz,
  payout_id      uuid references public.payouts(id),
  created_at     timestamptz not null default now()
);

alter table public.payout_requests enable row level security;

create policy "payout_req_self" on public.payout_requests
  for all using (auth.uid() = seller_id);

create policy "payout_req_admin" on public.payout_requests
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
```

### 2b. New server action — `lib/actions/payouts.ts`

```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// Seller submits a payout request
export async function requestPayout(currency: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('wallet_address, wallet_network, kyc_status')
    .eq('id', user.id)
    .single()

  if (profile?.kyc_status !== 'approved') return { error: 'KYC approval required' }
  if (!profile?.wallet_address) return { error: 'Please set your payout wallet address first' }

  const { data: balance } = await supabase
    .from('seller_balances')
    .select('pending_amount')
    .eq('seller_id', user.id)
    .eq('currency', currency)
    .single()

  if (!balance || balance.pending_amount <= 0) return { error: 'No balance available' }

  // Check no pending request already
  const { data: existing } = await supabase
    .from('payout_requests')
    .select('id')
    .eq('seller_id', user.id)
    .eq('currency', currency)
    .eq('status', 'pending')
    .single()
  if (existing) return { error: 'You already have a pending payout request' }

  await supabase.from('payout_requests').insert({
    seller_id: user.id,
    amount: balance.pending_amount,
    currency,
    wallet_address: profile.wallet_address,
  })

  revalidatePath('/wallet')
  return { success: true }
}

// Admin approves a payout request
export async function approvePayoutRequest(requestId: string, txHash: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data: req } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('id', requestId)
    .single()
  if (!req || req.status !== 'pending') return { error: 'Request not found or already processed' }

  const admin = createAdminClient()

  // Insert payout record
  const { data: payout } = await admin.from('payouts').insert({
    seller_id: req.seller_id,
    amount: req.amount,
    currency: req.currency,
    wallet_address: req.wallet_address,
    tx_hash: txHash,
    processed_by: user.id,
  }).select('id').single()

  // Zero out balance
  await admin.from('seller_balances')
    .update({ pending_amount: 0 })
    .eq('seller_id', req.seller_id)
    .eq('currency', req.currency)

  // Log debit
  await admin.from('balance_transactions').insert({
    seller_id: req.seller_id,
    payout_id: payout?.id,
    type: 'debit',
    amount: req.amount,
    currency: req.currency,
    note: 'Payout approved',
  })

  // Mark request approved
  await admin.from('payout_requests').update({
    status: 'approved',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    payout_id: payout?.id,
  }).eq('id', requestId)

  revalidatePath('/admin/payouts')
  return { success: true }
}

// Admin rejects a request
export async function rejectPayoutRequest(requestId: string, note: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  await supabase.from('payout_requests').update({
    status: 'rejected',
    note,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', requestId)

  revalidatePath('/admin/payouts')
  return { success: true }
}
```

### 2c. Update `app/[locale]/(main)/wallet/page.tsx`

Add a "Request Payout" button for each currency with a positive balance:

```tsx
// Fetch payout requests too
const { data: payoutRequests } = await supabase
  .from('payout_requests')
  .select('*')
  .eq('seller_id', user.id)
  .order('created_at', { ascending: false })
```

For each balance row, show:
- If no `wallet_address` on profile → show "Set payout wallet first" (link to wallet settings)
- If pending request exists for that currency → show "Payout requested — pending admin approval" badge
- Otherwise → show "Request Payout" button that calls `requestPayout(currency)`

### 2d. Update `app/[locale]/admin/payouts/page.tsx`

Replace the current manual form with a payout requests queue:

```tsx
// Fetch pending requests
const { data: requests } = await supabase
  .from('payout_requests')
  .select('*, profiles!seller_id(username, wallet_address, wallet_network)')
  .eq('status', 'pending')
  .order('created_at', { ascending: true })
```

For each request, show:
- Seller username, wallet address, amount + currency
- Input for TX hash
- "Approve" button → calls `approvePayoutRequest(id, txHash)`
- "Reject" button (with reason input) → calls `rejectPayoutRequest(id, reason)`

---

## Task 3 — Seller Role + Permission Tiers

**Goal:** Add a `seller` tier so KYC-approved users who list items get a distinct role. Gate listing creation behind `kyc_status = 'approved'`. Menu items visible per role.

### 3a. Migration

File: `supabase/migrations/20260608000003_seller_role.sql`

```sql
-- Extend role check to include 'seller'
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'seller', 'admin'));

-- Promote all KYC-approved users who have listings to 'seller' (backfill)
update public.profiles
  set role = 'seller'
  where kyc_status = 'approved'
    and role = 'user'
    and exists (select 1 from public.listings where seller_id = profiles.id);
```

### 3b. Update KYC approval flow — `lib/actions/admin.ts`

In `reviewKYC`, when `decision === 'approved'`, also promote role to `seller`:

```ts
await supabase.from('profiles').update({
  kyc_status: 'approved',
  role: 'seller',           // ← add this
}).eq('id', sub.user_id)
```

When `decision === 'rejected'`, keep role as `user`.

### 3c. Gate listing creation — `lib/actions/listings.ts`

At the top of the `createListing` server action, check:

```ts
const { data: profile } = await supabase
  .from('profiles')
  .select('kyc_status, role')
  .eq('id', user.id)
  .single()

if (profile?.kyc_status !== 'approved') {
  return { error: 'KYC approval required to create listings' }
}
```

### 3d. Navbar / sidebar — show menu per role

In the main layout or navbar component, fetch the user's role and show/hide menu items:

| Role | Visible menus |
|------|--------------|
| `user` (not KYC) | Market, Orders, Profile |
| `seller` (KYC approved) | Market, Orders, Profile, Wallet, My Listings |
| `admin` | Everything + Admin panel link |

In the server layout, pass `role` down as a prop. In client navbar, use it to conditionally render links.

---

## Task 4 — Profile View (Buyer vs Seller)

**Goal:** `/profile` shows different sections depending on role.

### Update `app/[locale]/(main)/profile/page.tsx`

Fetch the user's role and show sections conditionally:

**Buyer (role = 'user'):**
- Personal info (username, avatar, email)
- KYC status card (with link to `/profile/kyc` if not approved)
- Order history as buyer

**Seller (role = 'seller'):**
- Personal info
- KYC status: "Approved ✓"
- Seller stats: total sales, total earnings (sum of completed orders as seller)
- Payout wallet setup (link to `/wallet`)
- Order history as seller + buyer tabs

**Both sections query:**
```ts
const { data: buyerOrders } = await supabase
  .from('orders')
  .select('id, status, amount, created_at, listings(title)')
  .eq('buyer_id', user.id)
  .order('created_at', { ascending: false })
  .limit(10)

const { data: sellerOrders } = await supabase
  .from('orders')
  .select('id, status, amount, created_at, listings(title)')
  .eq('seller_id', user.id)
  .order('created_at', { ascending: false })
  .limit(10)

const sellerEarnings = sellerOrders
  ?.filter(o => o.status === 'completed')
  .reduce((sum, o) => sum + Number(o.amount), 0) ?? 0
```

---

## Task 5 — Payout Settings

**Goal:** Seller can set a minimum payout amount. System only allows payout requests when balance ≥ minimum.

### 5a. Migration

File: `supabase/migrations/20260608000004_payout_settings.sql`

```sql
alter table public.profiles
  add column if not exists payout_min_amount numeric(20, 8) not null default 10;
```

### 5b. New server action — add to `lib/actions/payouts.ts`

```ts
export async function updatePayoutSettings(minAmount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (minAmount < 1) return { error: 'Minimum payout must be at least 1 USDT' }

  await supabase.from('profiles')
    .update({ payout_min_amount: minAmount })
    .eq('id', user.id)

  revalidatePath('/wallet')
  return { success: true }
}
```

Update `requestPayout` to enforce the minimum:

```ts
// after fetching balance
const { data: sellerProfile } = await supabase
  .from('profiles').select('payout_min_amount').eq('id', user.id).single()

const minAmount = Number(sellerProfile?.payout_min_amount ?? 10)
if (Number(balance.pending_amount) < minAmount) {
  return { error: `Minimum payout is ${minAmount} USDT` }
}
```

### 5c. Update wallet page UI

Add a "Payout Settings" card with:
- Current minimum payout amount (default 10 USDT)
- Number input to change it
- Save button → calls `updatePayoutSettings`

---

## Task 6 — Auto-Release Cron (Supabase Edge Function)

**Goal:** When `orders.auto_release_at` has passed and status is `delivered`, automatically mark as `completed` and credit seller balance.

### 6a. Migration — DB function

File: `supabase/migrations/20260608000005_auto_release_fn.sql`

```sql
-- Called by cron; processes all overdue delivered orders
create or replace function process_auto_releases()
returns void as $$
declare
  r record;
  fee numeric;
  seller_amount numeric;
begin
  for r in
    select id, seller_id, amount, platform_fee_pct
    from public.orders
    where status = 'delivered'
      and auto_release_at is not null
      and auto_release_at <= now()
  loop
    fee := (r.amount * r.platform_fee_pct) / 100;
    seller_amount := r.amount - fee;

    update public.orders set status = 'completed' where id = r.id;

    perform increment_seller_balance(r.seller_id, 'USDT', seller_amount);

    insert into public.balance_transactions
      (seller_id, order_id, type, amount, currency, note)
    values
      (r.seller_id, r.id, 'credit', seller_amount, 'USDT', 'Auto-released after 7 days');
  end loop;
end;
$$ language plpgsql security definer;
```

### 6b. Supabase Edge Function

File: `supabase/functions/auto-release/index.ts`

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { error } = await supabase.rpc('process_auto_releases')
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
```

Deploy with: `supabase functions deploy auto-release`

### 6c. Schedule cron in Supabase Dashboard

Go to Supabase Dashboard → Database → Extensions → enable `pg_cron`

Then in SQL Editor:

```sql
select cron.schedule(
  'auto-release-orders',
  '*/15 * * * *',   -- every 15 minutes
  $$select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/auto-release',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
  )$$
);
```

Alternatively (simpler): schedule `select process_auto_releases()` directly as a cron SQL job without an Edge Function.

---

## Coding Conventions

- All server actions: `'use server'` at top of file, return `{ error: string }` or `{ success: true }`
- All pages: async server components, use `createClient()` for data fetching
- Client components: add `'use client'` and use `useState`/`useEffect` for interactivity
- Styling: Tailwind CSS, dark theme — use these design tokens:
  - `bg-background` (darkest), `bg-surface` (card), `border-border`
  - `text-white` (primary), `text-gray-400` (secondary), `text-gray-600` (muted)
  - `text-accent` / `bg-accent` for primary action color (greenish)
- Buttons: `rounded-xl` for large, `rounded-lg` for small, `rounded-full` for pill/icon
- All UI must be responsive: start mobile (`flex-col`), add `sm:flex-row` for tablet+
- Touch targets minimum `py-2.5 px-4` (44px height)
- No comments in code unless non-obvious
- Prefer editing existing files over creating new ones

---

## Migration Execution

Run migrations in order by filename. Each file is idempotent (`if not exists`, `drop constraint if exists`).

To apply locally: `supabase db push`  
To apply on remote: paste SQL into Supabase Dashboard → SQL Editor and run.
