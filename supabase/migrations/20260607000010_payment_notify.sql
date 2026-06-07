alter table public.orders
  add column if not exists payment_notified_at timestamptz;
