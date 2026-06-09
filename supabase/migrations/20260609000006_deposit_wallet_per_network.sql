-- Split single deposit_wallet into one column per network (1 wallet per network per user)
alter table public.profiles
  add column if not exists deposit_wallet_trc20 text,
  add column if not exists deposit_wallet_erc20 text;

-- Migrate existing single wallet to the correct column
update public.profiles
  set deposit_wallet_trc20 = deposit_wallet
  where deposit_wallet_network = 'TRC20' and deposit_wallet is not null;

update public.profiles
  set deposit_wallet_erc20 = deposit_wallet
  where deposit_wallet_network = 'ERC20' and deposit_wallet is not null;

-- Replace old composite unique index with per-column unique indexes
drop index if exists public.profiles_deposit_wallet_network_unique;
drop index if exists public.profiles_deposit_wallet_unique;

create unique index if not exists profiles_deposit_wallet_trc20_unique
  on public.profiles (lower(deposit_wallet_trc20))
  where deposit_wallet_trc20 is not null;

create unique index if not exists profiles_deposit_wallet_erc20_unique
  on public.profiles (lower(deposit_wallet_erc20))
  where deposit_wallet_erc20 is not null;
