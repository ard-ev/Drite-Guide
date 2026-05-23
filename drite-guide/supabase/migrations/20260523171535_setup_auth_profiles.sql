create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  username text unique not null,
  email_verified boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable"
on public.profiles
for select
using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_name text;
  v_last_name text;
  v_username text;
begin
  v_first_name := trim(coalesce(new.raw_user_meta_data->>'first_name', ''));
  v_last_name := trim(coalesce(new.raw_user_meta_data->>'last_name', ''));
  v_username := lower(trim(coalesce(new.raw_user_meta_data->>'username', '')));

  if v_first_name = '' then
    raise exception 'First name is required';
  end if;

  if v_last_name = '' then
    raise exception 'Last name is required';
  end if;

  if v_username = '' then
    raise exception 'Username is required';
  end if;

  insert into public.profiles (
    id,
    first_name,
    last_name,
    email,
    username,
    email_verified
  )
  values (
    new.id,
    v_first_name,
    v_last_name,
    lower(new.email),
    v_username,
    new.email_confirmed_at is not null
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.sync_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email_verified = new.email_confirmed_at is not null
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_verified on auth.users;

create trigger on_auth_user_email_verified
after update of email_confirmed_at on auth.users
for each row
when (old.email_confirmed_at is distinct from new.email_confirmed_at)
execute function public.sync_email_verified();