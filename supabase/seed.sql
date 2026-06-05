insert into public.games (name, slug) values
  ('Counter-Strike 2', 'cs2'),
  ('Dota 2', 'dota2'),
  ('Valorant', 'valorant'),
  ('Team Fortress 2', 'tf2'),
  ('Path of Exile', 'poe')
on conflict (slug) do nothing;
