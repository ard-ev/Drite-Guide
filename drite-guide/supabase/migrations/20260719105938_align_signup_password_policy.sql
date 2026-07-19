create or replace function public.is_strong_signup_password(password_value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    length(password_value) >= 8
    and password_value ~ '[A-Z]'
    and password_value ~ '[a-z]'
    and password_value ~ '[0-9]'
    and password_value ~ '[^A-Za-z0-9]',
    false
  );
$$;

revoke all on function public.is_strong_signup_password(text) from public;
grant execute on function public.is_strong_signup_password(text) to service_role;
