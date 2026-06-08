-- Spendable balance for buyers (funded via crypto deposits)
create table public.user_balances (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  currency   text not null default 'USDT',
  balance    numeric(20, 8) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, currency)
);

alter table public.user_balances enable row level security;

create policy "user_balance_self" on public.user_balances
  for select using (auth.uid() = user_id);

create policy "user_balance_admin" on public.user_balances
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Crypto deposit requests submitted by users
create table public.deposit_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  tx_hash         text not null,
  network         text not null check (network in ('TRC20', 'ERC20')),
  claimed_amount  numeric(20, 8) not null,
  approved_amount numeric(20, 8),
  currency        text not null default 'USDT',
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note            text,
  reviewed_by     uuid references public.profiles(id),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.deposit_requests enable row level security;

create policy "deposit_req_self" on public.deposit_requests
  for all using (auth.uid() = user_id);

create policy "deposit_req_admin" on public.deposit_requests
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Atomic increment user balance
create or replace function public.increment_user_balance(
  p_user_id uuid, p_currency text, p_amount numeric
) returns void language plpgsql security definer as $$
begin
  insert into public.user_balances (user_id, currency, balance)
  values (p_user_id, p_currency, p_amount)
  on conflict (user_id, currency)
  do update set balance = public.user_balances.balance + excluded.balance, updated_at = now();
end; $$;

-- Atomic decrement — returns false if insufficient
create or replace function public.decrement_user_balance(
  p_user_id uuid, p_currency text, p_amount numeric
) returns boolean language plpgsql security definer as $$
declare v_current numeric;
begin
  select balance into v_current
  from public.user_balances
  where user_id = p_user_id and currency = p_currency
  for update;

  if v_current is null or v_current < p_amount then return false; end if;

  update public.user_balances
  set balance = balance - p_amount, updated_at = now()
  where user_id = p_user_id and currency = p_currency;

  return true;
end; $$;
