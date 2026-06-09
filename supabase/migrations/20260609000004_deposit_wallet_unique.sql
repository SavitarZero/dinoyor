-- Ensure no two users can register the same sender (deposit) wallet address.
-- Case-insensitive to prevent bypasses (TRC20 is case-sensitive but we normalise).
-- Partial index excludes NULLs (users who haven't set a wallet yet).
create unique index if not exists profiles_deposit_wallet_unique
  on public.profiles (lower(deposit_wallet))
  where deposit_wallet is not null;
