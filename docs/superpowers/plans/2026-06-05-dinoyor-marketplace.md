# DCORE Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a P2P gaming item marketplace for SEA with crypto escrow, KYC, and monthly seller payouts.

**Architecture:** Next.js 14 App Router with Supabase for auth/db/storage/realtime. Centralized escrow wallet held by platform. Admin manually processes monthly payouts. Row-Level Security enforced at DB layer.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (Auth/PostgreSQL/Storage/Realtime), Tailwind CSS, Vercel

---

## Phase 1 — Foundation

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `app/layout.tsx`, `app/globals.css`
- Create: `.env.local.example`

- [ ] **Step 1: Init Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"
```

Expected: project scaffolded in current directory

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr lucide-react clsx tailwind-merge
npm install -D supabase
```

- [ ] **Step 3: Create `.env.local.example`**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Copy to `.env.local` and fill in real values.

- [ ] **Step 4: Set dark theme in `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0a0a0b;
  --surface: #111114;
  --border: #1e1e24;
  --accent: #00e5ff;
}

body {
  background-color: var(--background);
  color: #e2e2e2;
}
```

- [ ] **Step 5: Update `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        surface: '#111114',
        border: '#1e1e24',
        accent: '#00e5ff',
      },
    },
  },
}
export default config
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: project scaffold with dark theme"
```

---

### Task 2: Supabase Client Setup

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create browser client — `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create server client — `lib/supabase/server.ts`**

```typescript
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create `middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/listings/new', '/orders', '/wallet', '/profile']
  const adminPaths = ['/admin']

  if (!user && protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && adminPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: supabase client + auth middleware"
```

---

### Task 3: Database Schema

**Files:**
- Create: `supabase/migrations/20260605000001_initial_schema.sql`
- Create: `supabase/migrations/20260605000002_rls_policies.sql`
- Create: `supabase/migrations/20260605000003_functions.sql`

- [ ] **Step 1: Init Supabase locally**

```bash
npx supabase init
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

- [ ] **Step 2: Create `supabase/migrations/20260605000001_initial_schema.sql`**

```sql
-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  kyc_status text not null default 'none' check (kyc_status in ('none', 'pending', 'approved', 'rejected')),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'th')),
  created_at timestamptz not null default now()
);

-- KYC submissions
create table public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  id_card_url text not null,
  phone text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Games reference
create table public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text
);

-- Listings
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete cascade not null,
  game_id uuid references public.games(id) not null,
  title text not null,
  description text,
  price_amount numeric(20, 8) not null,
  price_currency text not null check (price_currency in ('USDT', 'ETH', 'BTC')),
  images text[] not null default '{}',
  extra_fields jsonb default '{}',
  status text not null default 'active' check (status in ('active', 'sold', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) not null,
  buyer_id uuid references public.profiles(id) not null,
  seller_id uuid references public.profiles(id) not null,
  amount numeric(20, 8) not null,
  currency text not null check (currency in ('USDT', 'ETH', 'BTC')),
  platform_fee_pct numeric(5, 2) not null default 5.00,
  status text not null default 'awaiting_payment' check (
    status in ('awaiting_payment', 'paid_escrow', 'delivered', 'completed', 'disputed', 'cancelled')
  ),
  auto_release_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order proof screenshots
create table public.order_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  screenshot_urls text[] not null default '{}',
  uploaded_at timestamptz not null default now()
);

-- Disputes
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  opened_by uuid references public.profiles(id) not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolution text check (resolution in ('release_to_seller', 'refund_to_buyer')),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Seller balances
create table public.seller_balances (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete cascade not null,
  pending_amount numeric(20, 8) not null default 0,
  currency text not null check (currency in ('USDT', 'ETH', 'BTC')),
  unique(seller_id, currency)
);

-- Payouts
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) not null,
  amount numeric(20, 8) not null,
  currency text not null check (currency in ('USDT', 'ETH', 'BTC')),
  tx_hash text,
  wallet_address text not null,
  processed_by uuid references public.profiles(id),
  processed_at timestamptz not null default now()
);

-- Platform settings
create table public.platform_settings (
  key text primary key,
  value text not null
);
insert into public.platform_settings values ('platform_fee_pct', '5.00');

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger listings_updated_at before update on public.listings
  for each row execute function update_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute function update_updated_at();

-- Trigger: on profile insert from auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 3: Create `supabase/migrations/20260605000002_rls_policies.sql`**

