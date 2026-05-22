-- One-time migration: keep a single app user table in public.users.
-- Supabase Auth remains in auth.users and is not removed.
-- This preserves public.profiles data before removing public.profiles.

begin;

create sequence if not exists public.user_id_seq as bigint start with 1;

create or replace function public.generate_prefixed_id(
  id_prefix text,
  sequence_name regclass
)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  next_number bigint;
begin
  next_number := nextval(sequence_name);
  return id_prefix || '_' || lpad(next_number::text, 6, '0');
end;
$$;

create or replace function public.generate_user_public_id()
returns text
language sql
volatile
set search_path = ''
as $$
  select public.generate_prefixed_id('usr', 'public.user_id_seq'::regclass);
$$;

create or replace function public.set_user_public_id()
returns trigger
language plpgsql
as $$
begin
  if new.id is null or btrim(new.id) = '' then
    new.id := public.generate_user_public_id();
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.profiles') is null
     and to_regclass('public.users') is null then
    raise exception 'Neither public.profiles nor public.users exists.';
  end if;

  if to_regclass('public.profiles') is not null
     and to_regclass('public.users') is null then
    alter table public.profiles rename to users;
  elsif to_regclass('public.profiles') is not null
        and to_regclass('public.users') is not null then
    insert into public.users (
      id,
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
      id,
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
    from public.profiles
    on conflict (id) do update
    set
      auth_user_id = excluded.auth_user_id,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      username = excluded.username,
      profile_picture_path = excluded.profile_picture_path,
      role = excluded.role,
      preferred_language = excluded.preferred_language,
      email_verified = excluded.email_verified,
      updated_at = greatest(public.users.updated_at, excluded.updated_at);
  end if;
end;
$$;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'users',
        'profiles',
        'saved_places',
        'user_follows',
        'trips',
        'trip_members',
        'trip_places'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

drop trigger if exists profiles_set_public_id on public.users;
drop trigger if exists users_set_public_id on public.users;
create trigger users_set_public_id
before insert on public.users
for each row execute function public.set_user_public_id();

drop trigger if exists profiles_set_updated_at on public.users;
drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

alter table if exists public.users drop constraint if exists profiles_id_format_check;
alter table if exists public.users drop constraint if exists users_id_format_check;
do $$
begin
  if exists (
    select 1
    from public.users
    where id !~ '^usr_[0-9]{6}$'
  ) then
    raise exception 'public.users contains non-prefixed IDs. Run supabase/migrate-prefixed-ids.sql before this migration.';
  end if;
end;
$$;
alter table public.users add constraint users_id_format_check check (id ~ '^usr_[0-9]{6}$');

alter table if exists public.users drop constraint if exists profiles_auth_user_id_key;
alter table if exists public.users drop constraint if exists users_auth_user_id_key;
alter table if exists public.users drop constraint if exists profiles_auth_user_id_fkey;
alter table if exists public.users drop constraint if exists users_auth_user_id_fkey;
alter table if exists public.places drop constraint if exists places_created_by_user_id_fkey;
alter table if exists public.saved_places drop constraint if exists saved_places_user_id_fkey;
alter table if exists public.user_follows drop constraint if exists user_follows_follower_id_fkey;
alter table if exists public.user_follows drop constraint if exists user_follows_following_id_fkey;
alter table if exists public.trips drop constraint if exists trips_owner_id_fkey;
alter table if exists public.trip_members drop constraint if exists trip_members_user_id_fkey;
alter table if exists public.trip_members drop constraint if exists trip_members_invited_by_user_id_fkey;

alter table public.users
  alter column id set default public.generate_user_public_id();
alter table public.users
  add constraint users_auth_user_id_key unique (auth_user_id);
alter table public.users
  add constraint users_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users(id) on delete cascade;
alter table public.places
  add constraint places_created_by_user_id_fkey
  foreign key (created_by_user_id) references public.users(id) on delete set null;
alter table public.saved_places
  add constraint saved_places_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;
alter table public.user_follows
  add constraint user_follows_follower_id_fkey
  foreign key (follower_id) references public.users(id) on delete cascade;
alter table public.user_follows
  add constraint user_follows_following_id_fkey
  foreign key (following_id) references public.users(id) on delete cascade;
alter table public.trips
  add constraint trips_owner_id_fkey
  foreign key (owner_id) references public.users(id) on delete cascade;
alter table public.trip_members
  add constraint trip_members_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;
alter table public.trip_members
  add constraint trip_members_invited_by_user_id_fkey
  foreign key (invited_by_user_id) references public.users(id) on delete set null;

drop policy if exists "Users can upload their profile pictures" on storage.objects;
drop policy if exists "Users can update their profile pictures" on storage.objects;
drop policy if exists "Users can delete their profile pictures" on storage.objects;

drop function if exists public.current_profile_id();

create or replace function public.current_app_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.users
  where auth_user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_app_user_id() from public;
grant execute on function public.current_app_user_id() to authenticated;

create or replace function public.is_trip_owner(trip_uuid uuid)
returns boolean
language sql
stable
security definer
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
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trips
    where id = trip_uuid
      and owner_id = public.current_app_user_id()
  )
  or exists (
    select 1
    from public.trip_members
    where trip_id = trip_uuid
      and user_id = public.current_app_user_id()
  );
$$;

