alter table public.profiles enable row level security;
alter table public.kyc_submissions enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.order_proofs enable row level security;
alter table public.disputes enable row level security;
alter table public.seller_balances enable row level security;
alter table public.payouts enable row level security;
alter table public.platform_settings enable row level security;

-- Profiles: own row, admins see all
create policy "profiles_self" on public.profiles for all using (auth.uid() = id);
create policy "profiles_admin" on public.profiles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Listings: anyone reads active, seller manages own
create policy "listings_public_read" on public.listings for select using (status = 'active');
create policy "listings_seller_all" on public.listings for all using (auth.uid() = seller_id);
create policy "listings_admin" on public.listings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Orders: buyer or seller of the order, or admin
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
create policy "proofs_admin" on public.order_proofs for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Disputes: participant or admin
create policy "disputes_participant" on public.disputes for all using (
  auth.uid() = opened_by or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Seller balances: own + admin
create policy "balances_self" on public.seller_balances for all using (auth.uid() = seller_id);
create policy "balances_admin" on public.seller_balances for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- KYC: own + admin
create policy "kyc_self" on public.kyc_submissions for all using (auth.uid() = user_id);
create policy "kyc_admin" on public.kyc_submissions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Payouts: own read + admin all
create policy "payouts_self" on public.payouts for select using (auth.uid() = seller_id);
create policy "payouts_admin" on public.payouts for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Platform settings: anyone reads
create policy "settings_read" on public.platform_settings for select using (true);
create policy "settings_admin" on public.platform_settings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