```sql
alter table public.profiles enable row level security;
alter table public.kyc_submissions enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.order_proofs enable row level security;
alter table public.disputes enable row level security;
alter table public.seller_balances enable row level security;
alter table public.payouts enable row level security;

-- Profiles: own row only, admins see all
create policy "profiles_self" on public.profiles for all using (auth.uid() = id);
create policy "profiles_admin" on public.profiles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Listings: anyone can read active, seller manages own
create policy "listings_public_read" on public.listings for select using (status = 'active');
create policy "listings_seller_all" on public.listings for all using (auth.uid() = seller_id);

-- Orders: buyer or seller of the order
create policy "orders_participant" on public.orders for all using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);
create policy "orders_admin" on public.orders for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Order proofs: order participants
create policy "proofs_participant" on public.order_proofs for all using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
  )
);

-- Disputes: participant or admin
create policy "disputes_participant" on public.disputes for all using (
  auth.uid() = opened_by or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Seller balances: own only + admin
create policy "balances_self" on public.seller_balances for all using (auth.uid() = seller_id);
create policy "balances_admin" on public.seller_balances for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- KYC: own + admin
create policy "kyc_self" on public.kyc_submissions for all using (auth.uid() = user_id);
create policy "kyc_admin" on public.kyc_submissions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Payouts: own + admin
create policy "payouts_self" on public.payouts for select using (auth.uid() = seller_id);
create policy "payouts_admin" on public.payouts for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
```

- [ ] **Step 4: Create `supabase/migrations/20260605000003_functions.sql`**

```sql
-- Atomically increment seller pending balance
create or replace function increment_seller_balance(
  p_seller_id uuid,
  p_currency text,
  p_amount numeric
) returns void as $$
begin
  insert into public.seller_balances (seller_id, currency, pending_amount)
  values (p_seller_id, p_currency, p_amount)
  on conflict (seller_id, currency)
  do update set pending_amount = seller_balances.pending_amount + excluded.pending_amount;
end;
$$ language plpgsql security definer;
```

- [ ] **Step 5: Apply migrations**

```bash
npx supabase db push
```

Expected: migrations applied, tables and function visible in Supabase dashboard

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: database schema + RLS policies + balance function"
```

---

### Task 4: TypeScript Types

**Files:**
- Create: `lib/types/database.ts`

- [ ] **Step 1: Generate types from Supabase**

```bash
npx supabase gen types typescript --linked > lib/types/database.ts
```

- [ ] **Step 2: Create `lib/types/index.ts` with app-level types**

```typescript
export type OrderStatus =
  | 'awaiting_payment'
  | 'paid_escrow'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'cancelled'

export type KYCStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type Currency = 'USDT' | 'ETH' | 'BTC'
export type UserRole = 'user' | 'admin'

export interface ListingWithGame {
  id: string
  title: string
  price_amount: number
  price_currency: Currency
  images: string[]
  status: string
  seller_id: string
  games: { name: string; slug: string; logo_url: string | null } | null
}

export interface OrderWithDetails {
  id: string
  amount: number
  currency: Currency
  status: OrderStatus
  auto_release_at: string | null
  created_at: string
  listings: { title: string; images: string[] } | null
  buyer: { username: string | null } | null
  seller: { username: string | null } | null
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: typescript types"
```

---

## Phase 2 — Auth & KYC

### Task 5: Auth Pages

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `app/auth/callback/route.ts`
- Create: `lib/actions/auth.ts`

- [ ] **Step 1: Create `lib/actions/auth.ts`**

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithEmail(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  })
  if (error) return { error: error.message }
  return { success: 'Check your email to confirm your account.' }
}

export async function signInWithOAuth(provider: 'google' | 'discord') {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  })
  if (error) return { error: error.message }
  if (data.url) redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 2: Create `app/auth/callback/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/dashboard`)
}
```

- [ ] **Step 3: Create `app/(auth)/layout.tsx`**

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-xl border border-border bg-surface">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(auth)/login/page.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { signInWithEmail, signInWithOAuth } from '@/lib/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = await signInWithEmail(email, password)
    if (result?.error) setError(result.error)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Sign in to DCORE</h1>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
        <button type="submit" className="w-full py-2 rounded-lg bg-accent text-black font-semibold hover:bg-opacity-90">
          Sign In
        </button>
      </form>
      <div className="my-4 text-center text-gray-500">or</div>
      <div className="space-y-2">
        <button
          onClick={() => signInWithOAuth('google')}
          className="w-full py-2 rounded-lg border border-border text-white hover:border-accent"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signInWithOAuth('discord')}
          className="w-full py-2 rounded-lg border border-border text-white hover:border-accent"
        >
          Continue with Discord
        </button>
      </div>
      <p className="mt-4 text-center text-gray-500 text-sm">
        No account? <Link href="/register" className="text-accent">Register</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Create `app/(auth)/register/page.tsx`** (same structure as login, calls `signUpWithEmail`)

```typescript
'use client'
import { useState } from 'react'
import { signUpWithEmail } from '@/lib/actions/auth'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = await signUpWithEmail(email, password)
    if (result?.error) setError(result.error)
    if (result?.success) setMessage(result.success)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Create Account</h1>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {message && <p className="text-accent text-sm mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
        <button type="submit" className="w-full py-2 rounded-lg bg-accent text-black font-semibold hover:bg-opacity-90">
          Create Account
        </button>
      </form>
      <p className="mt-4 text-center text-gray-500 text-sm">
        Already have an account? <Link href="/login" className="text-accent">Sign in</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: auth pages (login, register, oauth, callback)"
```

---

### Task 6: KYC Flow

