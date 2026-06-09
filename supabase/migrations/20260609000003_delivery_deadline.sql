-- Add delivery_deadline_at to orders: when paid_escrow started + delivery_time
-- Seller must deliver before this timestamp, otherwise order auto-cancels
alter table public.orders
  add column if not exists delivery_deadline_at timestamptz;

-- Add available_amount to seller_balances: funds released from hold, ready for withdrawal
alter table public.seller_balances
  add column if not exists available_amount numeric(20, 8) not null default 0;

-- Add hold tracking to balance_transactions
alter table public.balance_transactions
  add column if not exists available_at timestamptz,
  add column if not exists hold_released boolean not null default false;

-- Config: days before pending balance becomes available for withdrawal
insert into public.platform_settings (key, value)
values ('payout_hold_days', '7')
on conflict (key) do nothing;

-- Move amount from pending_amount to available_amount atomically
create or replace function release_seller_balance(
  p_seller_id uuid,
  p_currency text,
  p_amount numeric
) returns void as $$
begin
  update public.seller_balances
  set
    pending_amount   = greatest(0, pending_amount - p_amount),
    available_amount = available_amount + p_amount
  where seller_id = p_seller_id and currency = p_currency;
end;
$$ language plpgsql security definer;
