-- Atomically increment seller pending balance
create or replace function increment_seller_balance(
  p_seller_id uuid,
  p_currency text,
  p_amount numeric
) returns void as $$
begin
  insert into public.seller_balances (seller_id, currency, pending_amount)
  values (p_seller_id, p_currency, p_amount)
  on conflict (seller_id, currency)
  do update set pending_amount = seller_balances.pending_amount + excluded.pending_amount;
end;
$$ language plpgsql security definer;
