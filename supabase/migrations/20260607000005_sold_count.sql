-- Add sold_count column
alter table public.listings add column if not exists sold_count int not null default 0;

-- Auto-increment when order status changes to 'completed'
create or replace function public.increment_sold_count()
returns trigger as $$
begin
  if NEW.status = 'completed' and OLD.status <> 'completed' then
    update public.listings set sold_count = sold_count + 1 where id = NEW.listing_id;
  end if;
  return NEW;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_order_completed
  after update on public.orders
  for each row execute function public.increment_sold_count();
