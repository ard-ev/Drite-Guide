create extension if not exists "pgcrypto";

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_email_updated on auth.users;
drop trigger if exists on_auth_user_email_verified on auth.users;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_user_email_update() cascade;
drop function if exists public.sync_email_verified() cascade;

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

drop table if exists public._user_profile_migration_backup;
create table public._user_profile_migration_backup (
  usr_id text,
  auth_user_id uuid,
  first_name text,
  last_name text,
  email text,
  username text,
  profile_picture_path text,
  bio text,
  role text,
  preferred_language text,
  email_verified boolean,
  created_at timestamptz,
  updated_at timestamptz
);

do $$
begin
  if to_regclass('public.user_profile') is not null then
    insert into public._user_profile_migration_backup (
      usr_id,
      auth_user_id,
      first_name,
      last_name,
      email,
      username,
      profile_picture_path,
      role,
      preferred_language,
      email_verified,
      created_at,
      updated_at
    )
    select
      usr_id,
      auth_user_id,
      first_name,
      last_name,
      email,
      username,
      profile_picture_path,
      role,
      preferred_language,
      email_verified,
      created_at,
      updated_at
    from public.user_profile;
  end if;
end $$;

drop table if exists public._user_follows_migration_backup;
create table public._user_follows_migration_backup (
  follower_id text,
  following_id text,
  created_at timestamptz
);

do $$
begin
  if to_regclass('public.user_follows') is not null then
    insert into public._user_follows_migration_backup (
      follower_id,
      following_id,
      created_at
    )
    select follower_id, following_id, created_at
    from public.user_follows;
  end if;
end $$;

alter table if exists public.saved_places drop constraint if exists saved_places_user_id_fkey;
alter table if exists public.trips drop constraint if exists trips_owner_id_fkey;
alter table if exists public.places drop constraint if exists places_created_by_user_id_fkey;
drop table if exists public.user_follows cascade;
drop table if exists public.user_followers cascade;
drop table if exists public.user_profile cascade;
drop table if exists public.profiles cascade;
drop table if exists public.users cascade;

create table public.user_profile (
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

insert into public.user_profile (
  id,
  first_name,
  last_name,
  email,
  username,
  profile_picture_path,
  bio,
  role,
  preferred_language,
  email_verified,
  created_at,
  updated_at
)
select
  source.id,
  source.first_name,
  source.last_name,
  source.email,
  source.username,
  source.profile_picture_path,
  source.bio,
  source.role,
  source.preferred_language,
  source.email_verified,
  source.created_at,
  source.updated_at
from (
  select
    prepared.id,
    prepared.first_name,
    prepared.last_name,
    prepared.email,
    case
      when prepared.username_base !~ '^[a-z0-9_.]{3,30}$' then 'user' || substr(replace(prepared.id::text, '-', ''), 1, 12)
      when count(*) over (partition by prepared.username_base) = 1 then prepared.username_base
      else left(prepared.username_base, 21) || '_' || substr(replace(prepared.id::text, '-', ''), 1, 8)
    end as username,
    prepared.profile_picture_path,
    prepared.bio,
    prepared.role,
    prepared.preferred_language,
    prepared.email_verified,
    prepared.created_at,
    prepared.updated_at
  from (
    select distinct on (auth_users.id)
      auth_users.id,
      coalesce(nullif(btrim(backup.first_name), ''), '') as first_name,
      coalesce(nullif(btrim(backup.last_name), ''), '') as last_name,
      lower(coalesce(auth_users.email, backup.email)) as email,
      left(
        coalesce(
          nullif(
            regexp_replace(
              lower(
                coalesce(
                  nullif(btrim(backup.username), ''),
                  split_part(coalesce(auth_users.email, backup.email, auth_users.id::text), '@', 1),
                  'user'
                )
              ),
              '[^a-z0-9_.]+',
              '',
              'g'
            ),
            ''
          ),
          'user'
        ),
        30
      ) as username_base,
      backup.profile_picture_path,
      backup.bio,
      case when backup.role in ('user', 'admin') then backup.role else 'user' end as role,
      coalesce(nullif(btrim(backup.preferred_language), ''), 'en') as preferred_language,
      coalesce(backup.email_verified, auth_users.email_confirmed_at is not null, false) as email_verified,
      coalesce(backup.created_at, auth_users.created_at, now()) as created_at,
      coalesce(backup.updated_at, backup.created_at, auth_users.created_at, now()) as updated_at
    from auth.users auth_users
    left join public._user_profile_migration_backup backup
      on backup.auth_user_id = auth_users.id
    where auth_users.email is not null
    order by auth_users.id, backup.updated_at desc nulls last
  ) prepared
) source
on conflict (id) do nothing;

create unique index user_profile_normalized_username_key
  on public.user_profile (normalized_username);
create index user_profile_email_verified_idx
  on public.user_profile (email_verified);
create index user_profile_created_at_idx
  on public.user_profile (created_at desc);

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

revoke all on function public.normalize_username(text) from public;
grant execute on function public.normalize_username(text) to anon, authenticated;
revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

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
  v_first_name := coalesce(btrim(new.raw_user_meta_data ->> 'first_name'), '');
  v_last_name := coalesce(btrim(new.raw_user_meta_data ->> 'last_name'), '');
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
    email,
    username,
    first_name,
    last_name,
    preferred_language,
    email_verified
  )
  values (
    new.id,
    lower(new.email),
    v_username,
    v_first_name,
    v_last_name,
    coalesce(nullif(new.raw_user_meta_data ->> 'preferred_language', ''), 'en'),
    new.email_confirmed_at is not null
  );

  return new;
exception
  when unique_violation then
    raise exception 'Username already taken' using errcode = '23505';
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

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

