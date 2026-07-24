-- Emails live in auth.users, which isn't exposed via the public API. This
-- SECURITY DEFINER function lets an authenticated user look up the minimal
-- public fields of another profile by email, so they can send a friend
-- request without us denormalizing email onto the public profiles table.
create or replace function find_profile_by_email(p_email text)
returns table (id uuid, full_name text, avatar_url text)
language sql
security definer
set search_path = public, auth
as $$
  select p.id, p.full_name, p.avatar_url
  from auth.users u
  join profiles p on p.id = u.id
  where lower(u.email) = lower(p_email)
  limit 1;
$$;

grant execute on function find_profile_by_email(text) to authenticated;
