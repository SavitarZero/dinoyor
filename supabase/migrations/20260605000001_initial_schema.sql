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

-- Trigger: auto-create profile on signup
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
