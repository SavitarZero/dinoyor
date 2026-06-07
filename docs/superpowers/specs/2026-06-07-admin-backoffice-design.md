# Admin Backoffice — Handoff Spec

**Date:** 2026-06-07  
**Project:** Dinoyor (Game Item Marketplace)  
**For:** External developer building standalone admin backoffice  
**Status:** Approved

---

## 1. Context

Dinoyor is a game-item trading marketplace. Buyers and sellers trade game accounts/items via escrow. The **main app** (Next.js, `dinoyor.com`) handles the buyer/seller experience. This document describes a **separate admin backoffice** to be built on a separate domain (e.g., `admin.dinoyor.com`).

A basic admin UI already exists inside the main app at `/admin/` — it handles day-to-day operations (KYC review, order payment confirmation, dispute resolution, payouts). The **new backoffice** adds configuration and management capabilities that are missing from the existing admin.

---

## 2. Architecture

```
[Admin Backoffice — separate repo & domain]
        │
        │  Supabase JS v2
        ▼
[Same Supabase project]
  - PostgreSQL (shared DB)
  - Auth (shared user accounts)
  - Storage (kyc-documents, game-images buckets)
```

- **Separate git repository** — developer has no access to the main app repo
- **Same Supabase project** — reads/writes the same database
- **Auth** — Supabase Auth, same project. Admin logs in with their email/password. After login, the app checks `profiles.role = 'admin'`; if not admin, redirect to `/unauthorized`
- **No new backend** — all data access goes through Supabase JS client directly (using `service_role` key for server-side operations that bypass RLS)

---

## 3. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Database client | `@supabase/supabase-js` v2 |
| Auth | `@supabase/ssr` (server-side auth cookies) |
| File uploads | Supabase Storage JS |
| Charts (analytics) | `recharts` or `chart.js` |
| Language | TypeScript |

---

## 4. Environment Variables

Create `.env.local` with these values:

```bash
# Same Supabase project as main app
NEXT_PUBLIC_SUPABASE_URL=https://xueosnvriszwkwjqjqcv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_XlQxxORmMZSkN4UotVFyEA_o55CJok2

# Service role key — NEVER expose to browser, server-side only
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1ZW9zbnZyaXN6d2t3anFqcWN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY2MzA1MSwiZXhwIjoyMDk2MjM5MDUxfQ._xJGfJFKOWk9HliWESmh-ihkvnD72wYTH-9ff73XPoQ

NEXT_PUBLIC_SITE_URL=https://admin.dinoyor.com
```

