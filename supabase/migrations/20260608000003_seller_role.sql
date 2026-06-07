alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'seller', 'admin'));

update public.profiles
  set role = 'seller'
  where kyc_status = 'approved'
    and role = 'user'
    and exists (select 1 from public.listings where seller_id = profiles.id);
