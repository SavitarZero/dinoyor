-- Replace single-column index with composite: same address on different networks is allowed
drop index if exists public.profiles_deposit_wallet_unique;

create unique index if not exists profiles_deposit_wallet_network_unique
  on public.profiles (lower(deposit_wallet), deposit_wallet_network)
  where deposit_wallet is not null and deposit_wallet_network is not null;
