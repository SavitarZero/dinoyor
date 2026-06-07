-- Seller wallet address on profile
alter table public.profiles
  add column if not exists wallet_address text,
  add column if not exists wallet_network text check (wallet_network in ('TRC20', 'ERC20', 'BEP20'));

-- Platform escrow wallet settings
insert into public.platform_settings (key, value) values
  ('escrow_wallet_address', ''),
  ('escrow_wallet_network', 'TRC20')
on conflict (key) do nothing;
