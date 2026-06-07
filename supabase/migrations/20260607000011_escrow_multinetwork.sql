-- Add per-network escrow wallet keys (ERC20 primary, TRC20 secondary)
insert into public.platform_settings (key, value) values
  ('escrow_wallet_erc20',         ''),
  ('escrow_wallet_trc20',         ''),
  ('escrow_wallet_erc20_testnet', ''),
  ('escrow_wallet_trc20_testnet', '')
on conflict (key) do nothing;
