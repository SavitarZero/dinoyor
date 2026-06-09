create table public.platform_revenue (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null,
  fee_pct    numeric(5, 2) not null,
  flat_fee   numeric(20, 8) not null default 0,
  amount     numeric(20, 8) not null,
  currency   text not null default 'USDT',
  created_at timestamptz not null default now()
);

alter table public.platform_revenue enable row level security;

create policy "revenue_admin" on public.platform_revenue
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
