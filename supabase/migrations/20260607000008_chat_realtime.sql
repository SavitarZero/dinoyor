-- Conversations: one per order
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade unique not null,
  buyer_id uuid references public.profiles(id) not null,
  seller_id uuid references public.profiles(id) not null,
  created_at timestamptz not null default now()
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id), -- null = system message
  body text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "conv_participant" on public.conversations for all using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);
create policy "conv_admin" on public.conversations for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "msg_participant" on public.messages for all using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);
create policy "msg_admin" on public.messages for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Enable Realtime on messages so both parties receive live updates
alter publication supabase_realtime add table public.messages;