**Files:**
- Create: `app/(main)/profile/kyc/page.tsx`
- Create: `lib/actions/kyc.ts`
- Create: `components/kyc/KYCForm.tsx`

- [ ] **Step 1: Configure Supabase Storage bucket**

In Supabase dashboard → Storage → create bucket `kyc-documents` (private) and `item-images` (public).

- [ ] **Step 2: Create `lib/actions/kyc.ts`**

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitKYC(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const phone = formData.get('phone') as string
  const idCardFile = formData.get('id_card') as File
  if (!phone || !idCardFile) return { error: 'Missing required fields' }

  const ext = idCardFile.name.split('.').pop()
  const path = `${user.id}/id-card.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('kyc-documents')
    .upload(path, idCardFile, { upsert: true })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(path)

  await supabase.from('kyc_submissions').upsert({
    user_id: user.id,
    phone,
    id_card_url: publicUrl,
    status: 'pending',
  })

  await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', user.id)

  revalidatePath('/profile/kyc')
  return { success: 'KYC submitted. We will review within 1-2 business days.' }
}
```

- [ ] **Step 3: Create `components/kyc/KYCForm.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { submitKYC } from '@/lib/actions/kyc'
import type { KYCStatus } from '@/lib/types'

export function KYCForm({ currentStatus }: { currentStatus: KYCStatus }) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (currentStatus === 'approved') {
    return <p className="text-green-400">KYC Verified</p>
  }
  if (currentStatus === 'pending') {
    return <p className="text-yellow-400">KYC under review</p>
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await submitKYC(formData)
    if (result?.error) setError(result.error)
    if (result?.success) setMessage(result.success)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-white">Verify Your Identity</h2>
      <p className="text-gray-400 text-sm">Required to list items for sale.</p>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {message && <p className="text-accent text-sm">{message}</p>}
      {currentStatus === 'rejected' && (
        <p className="text-red-400 text-sm">Previous submission rejected. Please resubmit.</p>
      )}
      <div>
        <label className="block text-gray-400 text-sm mb-1">Phone Number</label>
        <input
          name="phone"
          type="tel"
          required
          placeholder="+66812345678"
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="block text-gray-400 text-sm mb-1">National ID Photo</label>
        <input
          name="id_card"
          type="file"
          accept="image/*"
          required
          className="w-full text-gray-400 text-sm"
        />
      </div>
      <button type="submit" className="w-full py-2 rounded-lg bg-accent text-black font-semibold">
        Submit KYC
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Create `app/(main)/profile/kyc/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { KYCForm } from '@/components/kyc/KYCForm'
import { redirect } from 'next/navigation'
import type { KYCStatus } from '@/lib/types'

export default async function KYCPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_status')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-md mx-auto py-12">
      <KYCForm currentStatus={(profile?.kyc_status ?? 'none') as KYCStatus} />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: KYC submission flow"
```

---

## Phase 3 — Listings

### Task 7: Listings CRUD

**Files:**
- Create: `lib/actions/listings.ts`
- Create: `components/listings/ListingCard.tsx`
- Create: `components/listings/ListingForm.tsx`
- Create: `app/(main)/listings/page.tsx`
- Create: `app/(main)/listings/[id]/page.tsx`
- Create: `app/(main)/listings/new/page.tsx`

- [ ] **Step 1: Create `lib/actions/listings.ts`**

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_status')
    .eq('id', user.id)
    .single()
  if (profile?.kyc_status !== 'approved') return { error: 'KYC verification required to list items' }

  const title = formData.get('title') as string
  const gameId = formData.get('game_id') as string
  const priceAmount = parseFloat(formData.get('price_amount') as string)
  const priceCurrency = formData.get('price_currency') as string
  const description = formData.get('description') as string
  const imageFiles = formData.getAll('images') as File[]

  const imageUrls: string[] = []
  for (const file of imageFiles) {
    const path = `${user.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('item-images').upload(path, file)
    if (error) return { error: error.message }
    const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(path)
    imageUrls.push(publicUrl)
  }

  const { data, error } = await supabase.from('listings').insert({
    seller_id: user.id,
    game_id: gameId,
    title,
    description,
    price_amount: priceAmount,
    price_currency: priceCurrency,
    images: imageUrls,
  }).select('id').single()

  if (error) return { error: error.message }
  revalidatePath('/listings')
  redirect(`/listings/${data.id}`)
}

export async function cancelListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('listings')
    .update({ status: 'cancelled' })
    .eq('id', listingId)
    .eq('seller_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/listings')
  return { success: true }
}
```

- [ ] **Step 2: Create `components/listings/ListingCard.tsx`**

```typescript
import Image from 'next/image'
import Link from 'next/link'
import type { ListingWithGame } from '@/lib/types'

