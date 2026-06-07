-- Item types per game (nullable game_id = applies to all games)
create table public.item_types (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid references public.games(id) on delete cascade,
  name        text not null,
  slug        text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (game_id, slug)
);

-- RLS: anyone can read, only service role can write
alter table public.item_types enable row level security;
create policy "item_types_read" on public.item_types for select using (true);

-- Add item_type_id to listings (optional — existing rows stay null)
alter table public.listings
  add column if not exists item_type_id uuid references public.item_types(id) on delete set null;

-- Generic types (game_id = null → available for every game)
insert into public.item_types (game_id, name, slug, sort_order) values
  (null, 'Account',             'account',    1),
  (null, 'In-game Currency',    'currency',   2),
  (null, 'Skin / Cosmetic',     'skin',       3),
  (null, 'Items / Equipment',   'items',      4),
  (null, 'Boosting / Rank',     'boosting',   5),
  (null, 'Other',               'other',      99);