create trigger on_auth_user_email_verified
after update of email, email_confirmed_at on auth.users
for each row
when (
  old.email is distinct from new.email
  or old.email_confirmed_at is distinct from new.email_confirmed_at
)
execute function public.sync_email_verified();

create table public.user_followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.user_profile(id) on delete cascade,
  following_id uuid not null references public.user_profile(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_followers_unique unique (follower_id, following_id),
  constraint user_followers_no_self_follow check (follower_id <> following_id)
);

create index user_followers_follower_id_idx
  on public.user_followers (follower_id);
create index user_followers_following_id_idx
  on public.user_followers (following_id);
create index user_followers_created_at_idx
  on public.user_followers (created_at desc);

insert into public.user_followers (follower_id, following_id, created_at)
select
  follower_profile.id,
  following_profile.id,
  coalesce(follows.created_at, now())
from public._user_follows_migration_backup follows
join public._user_profile_migration_backup follower_backup
  on follower_backup.usr_id = follows.follower_id
join public._user_profile_migration_backup following_backup
  on following_backup.usr_id = follows.following_id
join public.user_profile follower_profile
  on follower_profile.id = follower_backup.auth_user_id
join public.user_profile following_profile
  on following_profile.id = following_backup.auth_user_id
where follower_profile.id <> following_profile.id
on conflict (follower_id, following_id) do nothing;

do $$
begin
  if to_regclass('public.saved_places') is not null then
    alter table public.saved_places drop constraint if exists saved_places_pkey;
    alter table public.saved_places add column if not exists user_id_uuid uuid;

    update public.saved_places sp
    set user_id_uuid = sp.user_id::uuid
    where sp.user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    update public.saved_places sp
    set user_id_uuid = coalesce(sp.user_id_uuid, backup.auth_user_id)
    from public._user_profile_migration_backup backup
    where backup.usr_id = sp.user_id
       or backup.auth_user_id::text = sp.user_id;

    delete from public.saved_places where user_id_uuid is null;

    alter table public.saved_places drop column user_id;
    alter table public.saved_places rename column user_id_uuid to user_id;
    alter table public.saved_places alter column user_id set not null;
    alter table public.saved_places add constraint saved_places_pkey primary key (user_id, place_id);

    alter table public.saved_places
      add constraint saved_places_user_id_fkey
      foreign key (user_id) references public.user_profile(id) on delete cascade;
  end if;

  if to_regclass('public.trips') is not null then
    alter table public.trips add column if not exists owner_id_uuid uuid;

    update public.trips t
    set owner_id_uuid = t.owner_id::uuid
    where t.owner_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    update public.trips t
    set owner_id_uuid = coalesce(t.owner_id_uuid, backup.auth_user_id)
    from public._user_profile_migration_backup backup
    where backup.usr_id = t.owner_id
       or backup.auth_user_id::text = t.owner_id;

    delete from public.trips where owner_id_uuid is null;

    alter table public.trips drop column owner_id;
    alter table public.trips rename column owner_id_uuid to owner_id;
    alter table public.trips alter column owner_id set not null;

    alter table public.trips
      add constraint trips_owner_id_fkey
      foreign key (owner_id) references public.user_profile(id) on delete cascade;

    update public.trips t
    set members = coalesce(
      (
        select jsonb_agg(
          case
            when member_profile.auth_user_id is null then member
            else jsonb_set(
              member,
              '{user_id}',
              to_jsonb(member_profile.auth_user_id::text),
              true
            )
          end
          order by member_order
        )
        from jsonb_array_elements(t.members) with ordinality as expanded(member, member_order)
        left join public._user_profile_migration_backup member_profile
          on member_profile.usr_id = expanded.member ->> 'user_id'
          or member_profile.auth_user_id::text = expanded.member ->> 'user_id'
      ),
      '[]'::jsonb
    )
    where jsonb_typeof(t.members) = 'array';
  end if;

  if to_regclass('public.places') is not null then
    alter table public.places add column if not exists created_by_user_id_uuid uuid;

    update public.places p
    set created_by_user_id_uuid = p.created_by_user_id::uuid
    where p.created_by_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    update public.places p
    set created_by_user_id_uuid = coalesce(p.created_by_user_id_uuid, backup.auth_user_id)
    from public._user_profile_migration_backup backup
    where backup.usr_id = p.created_by_user_id
       or backup.auth_user_id::text = p.created_by_user_id;

    alter table public.places drop column created_by_user_id;
    alter table public.places rename column created_by_user_id_uuid to created_by_user_id;

    alter table public.places
      add constraint places_created_by_user_id_fkey
      foreign key (created_by_user_id) references public.user_profile(id) on delete set null;
  end if;
end $$;

drop function if exists public.current_app_user_id() cascade;
create or replace function public.current_app_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select auth.uid();
$$;

revoke all on function public.current_app_user_id() from public;
grant execute on function public.current_app_user_id() to authenticated;

create or replace function public.is_trip_owner(trip_uuid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.trips
    where id = trip_uuid
      and owner_id = public.current_app_user_id()
  );
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

revoke all on function public.is_trip_owner(uuid) from public;
grant execute on function public.is_trip_owner(uuid) to authenticated;
revoke all on function public.is_trip_member(uuid) from public;
grant execute on function public.is_trip_member(uuid) to authenticated;

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

drop policy if exists "Public can read users" on public.user_profile;
drop policy if exists "Profiles are readable" on public.user_profile;
drop policy if exists "Authenticated users can read profiles" on public.user_profile;
create policy "Authenticated users can read profiles"
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

drop policy if exists "Public can read follows" on public.user_followers;
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

drop table if exists public._user_profile_migration_backup;
drop table if exists public._user_follows_migration_backup;