export function ListingCard({ listing }: { listing: ListingWithGame }) {
  return (
    <Link href={`/listings/${listing.id}`} className="block rounded-xl border border-border bg-surface hover:border-accent transition-colors">
      <div className="relative h-48 rounded-t-xl overflow-hidden bg-background">
        {listing.images[0] && (
          <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">{listing.games?.name}</p>
        <h3 className="text-white font-medium truncate">{listing.title}</h3>
        <p className="text-accent font-semibold mt-2">
          {listing.price_amount} {listing.price_currency}
        </p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Create `app/(main)/listings/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import type { ListingWithGame } from '@/lib/types'

interface SearchParams { game?: string; currency?: string; q?: string }

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('id, title, price_amount, price_currency, images, status, seller_id, games(name, slug, logo_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (params.q) query = query.ilike('title', `%${params.q}%`)
  if (params.currency) query = query.eq('price_currency', params.currency)

  const { data: listings } = await query

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Marketplace</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(listings as ListingWithGame[])?.map(l => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
      {!listings?.length && (
        <p className="text-gray-500 text-center py-24">No listings found.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(main)/listings/[id]/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { BuyButton } from '@/components/orders/BuyButton'

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, games(name, slug), profiles!seller_id(username)')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isSeller = user?.id === listing.seller_id

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          {listing.images.map((url: string, i: number) => (
            <div key={i} className="relative h-64 rounded-xl overflow-hidden">
              <Image src={url} alt={listing.title} fill className="object-cover" />
            </div>
          ))}
        </div>
        <div>
          <p className="text-gray-500 text-sm">{(listing as any).games?.name}</p>
          <h1 className="text-2xl font-bold text-white mt-1">{listing.title}</h1>
          <p className="text-accent text-2xl font-semibold mt-4">
            {listing.price_amount} {listing.price_currency}
          </p>
          {listing.description && (
            <p className="text-gray-400 mt-4">{listing.description}</p>
          )}
          <p className="text-gray-500 text-sm mt-4">
            Seller: {(listing as any).profiles?.username ?? 'Anonymous'}
          </p>
          {!isSeller && user && listing.status === 'active' && (
            <BuyButton listingId={listing.id} />
          )}
          {!user && (
            <p className="mt-4 text-gray-500 text-sm">Sign in to purchase</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: listings — browse, detail, create"
```

---

## Phase 4 — Orders & Escrow

### Task 8: Order Creation & Escrow

**Files:**
- Create: `lib/actions/orders.ts`
- Create: `components/orders/BuyButton.tsx`
- Create: `app/(main)/orders/page.tsx`
- Create: `app/(main)/orders/[id]/page.tsx`
- Create: `components/orders/AutoReleaseTimer.tsx`
- Create: `components/orders/ProofUpload.tsx`

- [ ] **Step 1: Create `lib/actions/orders.ts`**

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createOrder(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, seller_id, price_amount, price_currency, status')
    .eq('id', listingId)
    .single()
  if (!listing || listing.status !== 'active') return { error: 'Listing not available' }
  if (listing.seller_id === user.id) return { error: 'Cannot buy your own listing' }

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_fee_pct')
    .single()
  const feePct = parseFloat(settings?.value ?? '5.00')

  const { data: order, error } = await supabase.from('orders').insert({
    listing_id: listingId,
    buyer_id: user.id,
    seller_id: listing.seller_id,
    amount: listing.price_amount,
    currency: listing.price_currency,
    platform_fee_pct: feePct,
    status: 'awaiting_payment',
  }).select('id').single()

  if (error) return { error: error.message }
  await supabase.from('listings').update({ status: 'sold' }).eq('id', listingId)

  revalidatePath('/orders')
  redirect(`/orders/${order.id}`)
}

export async function confirmDelivery(orderId: string, screenshotFiles: File[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, seller_id, status')
    .eq('id', orderId)
    .single()
  if (!order || order.seller_id !== user.id) return { error: 'Unauthorized' }
  if (order.status !== 'paid_escrow') return { error: 'Order not in correct state' }

  const urls: string[] = []
  for (const file of screenshotFiles) {
    const path = `${orderId}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('order-proofs').upload(path, file)
    if (error) return { error: error.message }
    const { data: { publicUrl } } = supabase.storage.from('order-proofs').getPublicUrl(path)
    urls.push(publicUrl)
  }

  await supabase.from('order_proofs').insert({ order_id: orderId, screenshot_urls: urls })

  const autoReleaseAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('orders').update({
    status: 'delivered',
    auto_release_at: autoReleaseAt,
  }).eq('id', orderId)

  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

export async function buyerConfirmReceived(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, seller_id, amount, currency, platform_fee_pct, status')
    .eq('id', orderId)
    .single()
  if (!order || order.buyer_id !== user.id) return { error: 'Unauthorized' }
  if (order.status !== 'delivered') return { error: 'Order not in correct state' }

  const fee = (order.amount * order.platform_fee_pct) / 100
  const sellerAmount = order.amount - fee

  await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId)

  await supabase.rpc('increment_seller_balance', {
    p_seller_id: order.seller_id,
    p_currency: order.currency,
    p_amount: sellerAmount,
  })

  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

export async function openDispute(orderId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, status')
    .eq('id', orderId)
    .single()
  if (!order || order.buyer_id !== user.id) return { error: 'Unauthorized' }
  if (order.status !== 'delivered') return { error: 'Can only dispute delivered orders' }

  await supabase.from('disputes').insert({ order_id: orderId, opened_by: user.id, reason })
  await supabase.from('orders').update({ status: 'disputed' }).eq('id', orderId)

  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}
```

- [ ] **Step 2: Create `components/orders/BuyButton.tsx`**

```typescript
'use client'
import { createOrder } from '@/lib/actions/orders'

export function BuyButton({ listingId }: { listingId: string }) {
  return (
    <button
      onClick={() => createOrder(listingId)}
      className="mt-6 w-full py-3 rounded-lg bg-accent text-black font-semibold hover:bg-opacity-90"
    >
      Buy Now
    </button>
  )
}
```

- [ ] **Step 3: Create `components/orders/AutoReleaseTimer.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'

export function AutoReleaseTimer({ autoReleaseAt }: { autoReleaseAt: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(autoReleaseAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining('Auto-releasing...'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setRemaining(`${d}d ${h}h ${m}m until auto-release`)
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [autoReleaseAt])

  return <p className="text-yellow-400 text-sm">{remaining}</p>
}
```

- [ ] **Step 4: Create `components/orders/ProofUpload.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { confirmDelivery } from '@/lib/actions/orders'

export function ProofUpload({ orderId }: { orderId: string }) {
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!files?.length) return
    setLoading(true)
    const result = await confirmDelivery(orderId, Array.from(files))
    setLoading(false)
    if (result?.error) setMessage(result.error)
    else setMessage('Delivery confirmed. Waiting for buyer confirmation.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-white font-medium">Mark as Delivered</p>
      <input
        type="file"
        accept="image/*"
        multiple
        required
        onChange={e => setFiles(e.target.files)}
        className="text-gray-400 text-sm"
      />
      {message && <p className="text-accent text-sm">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-accent text-black font-semibold disabled:opacity-50"
      >
        {loading ? 'Uploading...' : 'Confirm Delivery'}
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Create `app/(main)/orders/[id]/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { AutoReleaseTimer } from '@/components/orders/AutoReleaseTimer'
import { ProofUpload } from '@/components/orders/ProofUpload'
import { buyerConfirmReceived, openDispute } from '@/lib/actions/orders'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*, listings(title, images), buyer:profiles!buyer_id(username), seller:profiles!seller_id(username)')
    .eq('id', id)
    .single()
  if (!order) notFound()

  const isBuyer = user.id === order.buyer_id
  const isSeller = user.id === order.seller_id

  const { data: proofs } = await supabase
    .from('order_proofs')
    .select('screenshot_urls')
    .eq('order_id', id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Order #{id.slice(0, 8)}</h1>
      <div className="rounded-xl border border-border bg-surface p-6 space-y-3">
        <p className="text-gray-400">Item: <span className="text-white">{(order as any).listings?.title}</span></p>
        <p className="text-gray-400">Amount: <span className="text-accent">{order.amount} {order.currency}</span></p>
        <p className="text-gray-400">Status: <span className="text-white capitalize">{order.status.replace('_', ' ')}</span></p>

        {order.auto_release_at && order.status === 'delivered' && (
          <AutoReleaseTimer autoReleaseAt={order.auto_release_at} />
        )}

        {proofs?.map((p, i) => (
          <div key={i}>
            <p className="text-gray-500 text-sm">Seller proof:</p>
            {p.screenshot_urls.map((url: string, j: number) => (
              <img key={j} src={url} alt="proof" className="max-h-48 rounded-lg mt-1" />
            ))}
          </div>
        ))}

        {isSeller && order.status === 'paid_escrow' && (
          <ProofUpload orderId={id} />
        )}

        {isBuyer && order.status === 'delivered' && (
          <div className="flex gap-3 pt-2">
            <form action={async () => { 'use server'; await buyerConfirmReceived(id) }}>
              <button className="px-4 py-2 rounded-lg bg-accent text-black font-semibold">
                Confirm Received
              </button>
            </form>
            <form action={async (fd: FormData) => { 'use server'; await openDispute(id, fd.get('reason') as string) }}>
              <input name="reason" placeholder="Reason for dispute" required
                className="px-3 py-2 rounded-lg bg-background border border-border text-white text-sm" />
              <button className="ml-2 px-4 py-2 rounded-lg border border-red-500 text-red-400 font-semibold">
                Dispute
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: orders + escrow flow (buy, deliver, confirm, dispute)"
```

---

## Phase 5 — Wallet & Dashboard

### Task 9: Seller Wallet Page

**Files:**
- Create: `app/(main)/wallet/page.tsx`
- Create: `app/(main)/dashboard/page.tsx`

- [ ] **Step 1: Create `app/(main)/wallet/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: balances } = await supabase
    .from('seller_balances')
    .select('*')
    .eq('seller_id', user.id)

  const { data: payouts } = await supabase
    .from('payouts')
    .select('*')
    .eq('seller_id', user.id)
    .order('processed_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Wallet</h1>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Pending Balance</h2>
        {!balances?.length && <p className="text-gray-500">No balance yet.</p>}
        {balances?.map(b => (
          <div key={b.id} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-2xl font-bold text-accent">{b.pending_amount} {b.currency}</p>
            <p className="text-gray-500 text-sm mt-1">Paid out monthly. Next payout on 1st of next month.</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Payout History</h2>
        {!payouts?.length && <p className="text-gray-500">No payouts yet.</p>}
        {payouts?.map(p => (
          <div key={p.id} className="flex justify-between py-3 border-b border-border">
            <span className="text-gray-400 text-sm">{new Date(p.processed_at).toLocaleDateString()}</span>
            <span className="text-white">{p.amount} {p.currency}</span>
            {p.tx_hash && <span className="text-gray-500 text-xs truncate max-w-[120px]">{p.tx_hash}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: seller wallet page"
```

---

## Phase 6 — Admin Panel

### Task 10: Admin KYC Review

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `app/admin/kyc/page.tsx`
- Create: `lib/actions/admin.ts`

- [ ] **Step 1: Create `lib/actions/admin.ts`**

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorized')
  return supabase
}

export async function reviewKYC(submissionId: string, decision: 'approved' | 'rejected', reason?: string) {
  const supabase = await requireAdmin()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sub } = await supabase
    .from('kyc_submissions')
    .select('user_id')
    .eq('id', submissionId)
    .single()
  if (!sub) return { error: 'Submission not found' }

  await supabase.from('kyc_submissions').update({
    status: decision,
    rejection_reason: reason ?? null,
    reviewed_by: user!.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', submissionId)

  await supabase.from('profiles').update({ kyc_status: decision }).eq('id', sub.user_id)

  revalidatePath('/admin/kyc')
  return { success: true }
}

export async function resolveDispute(disputeId: string, resolution: 'release_to_seller' | 'refund_to_buyer') {
  const supabase = await requireAdmin()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: dispute } = await supabase
    .from('disputes')
    .select('order_id')
    .eq('id', disputeId)
    .single()
  if (!dispute) return { error: 'Dispute not found' }

  const { data: order } = await supabase
    .from('orders')
    .select('seller_id, buyer_id, amount, currency, platform_fee_pct')
    .eq('id', dispute.order_id)
    .single()
  if (!order) return { error: 'Order not found' }

  if (resolution === 'release_to_seller') {
    const fee = (order.amount * order.platform_fee_pct) / 100
    const sellerAmount = order.amount - fee
    await supabase.rpc('increment_seller_balance', {
      p_seller_id: order.seller_id,
      p_currency: order.currency,
      p_amount: sellerAmount,
    })
    await supabase.from('orders').update({ status: 'completed' }).eq('id', dispute.order_id)
  } else {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', dispute.order_id)
  }

  await supabase.from('disputes').update({
    status: 'resolved',
    resolution,
    resolved_by: user!.id,
    resolved_at: new Date().toISOString(),
  }).eq('id', disputeId)

  revalidatePath('/admin/disputes')
  return { success: true }
}

export async function processPayout(sellerId: string, currency: string, walletAddress: string, txHash: string) {
  const supabase = await requireAdmin()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: balance } = await supabase
    .from('seller_balances')
    .select('pending_amount')
    .eq('seller_id', sellerId)
    .eq('currency', currency)
    .single()
  if (!balance || balance.pending_amount <= 0) return { error: 'No balance to payout' }

  await supabase.from('payouts').insert({
    seller_id: sellerId,
    amount: balance.pending_amount,
    currency,
    wallet_address: walletAddress,
    tx_hash: txHash,
    processed_by: user!.id,
  })

  await supabase.from('seller_balances').update({ pending_amount: 0 })
    .eq('seller_id', sellerId)
    .eq('currency', currency)

  revalidatePath('/admin/payouts')
  return { success: true }
}
```

- [ ] **Step 2: Create `app/admin/layout.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="flex min-h-screen">
      <nav className="w-48 border-r border-border bg-surface p-4 space-y-2">
        <p className="text-accent font-bold mb-4">Admin</p>
        <a href="/admin/kyc" className="block text-gray-400 hover:text-white py-1">KYC Queue</a>
        <a href="/admin/disputes" className="block text-gray-400 hover:text-white py-1">Disputes</a>
        <a href="/admin/payouts" className="block text-gray-400 hover:text-white py-1">Payouts</a>
      </nav>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/admin/kyc/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { reviewKYC } from '@/lib/actions/admin'

export default async function AdminKYCPage() {
  const supabase = await createClient()
  const { data: submissions } = await supabase
    .from('kyc_submissions')
    .select('*, profiles!user_id(username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">KYC Queue ({submissions?.length ?? 0})</h1>
      <div className="space-y-4">
        {submissions?.map(s => (
          <div key={s.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <p className="text-white">User: {(s as any).profiles?.username ?? s.user_id}</p>
            <p className="text-gray-400 text-sm">Phone: {s.phone}</p>
            <a href={s.id_card_url} target="_blank" className="text-accent text-sm underline">View ID Card</a>
            <div className="flex gap-3">
              <form action={async () => { 'use server'; await reviewKYC(s.id, 'approved') }}>
                <button className="px-4 py-1 rounded bg-green-700 text-white text-sm">Approve</button>
              </form>
              <form action={async (fd: FormData) => { 'use server'; await reviewKYC(s.id, 'rejected', fd.get('reason') as string) }}>
                <input name="reason" placeholder="Rejection reason" required
                  className="px-2 py-1 rounded bg-background border border-border text-white text-sm" />
                <button className="ml-2 px-4 py-1 rounded bg-red-700 text-white text-sm">Reject</button>
              </form>
            </div>
          </div>
        ))}
        {!submissions?.length && <p className="text-gray-500">No pending KYC submissions.</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: admin panel — KYC, disputes, payouts"
```

---

### Task 11: Auto-Release Cron Job

**Files:**
- Create: `app/api/cron/auto-release/route.ts`

- [ ] **Step 1: Create `app/api/cron/auto-release/route.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: expiredOrders } = await supabase
    .from('orders')
    .select('id, seller_id, amount, currency, platform_fee_pct')
    .eq('status', 'delivered')
    .lt('auto_release_at', new Date().toISOString())

  let released = 0
  for (const order of expiredOrders ?? []) {
    const fee = (order.amount * order.platform_fee_pct) / 100
    const sellerAmount = order.amount - fee

    await supabase.from('seller_balances').upsert(
      { seller_id: order.seller_id, currency: order.currency, pending_amount: sellerAmount },
      { onConflict: 'seller_id,currency', ignoreDuplicates: false }
    )
    await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id)
    released++
  }

  return NextResponse.json({ released })
}
```

- [ ] **Step 2: Add `CRON_SECRET` to `.env.local`**

```env
CRON_SECRET=your_random_secret_string
```

- [ ] **Step 3: Add Vercel cron job in `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-release",
      "schedule": "0 * * * *"
    }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: auto-release cron job for expired orders"
```

---

### Task 11b: Admin Disputes & Payouts Pages

**Files:**

- Create: `app/admin/disputes/page.tsx`
- Create: `app/admin/payouts/page.tsx`

- [ ] **Step 1: Create `app/admin/disputes/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { resolveDispute } from '@/lib/actions/admin'

export default async function AdminDisputesPage() {
  const supabase = await createClient()
  const { data: disputes } = await supabase
    .from('disputes')
    .select('*, orders(amount, currency, listings(title)), profiles!opened_by(username)')
    .eq('status', 'open')
    .order('created_at', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Open Disputes ({disputes?.length ?? 0})</h1>
      <div className="space-y-4">
        {disputes?.map(d => (
          <div key={d.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <p className="text-white">Order: {(d as any).orders?.listings?.title}</p>
            <p className="text-gray-400">Amount: {(d as any).orders?.amount} {(d as any).orders?.currency}</p>
            <p className="text-gray-400">Opened by: {(d as any).profiles?.username}</p>
            <p className="text-gray-400 text-sm">Reason: {d.reason}</p>
            <a href={`/admin/orders/${(d as any).order_id}`} className="text-accent text-sm underline">
              View Order & Proofs
            </a>
            <div className="flex gap-3">
              <form action={async () => { 'use server'; await resolveDispute(d.id, 'release_to_seller') }}>
                <button className="px-4 py-1 rounded bg-green-700 text-white text-sm">Release to Seller</button>
              </form>
              <form action={async () => { 'use server'; await resolveDispute(d.id, 'refund_to_buyer') }}>
                <button className="px-4 py-1 rounded bg-red-700 text-white text-sm">Refund to Buyer</button>
              </form>
            </div>
          </div>
        ))}
        {!disputes?.length && <p className="text-gray-500">No open disputes.</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/admin/payouts/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { processPayout } from '@/lib/actions/admin'

export default async function AdminPayoutsPage() {
  const supabase = await createClient()
  const { data: balances } = await supabase
    .from('seller_balances')
    .select('*, profiles!seller_id(username)')
    .gt('pending_amount', 0)
    .order('pending_amount', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Pending Payouts ({balances?.length ?? 0})</h1>
      <div className="space-y-4">
        {balances?.map(b => (
          <div key={b.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <p className="text-white">{(b as any).profiles?.username ?? b.seller_id}</p>
            <p className="text-accent font-semibold">{b.pending_amount} {b.currency}</p>
            <form action={async (fd: FormData) => {
              'use server'
              await processPayout(
                b.seller_id,
                b.currency,
                fd.get('wallet_address') as string,
                fd.get('tx_hash') as string
              )
            }} className="flex gap-2">
              <input name="wallet_address" placeholder="Wallet address" required
                className="flex-1 px-3 py-1 rounded bg-background border border-border text-white text-sm" />
              <input name="tx_hash" placeholder="TX hash" required
                className="flex-1 px-3 py-1 rounded bg-background border border-border text-white text-sm" />
              <button className="px-4 py-1 rounded bg-accent text-black text-sm font-semibold">Mark Paid</button>
            </form>
          </div>
        ))}
        {!balances?.length && <p className="text-gray-500">No pending payouts.</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: admin disputes + payouts pages"
```

---

### Task 12: Navigation & Layout

**Files:**
- Create: `app/(main)/layout.tsx`
- Create: `components/layout/Navbar.tsx`

- [ ] **Step 1: Create `components/layout/Navbar.tsx`**

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="border-b border-border bg-surface sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-accent font-bold text-xl tracking-tight">DCORE</Link>
        <nav className="flex items-center gap-6">
          <Link href="/listings" className="text-gray-400 hover:text-white text-sm">Marketplace</Link>
          {user ? (
            <>
              <Link href="/listings/new" className="text-gray-400 hover:text-white text-sm">Sell</Link>
              <Link href="/orders" className="text-gray-400 hover:text-white text-sm">Orders</Link>
              <Link href="/wallet" className="text-gray-400 hover:text-white text-sm">Wallet</Link>
              <form action={signOut}>
                <button className="text-gray-400 hover:text-white text-sm">Sign out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="px-3 py-1 rounded-lg bg-accent text-black text-sm font-medium">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create `app/(main)/layout.tsx`**

```typescript
import { Navbar } from '@/components/layout/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: navbar + main layout"
```

---

### Task 12b: Listings Search Bar

**Files:**

- Create: `components/listings/SearchBar.tsx`
- Modify: `app/(main)/listings/page.tsx`

- [ ] **Step 1: Create `components/listings/SearchBar.tsx`**

```typescript
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export function SearchBar() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const sp = new URLSearchParams(params.toString())
    if (q) sp.set('q', q)
    else sp.delete('q')
    router.push(`/listings?${sp.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search items..."
        className="flex-1 px-4 py-2 rounded-lg bg-surface border border-border text-white focus:outline-none focus:border-accent"
      />
      <select
        defaultValue={params.get('currency') ?? ''}
        onChange={e => {
          const sp = new URLSearchParams(params.toString())
          if (e.target.value) sp.set('currency', e.target.value)
          else sp.delete('currency')
          router.push(`/listings?${sp.toString()}`)
        }}
        className="px-3 py-2 rounded-lg bg-surface border border-border text-white"
      >
        <option value="">All currencies</option>
        <option value="USDT">USDT</option>
        <option value="ETH">ETH</option>
        <option value="BTC">BTC</option>
      </select>
      <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-black font-semibold">
        Search
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Add `SearchBar` to `app/(main)/listings/page.tsx`**

Import and render `<SearchBar />` above the grid:

```typescript
import { SearchBar } from '@/components/listings/SearchBar'
// ... inside return:
<div className="max-w-7xl mx-auto px-4 py-8">
  <h1 className="text-3xl font-bold text-white mb-6">Marketplace</h1>
  <SearchBar />
  <div className="grid ...">
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: listings search + currency filter"
```

---

### Task 13: Homepage

**Files:**
- Create: `app/(main)/page.tsx`

- [ ] **Step 1: Create `app/(main)/page.tsx`**

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import type { ListingWithGame } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, price_amount, price_currency, images, status, seller_id, games(name, slug, logo_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div>
      <section className="py-24 text-center px-4">
        <h1 className="text-5xl font-bold text-white mb-4">
          Trade Game Items.<br />
          <span className="text-accent">Secured by Escrow.</span>
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto mb-8">
          Buy and sell in-game items with crypto — protected by DCORE's centralized escrow wallet.
        </p>
        <Link href="/listings" className="px-6 py-3 rounded-lg bg-accent text-black font-semibold">
          Browse Marketplace
        </Link>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-bold text-white mb-6">Recent Listings</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(listings as ListingWithGame[])?.map(l => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: homepage with hero + recent listings"
```

---

## Phase 7 — Seed Data & Deploy

### Task 14: Seed Games Data & Deploy

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create `supabase/seed.sql`**

```sql
insert into public.games (name, slug) values
  ('Counter-Strike 2', 'cs2'),
  ('Dota 2', 'dota2'),
  ('Valorant', 'valorant'),
  ('Team Fortress 2', 'tf2'),
  ('Path of Exile', 'poe')
on conflict (slug) do nothing;
```

- [ ] **Step 2: Apply seed**

```bash
npx supabase db reset --linked
```

- [ ] **Step 3: Deploy to Vercel**

```bash
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (your Vercel URL)
- `CRON_SECRET`

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "feat: seed data + deploy config"
```

---

## Summary

| Phase | Tasks | Deliverable |
|---|---|---|
| 1 | 1–4 | Project + DB schema + atomic balance function + types |
| 2 | 5–6 | Auth (email/OAuth) + KYC |
| 3 | 7, 12b | Listings (browse, create, detail, search/filter) |
| 4 | 8 | Orders + escrow + proof + dispute |
| 5 | 9 | Seller wallet |
| 6 | 10, 11, 11b, 12 | Admin panel (KYC + disputes + payouts) + cron + nav |
| 7 | 13–14 | Homepage + deploy |