> **Security note:** `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS). Only use it in server components / server actions — never import in client components.

---

## 5. Database Schema Reference

The backoffice reads/writes these tables. All are in the `public` schema.

### `profiles`
```sql
id              uuid  PK (= auth.users.id)
username        text  UNIQUE
avatar_url      text
role            text  CHECK ('user' | 'admin')
kyc_status      text  CHECK ('none' | 'pending' | 'approved' | 'rejected')
preferred_language text CHECK ('en' | 'th')
wallet_address  text
wallet_network  text  CHECK ('TRC20' | 'ERC20' | 'BEP20')
email           text
created_at      timestamptz
```

### `games`
```sql
id         uuid  PK
name       text  UNIQUE
slug       text  UNIQUE   -- URL-safe identifier, e.g. "ragnarok-origin"
category   text           -- e.g. "MMORPG", "Battle Royale"
logo_url   text           -- public URL (Supabase Storage or external CDN)
banner_url text           -- public URL
```

### `listings`
```sql
id             uuid  PK
seller_id      uuid  FK → profiles
game_id        uuid  FK → games
title          text
description    text
price_amount   numeric(20,8)
price_currency text  CHECK ('USDT' | 'ETH' | 'BTC')
images         text[]
status         text  CHECK ('active' | 'sold' | 'cancelled')
sold_count     int
created_at     timestamptz
updated_at     timestamptz
```

### `orders`
```sql
id                   uuid  PK
listing_id           uuid  FK → listings
buyer_id             uuid  FK → profiles
seller_id            uuid  FK → profiles
amount               numeric(20,8)
currency             text  CHECK ('USDT' | 'ETH' | 'BTC')
platform_fee_pct     numeric(5,2)   -- e.g. 5.00
status               text  CHECK ('awaiting_payment' | 'paid_escrow' | 'delivered' | 'completed' | 'disputed' | 'cancelled')
payment_tx_hash      text
payment_network      text  -- 'ERC20' or 'TRC20'
payment_notified_at  timestamptz
auto_release_at      timestamptz
created_at           timestamptz
updated_at           timestamptz
```

### `kyc_submissions`
```sql
id               uuid  PK
user_id          uuid  FK → profiles
id_card_url      text  -- Supabase Storage signed URL
phone            text
status           text  CHECK ('pending' | 'approved' | 'rejected')
rejection_reason text
reviewed_by      uuid  FK → profiles
reviewed_at      timestamptz
created_at       timestamptz
```

### `disputes`
```sql
id          uuid  PK
order_id    uuid  FK → orders
opened_by   uuid  FK → profiles
reason      text
status      text  CHECK ('open' | 'resolved')
resolution  text  CHECK ('release_to_seller' | 'refund_to_buyer')
resolved_by uuid  FK → profiles
resolved_at timestamptz
created_at  timestamptz
```

### `seller_balances`
```sql
id             uuid  PK
seller_id      uuid  FK → profiles  UNIQUE(seller_id, currency)
pending_amount numeric(20,8)
currency       text  CHECK ('USDT' | 'ETH' | 'BTC')
```

### `payouts`
```sql
id             uuid  PK
seller_id      uuid  FK → profiles
amount         numeric(20,8)
currency       text
wallet_address text
tx_hash        text
processed_by   uuid  FK → profiles
processed_at   timestamptz
```

### `platform_settings`
```sql
key   text  PK
value text
```

**Current keys in `platform_settings`:**

| key | description | example value |
|-----|-------------|---------------|
| `platform_fee_pct` | Platform commission % | `5.00` |
| `escrow_wallet_erc20` | Mainnet ERC20 (Ethereum/Polygon) escrow address | `0x...` |
| `escrow_wallet_trc20` | Mainnet TRC20 (Tron) escrow address | `T...` |
| `escrow_wallet_erc20_testnet` | Testnet ERC20 escrow address (Sepolia) | `0x...` |
| `escrow_wallet_trc20_testnet` | Testnet TRC20 escrow address (Nile) | `T...` |

### `conversations`
```sql
id         uuid  PK
order_id   uuid  FK → orders  UNIQUE
buyer_id   uuid  FK → profiles
seller_id  uuid  FK → profiles
created_at timestamptz
```

### `messages`
```sql
id              uuid  PK
conversation_id uuid  FK → conversations
sender_id       uuid  FK → profiles (NULL = system message)
body            text
created_at      timestamptz
```

---

## 6. Supabase Client Setup

### Server client (for Server Components & Server Actions)
```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}
```

### Admin client (service role — server-side only)
```ts
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

### requireAdmin guard (reuse in every server action)
```ts
// lib/actions/_guard.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorized')
  return { supabase, adminClient: createAdminClient(), userId: user.id }
}
```

---

## 7. Auth Flow

1. Backoffice has a `/login` page with email + password form
2. On submit: call `supabase.auth.signInWithPassword({ email, password })`
3. Middleware (or layout) checks session and `profiles.role`:
   - Not logged in → redirect `/login`
   - Logged in but `role !== 'admin'` → redirect `/unauthorized`
4. Logout: `supabase.auth.signOut()`

**Middleware example:**
```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { ... } } // standard @supabase/ssr cookie helpers
  )
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}

export const config = { matcher: ['/((?!_next|favicon.ico).*)'] }
```

---

## 8. Pages & Features

### 8.1 Dashboard (/)

Summary cards at the top, then recent activity feed.

**Stats cards:**
```
[Total Users]  [KYC Pending]  [Open Orders]  [Disputes Open]
[Revenue (30d)]  [Payouts Pending]
```

**Queries:**
```ts
// Total users
const { count: totalUsers } = await supabase
  .from('profiles').select('*', { count: 'exact', head: true })

// KYC pending count
const { count: kycPending } = await supabase
  .from('kyc_submissions').select('*', { count: 'exact', head: true })
  .eq('status', 'pending')

// Open orders (awaiting_payment + paid_escrow)
const { count: openOrders } = await supabase
  .from('orders').select('*', { count: 'exact', head: true })
  .in('status', ['awaiting_payment', 'paid_escrow'])

// Open disputes
const { count: openDisputes } = await supabase
  .from('disputes').select('*', { count: 'exact', head: true })
  .eq('status', 'open')

// Revenue last 30 days (completed orders)
const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
const { data: revenueData } = await supabase
  .from('orders')
  .select('amount, platform_fee_pct')
  .eq('status', 'completed')
  .gte('updated_at', thirtyDaysAgo)
// sum: revenueData.reduce((acc, o) => acc + (o.amount * o.platform_fee_pct / 100), 0)

// Payouts pending
const { data: pendingPayouts } = await supabase
  .from('seller_balances').select('pending_amount, currency').gt('pending_amount', 0)
```

**Charts (last 30 days):**
- Orders per day (bar chart)
- Revenue per day (line chart)

