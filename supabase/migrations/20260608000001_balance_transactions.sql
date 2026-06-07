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
