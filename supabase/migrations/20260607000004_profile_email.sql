-- Add email column
alter table public.profiles add column if not exists email text;

-- Update trigger to populate email, username, avatar from auth metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'preferred_username',
      new.raw_user_meta_data->>'user_name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do update set
    email      = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    -- only set username if not already customised
    username   = case
      when public.profiles.username is null then excluded.username
      else public.profiles.username
    end;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