```ts
// Orders grouped by day
const { data: ordersPerDay } = await supabase
  .from('orders')
  .select('created_at, amount, platform_fee_pct')
  .gte('created_at', thirtyDaysAgo)
  .order('created_at', { ascending: true })
// Group in JS: group by date string, count, sum fees
```

---

### 8.2 Games Management (/games)

**List view:** Table with columns: Logo, Name, Category, Slug, Listing Count, Actions

**Fetch with listing count:**
```ts
const { data: games } = await supabase
  .from('games')
  .select('*, listings(count)')
  .order('name')
```

**Create/Edit form fields:**
| Field | Type | Notes |
|-------|------|-------|
| name | text | required, unique |
| slug | text | required, unique, URL-safe (auto-generated from name, editable) |
| category | text | e.g. "MMORPG", "Battle Royale", "FPS" |
| logo_url | image upload | upload to Supabase Storage → `game-images` bucket, path `logos/{game_id}.webp` |
| banner_url | image upload | upload to Supabase Storage → `game-images` bucket, path `banners/{game_id}.webp` |

**Storage bucket setup needed:**  
The `game-images` bucket does not exist yet. Create it in Supabase Dashboard → Storage → New bucket:
- Name: `game-images`
- Public: **true** (images are displayed on the marketplace)
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Max size: 2 MB

**Upload pattern:**
```ts
// Upload logo
const file = formData.get('logo') as File
const ext = file.name.split('.').pop()
const { data, error } = await adminSupabase.storage
  .from('game-images')
  .upload(`logos/${gameId}.webp`, file, { upsert: true, contentType: 'image/webp' })

const { data: { publicUrl } } = adminSupabase.storage
  .from('game-images')
  .getPublicUrl(`logos/${gameId}.webp`)

// Save publicUrl to games.logo_url
```

**Delete game:** Only allowed if `listings.count = 0`. Show error otherwise.

---

### 8.3 Platform Settings (/settings)

Single-page form. On submit, update `platform_settings` table for each changed key.

**Fields:**

| UI Label | DB key | Type | Notes |
|----------|--------|------|-------|
| Platform Fee % | `platform_fee_pct` | number input (0–100, step 0.01) | Applied to all new orders |
| Escrow Wallet — ERC20 (Mainnet) | `escrow_wallet_erc20` | text | Ethereum/Polygon address `0x...` |
| Escrow Wallet — TRC20 (Mainnet) | `escrow_wallet_trc20` | text | Tron address `T...` |
| Escrow Wallet — ERC20 (Testnet/Sepolia) | `escrow_wallet_erc20_testnet` | text | For dev/testing |
| Escrow Wallet — TRC20 (Testnet/Nile) | `escrow_wallet_trc20_testnet` | text | For dev/testing |

**Fetch settings:**
```ts
const { data } = await supabase
  .from('platform_settings').select('key, value')
// Convert to object: { platform_fee_pct: '5.00', escrow_wallet_erc20: '0x...', ... }
const settings = Object.fromEntries(data.map(r => [r.key, r.value]))
```

**Save settings (server action):**
```ts
'use server'
// Upsert each changed key
for (const [key, value] of Object.entries(updates)) {
  await adminSupabase.from('platform_settings')
    .upsert({ key, value }, { onConflict: 'key' })
}
```

> **Note on fee change:** Changing `platform_fee_pct` only affects new orders. Existing orders already have `platform_fee_pct` stored per-order — they are not affected.

---

### 8.4 User Management (/users)

**List view:** Paginated table (50 per page).

Columns: Avatar, Username, Email, Role, KYC Status, Wallet, Created At, Actions

**Fetch:**
```ts
const { data: users, count } = await supabase
  .from('profiles')
  .select('id, username, avatar_url, role, kyc_status, wallet_address, wallet_network, email, created_at', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range(offset, offset + 49)
```

**Search:** Filter by username or email (use `.ilike('username', '%query%')`)

**Detail page `/users/[id]`:**
- Full profile info
- KYC submission history
- Order history (as buyer and as seller)
- Balance and payout history

**Actions:**

| Action | How |
|--------|-----|
| Change role (user ↔ admin) | `UPDATE profiles SET role = $role WHERE id = $id` |
| Ban user | Add `is_banned boolean default false` column to `profiles` (new migration needed — see section 10) |
| View KYC document | Fetch signed URL from `kyc-documents` storage bucket |

**Fetch KYC signed URL (admin only, private bucket):**
```ts
// Use admin client (service role bypasses storage RLS)
const { data } = await adminSupabase.storage
  .from('kyc-documents')
  .createSignedUrl(kyc_submission.id_card_url_path, 3600) // 1 hour expiry
```

---

### 8.5 Analytics (/analytics)

