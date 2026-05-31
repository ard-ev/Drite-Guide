create extension if not exists "pgcrypto";

create table if not exists public.user_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null unique,
  username text not null unique,
  normalized_username text generated always as (lower(username)) stored,
  profile_picture_path text,
  bio text,
  role text not null default 'user' check (role in ('user', 'admin')),
  preferred_language text not null default 'en',
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profile_username_length_check
    check (char_length(username) between 3 and 30),
  constraint user_profile_username_format_check
    check (username ~ '^[a-z0-9_.]+$')
);

create unique index if not exists user_profile_normalized_username_key
  on public.user_profile (normalized_username);
create index if not exists user_profile_email_verified_idx
  on public.user_profile (email_verified);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profile_set_updated_at on public.user_profile;
create trigger user_profile_set_updated_at
before update on public.user_profile
for each row execute function public.set_updated_at();

create or replace function public.normalize_username(username_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(
    regexp_replace(
      lower(regexp_replace(btrim(coalesce(username_value, '')), '^@+', '')),
      '[^a-z0-9_.]+',
      '',
      'g'
    ),
    30
  );
$$;

create or replace function public.is_username_available(username_value text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.normalize_username(username_value) ~ '^[a-z0-9_.]{3,30}$'
    and not exists (
      select 1
      from public.user_profile
      where normalized_username = public.normalize_username(username_value)
    );
$$;

insert into public.user_profile (
  id,
  first_name,
  last_name,
  email,
  username,
  preferred_language,
  email_verified,
  created_at,
  updated_at
)
select
  prepared.id,
  prepared.first_name,
  prepared.last_name,
  prepared.email,
  case
    when prepared.username_base !~ '^[a-z0-9_.]{3,30}$'
      then 'user' || substr(replace(prepared.id::text, '-', ''), 1, 12)
    when count(*) over (partition by prepared.username_base) = 1
      then prepared.username_base
    else left(prepared.username_base, 21) || '_' || substr(replace(prepared.id::text, '-', ''), 1, 8)
  end,
  prepared.preferred_language,
  prepared.email_verified,
  prepared.created_at,
  prepared.updated_at
from (
  select
    auth_users.id,
    coalesce(btrim(auth_users.raw_user_meta_data ->> 'first_name'), '') as first_name,
    coalesce(btrim(auth_users.raw_user_meta_data ->> 'last_name'), '') as last_name,
    lower(auth_users.email) as email,
    left(
      coalesce(
        nullif(
          public.normalize_username(
            coalesce(
              nullif(auth_users.raw_user_meta_data ->> 'username', ''),
              split_part(coalesce(auth_users.email, auth_users.id::text), '@', 1)
            )
          ),
          ''
        ),
        'user'
      ),
      30
    ) as username_base,
    coalesce(nullif(auth_users.raw_user_meta_data ->> 'preferred_language', ''), 'en') as preferred_language,
    auth_users.email_confirmed_at is not null as email_verified,
    coalesce(auth_users.created_at, now()) as created_at,
    coalesce(auth_users.updated_at, auth_users.created_at, now()) as updated_at
  from auth.users auth_users
  where auth_users.email is not null
) prepared
on conflict (id) do update set
  email = excluded.email,
  email_verified = excluded.email_verified,
  updated_at = now();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := public.normalize_username(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'user'
    )
  );

  if v_username !~ '^[a-z0-9_.]{3,30}$' then
    v_username := 'user' || substr(replace(new.id::text, '-', ''), 1, 12);
  end if;

  insert into public.user_profile (
    id,
    first_name,
    last_name,
    email,
    username,
    preferred_language,
    email_verified
  )
  values (
    new.id,
    coalesce(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    coalesce(btrim(new.raw_user_meta_data ->> 'last_name'), ''),
    lower(new.email),
    v_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'preferred_language', ''), 'en'),
    new.email_confirmed_at is not null
  );

  return new;
exception
  when unique_violation then
    raise exception 'Username already taken' using errcode = '23505';
end;
$$;

