-- Seller wallet address on profile
alter table public.profiles
  add column if not exists wallet_address text,
  add column if not exists wallet_network text check (wallet_network in ('TRC20', 'ERC20', 'BEP20'));

-- Platform escrow wallet settings (mainnet + testnet)
insert into public.platform_settings (key, value) values
  ('escrow_wallet_address', ''),
  ('escrow_wallet_network', 'TRC20'),
  ('escrow_wallet_address_testnet', ''),
  ('escrow_wallet_network_testnet', 'TRC20 Nile Testnet')
on conflict (key) do nothing;