**Period selector:** Last 7 days / 30 days / 90 days

**Section 1 — Overview numbers:**
- Total orders (by status breakdown: completed / cancelled / disputed)
- Total revenue (sum of `amount * platform_fee_pct / 100` on completed orders)
- Total new users
- Total new sellers (users who created ≥1 listing)

**Section 2 — Time series charts:**
- Orders per day (bar)
- Revenue per day (line)
- New users per day (bar)

**Section 3 — Top tables:**
- Top 10 games by listing count
- Top 10 sellers by completed orders

```ts
// Top games
const { data: topGames } = await supabase
  .from('games')
  .select('name, listings(count)')
  .order('listings_count', { ascending: false })
  .limit(10)

// Top sellers
const { data: topSellers } = await supabase
  .from('profiles')
  .select('username, orders_as_seller:orders!seller_id(count)')
  .order('orders_as_seller_count', { ascending: false })
  .limit(10)
```

---

## 9. File / Route Structure

```
app/
  login/
    page.tsx              ← email+password login form
  unauthorized/
    page.tsx              ← "Not admin" message
  (admin)/
    layout.tsx            ← requireAdmin guard + sidebar nav
    page.tsx              ← redirect to /dashboard
    dashboard/
      page.tsx
    games/
      page.tsx            ← list
      new/page.tsx        ← create form
      [id]/page.tsx       ← edit form
    settings/
      page.tsx
    users/
      page.tsx            ← list
      [id]/page.tsx       ← detail
    analytics/
      page.tsx

lib/
  supabase/
    server.ts             ← createClient (anon, SSR cookies)
    admin.ts              ← createAdminClient (service role)
  actions/
    _guard.ts             ← requireAdmin()
    games.ts              ← createGame, updateGame, deleteGame
    settings.ts           ← updateSettings
    users.ts              ← updateRole, banUser
```

---

## 10. New Migration Required

The backoffice needs one new column on `profiles` for user banning. The external developer should NOT run migrations directly — send this SQL to the main app owner (or run it in the Supabase Dashboard SQL editor):

```sql
-- Add banned flag to profiles
alter table public.profiles
  add column if not exists is_banned boolean not null default false;

-- RLS: banned users cannot sign in (enforced at app level)
-- No new policy needed — admins already have full profiles access
```

> The main app should also check `is_banned = true` on login and block access.

---

## 11. Navigation Sidebar

```
[Logo: Dinoyor Admin]
─────────────────────
 Dashboard
 Games
 Platform Settings
 Users
 Analytics
─────────────────────
 [Logout]
```

---

## 12. Existing Admin Capabilities (in Main App)

These are **already handled** in the main app (`dinoyor.com/admin/`). The backoffice does **not** need to duplicate them:

| Feature | Main app route | Description |
|---------|---------------|-------------|
| Confirm payment | `/admin/orders` | Verify buyer's TX hash and confirm payment received |
| KYC review | `/admin/kyc` | Approve or reject ID card submissions |
| Resolve disputes | `/admin/disputes` | Release escrow to seller or refund to buyer |
| Process payouts | `/admin/payouts` | Mark seller balance as paid out (enter TX hash) |

---

## 13. CORS / Cross-Domain Notes

Supabase handles CORS automatically for the anon key. No additional CORS configuration is needed.

For the backoffice domain to use Supabase Auth cookies properly, add the backoffice URL to:
- Supabase Dashboard → Authentication → URL Configuration → **Redirect URLs**: add `https://admin.dinoyor.com/**`
- Supabase Dashboard → Authentication → URL Configuration → **Site URL**: can stay as main app URL

---

## 14. Deployment

Deploy on Vercel (recommended):
1. `npx create-next-app@latest dinoyor-admin`
2. Add env vars in Vercel project settings (same values as section 4)
3. Set custom domain `admin.dinoyor.com` in Vercel
4. Add `https://admin.dinoyor.com/**` to Supabase Auth redirect URLs

---

## 15. Summary Checklist for Developer

- [ ] Create Next.js 15 app with TypeScript + Tailwind
- [ ] Install `@supabase/supabase-js` and `@supabase/ssr`
- [ ] Set up env vars (section 4)
- [ ] Set up Supabase server client + admin client (section 6)
- [ ] Auth middleware with role check (section 7)
- [ ] Login page
- [ ] Admin layout with sidebar
- [ ] Dashboard page with stats + charts
- [ ] Games CRUD + image upload (create `game-images` storage bucket first)
- [ ] Platform Settings form
- [ ] User Management list + detail page
- [ ] Analytics page
- [ ] Run `is_banned` migration in Supabase Dashboard (SQL from section 10)
- [ ] Add backoffice URL to Supabase Auth redirect URLs (section 13)
