alter table public.profiles
  add column if not exists payout_min_amount numeric(20, 8) not null default 10;
