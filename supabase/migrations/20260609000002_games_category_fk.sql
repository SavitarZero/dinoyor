-- Replace free-text category column with category_id FK
alter table public.games
  add column if not exists category_id uuid;

-- Migrate existing text values → FK where names match
update public.games g
set category_id = c.id
from public.categories c
where g.category = c.name;

-- Drop old text column
alter table public.games
  drop column if exists category;
