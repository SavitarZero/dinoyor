alter table public.profiles
  add column if not exists deposit_wallet         text,
  add column if not exists deposit_wallet_network text;
