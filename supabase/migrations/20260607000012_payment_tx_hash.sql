alter table public.orders
  add column if not exists payment_tx_hash text,
  add column if not exists payment_network text;
