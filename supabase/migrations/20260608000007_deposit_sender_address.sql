alter table public.deposit_requests
  add column if not exists sender_address text;
