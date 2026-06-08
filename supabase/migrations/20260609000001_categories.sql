create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order int  not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
create policy "categories_read"  on public.categories for select using (true);
create policy "categories_admin" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Optional: link to listings
alter table public.listings
  add column if not exists category_id uuid references public.categories(id) on delete set null;
