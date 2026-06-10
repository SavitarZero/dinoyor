-- Notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('new_order', 'seller_delivered', 'buyer_confirmed', 'order_completed', 'order_cancelled', 'system')),
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.notifications enable row level security;
create policy "notifications_owner_read" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_owner_update" on public.notifications for update using (auth.uid() = user_id);

-- Index for fast queries
create index notifications_user_unread_idx on public.notifications (user_id, read, created_at desc);