revoke all on function public.is_trip_owner(uuid) from public;
revoke all on function public.is_trip_member(uuid) from public;
grant execute on function public.is_trip_owner(uuid) to authenticated;
grant execute on function public.is_trip_member(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate_username text;
  suffix integer := 0;
begin
  base_username := lower(
    regexp_replace(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
        split_part(coalesce(new.email, ''), '@', 1),
        'user'
      ),
      '[^a-z0-9._-]+',
      '',
      'g'
    )
  );
  base_username := left(coalesce(nullif(base_username, ''), 'user'), 28);
  candidate_username := base_username;

  while exists (
    select 1
    from public.users
    where username = candidate_username
      and auth_user_id <> new.id
  ) loop
    suffix := suffix + 1;
    candidate_username := base_username || suffix::text;
  end loop;

  insert into public.users (
    auth_user_id,
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
    candidate_username,
    coalesce(new.raw_user_meta_data ->> 'preferred_language', 'en'),
    new.email_confirmed_at is not null
  )
  on conflict (auth_user_id) do update set
    email = excluded.email,
    email_verified = excluded.email_verified,
    updated_at = now();

  return new;
end;
$$;

create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set
    email = lower(new.email),
    email_verified = new.email_confirmed_at is not null,
    updated_at = now()
  where auth_user_id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email, email_confirmed_at on auth.users
for each row execute function public.handle_user_email_update();

grant select on public.users to anon, authenticated;
grant select, insert, update on public.users to authenticated;
grant usage, select on sequence public.user_id_seq to authenticated;
alter table public.users enable row level security;

insert into storage.buckets (id, name, public)
values
  ('app-media', 'app-media', true),
  ('category-images', 'category-images', true),
  ('city-images', 'city-images', true),
  ('place-images', 'place-images', true),
  ('profile-pictures', 'profile-pictures', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read app media" on storage.objects;
create policy "Public can read app media"
on storage.objects for select
using (
  bucket_id in (
    'app-media',
    'category-images',
    'city-images',
    'place-images',
    'profile-pictures'
  )
);

create policy "Public can read users"
on public.users for select
using (true);

create policy "Users can insert themselves"
on public.users for insert
with check ((select auth.uid()) = auth_user_id);

create policy "Users can update themselves"
on public.users for update
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);

create policy "Users can read their saved places"
on public.saved_places for select
using (public.current_app_user_id() = user_id);

create policy "Users can save places for themselves"
on public.saved_places for insert
with check (public.current_app_user_id() = user_id);

create policy "Users can update their saved places"
on public.saved_places for update
using (public.current_app_user_id() = user_id)
with check (public.current_app_user_id() = user_id);

create policy "Users can delete their saved places"
on public.saved_places for delete
using (public.current_app_user_id() = user_id);

create policy "Public can read follows"
on public.user_follows for select
using (true);

create policy "Users can follow as themselves"
on public.user_follows for insert
with check (public.current_app_user_id() = follower_id);

create policy "Users can unfollow as themselves"
on public.user_follows for delete
using (public.current_app_user_id() = follower_id);

create policy "Trip members can read trips"
on public.trips for select
using (public.is_trip_member(id));

create policy "Users can create their own trips"
on public.trips for insert
with check (public.current_app_user_id() = owner_id);

create policy "Trip owners can update trips"
on public.trips for update
using (public.current_app_user_id() = owner_id)
with check (public.current_app_user_id() = owner_id);

create policy "Trip owners can delete trips"
on public.trips for delete
using (public.current_app_user_id() = owner_id);

create policy "Trip members can read trip members"
on public.trip_members for select
using (public.is_trip_member(trip_id));

create policy "Trip owners can add trip members"
on public.trip_members for insert
with check (public.is_trip_owner(trip_id) or public.current_app_user_id() = user_id);

create policy "Trip owners can update trip members"
on public.trip_members for update
using (public.is_trip_owner(trip_id))
with check (public.is_trip_owner(trip_id));

create policy "Trip owners and members can delete memberships"
on public.trip_members for delete
using (public.is_trip_owner(trip_id) or public.current_app_user_id() = user_id);

create policy "Trip members can read trip places"
on public.trip_places for select
using (public.is_trip_member(trip_id));

create policy "Trip owners can add trip places"
on public.trip_places for insert
with check (public.is_trip_owner(trip_id));

create policy "Trip owners can update trip places"
on public.trip_places for update
using (public.is_trip_owner(trip_id))
with check (public.is_trip_owner(trip_id));

create policy "Trip owners can delete trip places"
on public.trip_places for delete
using (public.is_trip_owner(trip_id));

drop policy if exists "Users can upload their profile pictures" on storage.objects;
create policy "Users can upload their profile pictures"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = public.current_app_user_id()
);

drop policy if exists "Users can update their profile pictures" on storage.objects;
create policy "Users can update their profile pictures"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = public.current_app_user_id()
)
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = public.current_app_user_id()
);

drop policy if exists "Users can delete their profile pictures" on storage.objects;
create policy "Users can delete their profile pictures"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = public.current_app_user_id()
);

do $$
begin
  if to_regclass('public.id_migration_map') is not null then
    alter table public.id_migration_map
      drop constraint if exists id_migration_map_entity_type_check;
    update public.id_migration_map
    set entity_type = 'users'
    where entity_type = 'profiles';
    alter table public.id_migration_map
      add constraint id_migration_map_entity_type_check check (
        entity_type in ('users', 'categories', 'cities', 'places')
      );
  end if;
end;
$$;

drop table if exists public.profiles;

commit;
