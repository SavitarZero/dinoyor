create table public.listing_likes (
  user_id    uuid references public.profiles(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.listing_comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.listing_likes    enable row level security;
alter table public.listing_comments enable row level security;

-- Likes: anyone reads, owner manages own
create policy "likes_public_read" on public.listing_likes for select using (true);
create policy "likes_own"         on public.listing_likes for all   using (auth.uid() = user_id);

-- Comments: anyone reads, owner inserts (purchase gate enforced in server action)
create policy "comments_public_read" on public.listing_comments for select using (true);
create policy "comments_own"         on public.listing_comments for insert with check (auth.uid() = user_id);
create policy "comments_delete_own"  on public.listing_comments for delete using (auth.uid() = user_id);
