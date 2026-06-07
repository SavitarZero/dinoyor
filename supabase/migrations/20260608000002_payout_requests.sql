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
