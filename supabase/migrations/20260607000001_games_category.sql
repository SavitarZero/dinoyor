alter table public.games
  add column if not exists category text,
  add column if not exists banner_url text;
