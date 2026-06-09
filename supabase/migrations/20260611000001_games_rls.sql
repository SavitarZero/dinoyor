-- Enable RLS on games table
alter table public.games enable row level security;

-- Everyone can read games
create policy "games_public_read" on public.games for select using (true);

-- Only admins can insert/update/delete
create policy "games_admin_write" on public.games for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