create or replace function public.sync_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_profile
  set
    email = lower(new.email),
    email_verified = new.email_confirmed_at is not null
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_email_verified on auth.users;
drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_verified
after update of email, email_confirmed_at on auth.users
for each row
when (
  old.email is distinct from new.email
  or old.email_confirmed_at is distinct from new.email_confirmed_at
)
execute function public.sync_email_verified();

create table if not exists public.user_followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.user_profile(id) on delete cascade,
  following_id uuid not null references public.user_profile(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_followers_unique unique (follower_id, following_id),
  constraint user_followers_no_self_follow check (follower_id <> following_id)
);

create index if not exists user_followers_follower_id_idx
  on public.user_followers (follower_id);
create index if not exists user_followers_following_id_idx
  on public.user_followers (following_id);

alter table if exists public.trips add column if not exists members jsonb not null default '[]'::jsonb;
alter table if exists public.trips add column if not exists places jsonb not null default '[]'::jsonb;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select auth.uid();
$$;

create or replace function public.is_trip_member(trip_uuid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.trips
    where id = trip_uuid
      and (
        owner_id = public.current_app_user_id()
        or members @> jsonb_build_array(
          jsonb_build_object('user_id', public.current_app_user_id()::text)
        )
      )
  );
$$;

alter table public.user_profile enable row level security;
alter table public.user_followers enable row level security;
alter table if exists public.saved_places enable row level security;
alter table if exists public.trips enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.user_profile to anon, authenticated;
grant select, update on public.user_profile to authenticated;
grant select, insert, delete on public.user_followers to authenticated;
grant select, insert, update, delete on public.saved_places to authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant execute on function public.is_username_available(text) to anon, authenticated;
grant execute on function public.normalize_username(text) to anon, authenticated;

drop policy if exists "Public can read users" on public.user_profile;
drop policy if exists "Authenticated users can read profiles" on public.user_profile;
create policy "Public can read users"
on public.user_profile for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert themselves" on public.user_profile;
drop policy if exists "Users can insert their own profile" on public.user_profile;

drop policy if exists "Users can update themselves" on public.user_profile;
drop policy if exists "Users can update their own profile" on public.user_profile;
create policy "Users can update their own profile"
on public.user_profile for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function public.prevent_protected_user_profile_updates()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
    and (
      old.email is distinct from new.email
      or old.email_verified is distinct from new.email_verified
      or old.role is distinct from new.role
    )
  then
    raise exception 'Protected profile fields cannot be updated from the client';
  end if;

  return new;
end;
$$;

drop trigger if exists user_profile_prevent_protected_updates on public.user_profile;
create trigger user_profile_prevent_protected_updates
before update on public.user_profile
for each row execute function public.prevent_protected_user_profile_updates();

drop policy if exists "Users can view followers" on public.user_followers;
create policy "Users can view followers"
on public.user_followers for select
to authenticated
using (true);

drop policy if exists "Users can follow as themselves" on public.user_followers;
create policy "Users can follow as themselves"
on public.user_followers for insert
to authenticated
with check ((select auth.uid()) = follower_id);

drop policy if exists "Users can unfollow as themselves" on public.user_followers;
create policy "Users can unfollow as themselves"
on public.user_followers for delete
to authenticated
using ((select auth.uid()) = follower_id);

drop policy if exists "Users can read their saved places" on public.saved_places;
create policy "Users can read their saved places"
on public.saved_places for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can save places for themselves" on public.saved_places;
create policy "Users can save places for themselves"
on public.saved_places for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their saved places" on public.saved_places;
create policy "Users can update their saved places"
on public.saved_places for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their saved places" on public.saved_places;
create policy "Users can delete their saved places"
on public.saved_places for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Trip members can read trips" on public.trips;
create policy "Trip members can read trips"
on public.trips for select
to authenticated
using (public.is_trip_member(id));

drop policy if exists "Users can create their own trips" on public.trips;
create policy "Users can create their own trips"
on public.trips for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "Trip owners can update trips" on public.trips;
create policy "Trip owners can update trips"
on public.trips for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Trip owners can delete trips" on public.trips;
create policy "Trip owners can delete trips"
on public.trips for delete
to authenticated
using ((select auth.uid()) = owner_id);

notify pgrst, 'reload schema';
