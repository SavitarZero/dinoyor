insert into public.platform_settings (key, value) values
  ('min_deposit_amo',   '10'),
  ('min_withdraw_amo',  '200'),
  ('platform_flat_fee', '1')
on conflict (key) do nothing;
