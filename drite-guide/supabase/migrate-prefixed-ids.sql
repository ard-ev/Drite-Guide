-- One-time migration for the public Drite Guide ID strategy.
-- Public IDs become:
--   profiles.id   -> usr_000001
--   categories.id -> cat_000001
--   cities.id     -> cty_000001
--   places.id     -> plc_000001
--
-- Supabase Auth stays unchanged: auth.users.id remains a UUID and is stored in
-- public.profiles.auth_user_id.

begin;

do $$
declare
  profile_id_type text;
begin
  select data_type into profile_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'id';

  if profile_id_type <> 'uuid' then
    raise exception 'Expected public.profiles.id to be uuid before migration, found %', profile_id_type;
  end if;
end;
$$;

create sequence if not exists public.user_id_seq as bigint start with 1;
create sequence if not exists public.category_id_seq as bigint start with 1;
create sequence if not exists public.city_id_seq as bigint start with 1;
create sequence if not exists public.place_id_seq as bigint start with 1;

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

create or replace function public.generate_profile_public_id()
returns text
language sql
volatile
set search_path = ''
as $$
  select public.generate_prefixed_id('usr', 'public.user_id_seq'::regclass);
$$;

create or replace function public.set_profile_public_id()
returns trigger
language plpgsql
as $$
begin
  if new.id is null or btrim(new.id) = '' then
    new.id := public.generate_profile_public_id();
  end if;

  return new;
end;
$$;

create or replace function public.set_category_public_id()
returns trigger
language plpgsql
as $$
begin
  if new.id is null or btrim(new.id) = '' then
    new.id := public.generate_prefixed_id(
      'cat',
      'public.category_id_seq'::regclass
    );
  end if;

  return new;
end;
$$;

create or replace function public.set_city_public_id()
returns trigger
language plpgsql
as $$
begin
  if new.id is null or btrim(new.id) = '' then
    new.id := public.generate_prefixed_id(
      'cty',
      'public.city_id_seq'::regclass
    );
  end if;

  return new;
end;
$$;

create or replace function public.set_place_public_id()
returns trigger
language plpgsql
as $$
begin
  if new.id is null or btrim(new.id) = '' then
    new.id := public.generate_prefixed_id(
      'plc',
      'public.place_id_seq'::regclass
    );
  end if;

  return new;
end;
$$;

create temporary table _profile_id_map on commit drop as
select
  id as old_id,
  'usr_' || lpad(row_number() over (order by created_at, ctid)::text, 6, '0') as new_id
from public.profiles;

create temporary table _category_id_map on commit drop as
select
  id as old_id,
  'cat_' || lpad(row_number() over (order by created_at, ctid)::text, 6, '0') as new_id
from public.categories;

create temporary table _city_id_map on commit drop as
select
  id as old_id,
  'cty_' || lpad(row_number() over (order by created_at, ctid)::text, 6, '0') as new_id
from public.cities;

create temporary table _place_id_map on commit drop as
select
  id as old_id,
  'plc_' || lpad(row_number() over (order by created_at, ctid)::text, 6, '0') as new_id
from public.places;

create table if not exists public.id_migration_map (
  id bigserial primary key,
  entity_type text not null check (
    entity_type in ('profiles', 'categories', 'cities', 'places')
  ),
  old_id text not null,
  new_id text not null,
  migrated_at timestamptz not null default now(),
  unique (entity_type, old_id),
  unique (entity_type, new_id)
);

alter table public.id_migration_map enable row level security;
revoke all on public.id_migration_map from anon, authenticated;

delete from public.id_migration_map
where entity_type in ('profiles', 'categories', 'cities', 'places');

insert into public.id_migration_map (entity_type, old_id, new_id)
select 'profiles', old_id::text, new_id from _profile_id_map
union all
select 'categories', old_id::text, new_id from _category_id_map
union all
select 'cities', old_id::text, new_id from _city_id_map
union all
select 'places', old_id::text, new_id from _place_id_map;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'categories',
        'cities',
        'places',
        'place_images',
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

drop function if exists public.is_trip_owner(uuid);
drop function if exists public.is_trip_member(uuid);
drop function if exists public.current_profile_id();

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select
      constraint_namespace.nspname as schema_name,
      constraint_table.relname as table_name,
      pg_constraint.conname as constraint_name
    from pg_constraint
    join pg_class constraint_table
      on constraint_table.oid = pg_constraint.conrelid
    join pg_namespace constraint_namespace
      on constraint_namespace.oid = constraint_table.relnamespace
    left join pg_class referenced_table
      on referenced_table.oid = pg_constraint.confrelid
    left join pg_namespace referenced_namespace
      on referenced_namespace.oid = referenced_table.relnamespace
    where pg_constraint.contype = 'f'
      and constraint_namespace.nspname = 'public'
      and (
        constraint_table.relname in (
          'profiles',
          'places',
          'place_images',
          'saved_places',
          'user_follows',
          'trips',
          'trip_members',
          'trip_places'
        )
        or (
          referenced_namespace.nspname = 'public'
          and referenced_table.relname in (
            'profiles',
            'categories',
            'cities',
            'places'
          )
        )
      )
  loop
    execute format(
      'alter table %I.%I drop constraint if exists %I',
      constraint_record.schema_name,
      constraint_record.table_name,
      constraint_record.constraint_name
    );
  end loop;
end;
$$;

alter table if exists public.profiles drop constraint if exists profiles_pkey;
alter table if exists public.categories drop constraint if exists categories_pkey;
alter table if exists public.cities drop constraint if exists cities_pkey;
alter table if exists public.places drop constraint if exists places_pkey;
alter table if exists public.places drop constraint if exists uq_places_city_name_address;
alter table if exists public.place_images drop constraint if exists place_images_place_sort_unique;
alter table if exists public.saved_places drop constraint if exists saved_places_pkey;
alter table if exists public.user_follows drop constraint if exists user_follows_pkey;
alter table if exists public.user_follows drop constraint if exists user_follows_no_self_follow;
alter table if exists public.trip_members drop constraint if exists trip_members_trip_user_unique;
alter table if exists public.trip_places drop constraint if exists trip_places_trip_place_unique;
alter table if exists public.profiles drop constraint if exists profiles_id_format_check;
alter table if exists public.categories drop constraint if exists categories_id_format_check;
alter table if exists public.cities drop constraint if exists cities_id_format_check;
alter table if exists public.places drop constraint if exists places_id_format_check;

alter table public.profiles add column if not exists auth_user_id uuid;
update public.profiles
set auth_user_id = id
where auth_user_id is null;

alter table public.profiles add column _new_id text;
update public.profiles
set _new_id = _profile_id_map.new_id
from _profile_id_map
where public.profiles.id = _profile_id_map.old_id;

alter table public.categories add column _new_id text;
update public.categories
set _new_id = _category_id_map.new_id
from _category_id_map
where public.categories.id = _category_id_map.old_id;

alter table public.cities add column _new_id text;
update public.cities
set _new_id = _city_id_map.new_id
from _city_id_map
where public.cities.id = _city_id_map.old_id;

alter table public.places add column _new_id text;
alter table public.places add column _new_category_id text;
alter table public.places add column _new_city_id text;
alter table public.places add column _new_created_by_user_id text;

update public.places
set _new_id = _place_id_map.new_id
from _place_id_map
where public.places.id = _place_id_map.old_id;

update public.places
set _new_category_id = _category_id_map.new_id
from _category_id_map
where public.places.category_id = _category_id_map.old_id;

update public.places
set _new_city_id = _city_id_map.new_id
from _city_id_map
where public.places.city_id = _city_id_map.old_id;

update public.places
set _new_created_by_user_id = _profile_id_map.new_id
from _profile_id_map
where public.places.created_by_user_id = _profile_id_map.old_id;

alter table public.place_images add column _new_place_id text;
update public.place_images
set _new_place_id = _place_id_map.new_id
from _place_id_map
where public.place_images.place_id = _place_id_map.old_id;

alter table public.saved_places add column _new_user_id text;
alter table public.saved_places add column _new_place_id text;
update public.saved_places
set _new_user_id = _profile_id_map.new_id
from _profile_id_map
where public.saved_places.user_id = _profile_id_map.old_id;
update public.saved_places
set _new_place_id = _place_id_map.new_id
from _place_id_map
where public.saved_places.place_id = _place_id_map.old_id;

alter table public.user_follows add column _new_follower_id text;
alter table public.user_follows add column _new_following_id text;
update public.user_follows
set _new_follower_id = _profile_id_map.new_id
from _profile_id_map
where public.user_follows.follower_id = _profile_id_map.old_id;
update public.user_follows
set _new_following_id = _profile_id_map.new_id
from _profile_id_map
where public.user_follows.following_id = _profile_id_map.old_id;

alter table public.trips add column _new_owner_id text;
update public.trips
set _new_owner_id = _profile_id_map.new_id
from _profile_id_map
where public.trips.owner_id = _profile_id_map.old_id;

alter table public.trip_members add column _new_user_id text;
alter table public.trip_members add column _new_invited_by_user_id text;
update public.trip_members
set _new_user_id = _profile_id_map.new_id
from _profile_id_map
where public.trip_members.user_id = _profile_id_map.old_id;
update public.trip_members
set _new_invited_by_user_id = _profile_id_map.new_id
from _profile_id_map
where public.trip_members.invited_by_user_id = _profile_id_map.old_id;

alter table public.trip_places add column _new_place_id text;
update public.trip_places
set _new_place_id = _place_id_map.new_id
from _place_id_map
where public.trip_places.place_id = _place_id_map.old_id;

do $$
begin
  if exists (select 1 from public.profiles where _new_id is null) then
    raise exception 'profiles ID migration left null IDs';
  end if;
  if exists (select 1 from public.categories where _new_id is null) then
    raise exception 'categories ID migration left null IDs';
  end if;
  if exists (select 1 from public.cities where _new_id is null) then
    raise exception 'cities ID migration left null IDs';
  end if;
  if exists (select 1 from public.places where _new_id is null or _new_category_id is null or _new_city_id is null) then
    raise exception 'places ID migration left null IDs';
  end if;
  if exists (select 1 from public.places where created_by_user_id is not null and _new_created_by_user_id is null) then
    raise exception 'places ID migration left unmapped created_by_user_id values';
  end if;
  if exists (select 1 from public.place_images where _new_place_id is null) then
    raise exception 'place_images ID migration left null place IDs';
  end if;
  if exists (select 1 from public.saved_places where _new_user_id is null or _new_place_id is null) then
    raise exception 'saved_places ID migration left null IDs';
  end if;
  if exists (select 1 from public.user_follows where _new_follower_id is null or _new_following_id is null) then
    raise exception 'user_follows ID migration left null IDs';
  end if;
  if exists (select 1 from public.trips where _new_owner_id is null) then
    raise exception 'trips ID migration left null owner IDs';
  end if;
  if exists (select 1 from public.trip_members where _new_user_id is null) then
    raise exception 'trip_members ID migration left null user IDs';
  end if;
  if exists (select 1 from public.trip_members where invited_by_user_id is not null and _new_invited_by_user_id is null) then
    raise exception 'trip_members ID migration left unmapped invited_by_user_id values';
  end if;
  if exists (select 1 from public.trip_places where _new_place_id is null) then
    raise exception 'trip_places ID migration left null place IDs';
  end if;
end;
$$;

alter table public.saved_places drop column user_id;
alter table public.saved_places drop column place_id;
alter table public.saved_places rename column _new_user_id to user_id;
alter table public.saved_places rename column _new_place_id to place_id;

alter table public.user_follows drop column follower_id;
alter table public.user_follows drop column following_id;
alter table public.user_follows rename column _new_follower_id to follower_id;
alter table public.user_follows rename column _new_following_id to following_id;

alter table public.trips drop column owner_id;
alter table public.trips rename column _new_owner_id to owner_id;

alter table public.trip_members drop column user_id;
alter table public.trip_members drop column invited_by_user_id;
alter table public.trip_members rename column _new_user_id to user_id;
alter table public.trip_members rename column _new_invited_by_user_id to invited_by_user_id;

alter table public.trip_places drop column place_id;
alter table public.trip_places rename column _new_place_id to place_id;

alter table public.place_images drop column place_id;
alter table public.place_images rename column _new_place_id to place_id;

alter table public.places drop column id;
alter table public.places drop column category_id;
alter table public.places drop column city_id;
alter table public.places drop column created_by_user_id;
alter table public.places rename column _new_id to id;
alter table public.places rename column _new_category_id to category_id;
alter table public.places rename column _new_city_id to city_id;
alter table public.places rename column _new_created_by_user_id to created_by_user_id;

alter table public.categories drop column id;
alter table public.categories rename column _new_id to id;

alter table public.cities drop column id;
alter table public.cities rename column _new_id to id;

alter table public.profiles drop column id;
alter table public.profiles rename column _new_id to id;

alter table public.profiles alter column id set not null;
alter table public.profiles alter column id set default public.generate_profile_public_id();
alter table public.profiles alter column auth_user_id set not null;
alter table public.categories alter column id set not null;
alter table public.cities alter column id set not null;
alter table public.places alter column id set not null;
alter table public.places alter column category_id set not null;
alter table public.places alter column city_id set not null;
alter table public.place_images alter column place_id set not null;
alter table public.saved_places alter column user_id set not null;
alter table public.saved_places alter column place_id set not null;
alter table public.user_follows alter column follower_id set not null;
alter table public.user_follows alter column following_id set not null;
alter table public.trips alter column owner_id set not null;
alter table public.trip_members alter column user_id set not null;
alter table public.trip_places alter column place_id set not null;

alter table public.profiles add constraint profiles_pkey primary key (id);
alter table public.profiles add constraint profiles_auth_user_id_key unique (auth_user_id);
alter table public.profiles add constraint profiles_id_format_check check (id ~ '^usr_[0-9]{6}$');

alter table public.categories add constraint categories_pkey primary key (id);
alter table public.categories add constraint categories_id_format_check check (id ~ '^cat_[0-9]{6}$');

alter table public.cities add constraint cities_pkey primary key (id);
alter table public.cities add constraint cities_id_format_check check (id ~ '^cty_[0-9]{6}$');

alter table public.places add constraint places_pkey primary key (id);
alter table public.places add constraint places_id_format_check check (id ~ '^plc_[0-9]{6}$');
alter table public.places add constraint uq_places_city_name_address unique (city_id, name, address);

alter table public.place_images
  add constraint place_images_place_sort_unique unique (place_id, sort_order);

alter table public.saved_places add constraint saved_places_pkey primary key (user_id, place_id);
alter table public.user_follows add constraint user_follows_pkey primary key (follower_id, following_id);
alter table public.user_follows
  add constraint user_follows_no_self_follow check (follower_id <> following_id);
alter table public.trip_members
  add constraint trip_members_trip_user_unique unique (trip_id, user_id);
alter table public.trip_places
  add constraint trip_places_trip_place_unique unique (trip_id, place_id);

alter table public.profiles
  add constraint profiles_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users(id) on delete cascade;
alter table public.places
  add constraint places_category_id_fkey
  foreign key (category_id) references public.categories(id) on delete restrict;
alter table public.places
  add constraint places_city_id_fkey
  foreign key (city_id) references public.cities(id) on delete restrict;
alter table public.places
  add constraint places_created_by_user_id_fkey
  foreign key (created_by_user_id) references public.profiles(id) on delete set null;
alter table public.place_images
  add constraint place_images_place_id_fkey
  foreign key (place_id) references public.places(id) on delete cascade;
alter table public.saved_places
  add constraint saved_places_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.saved_places
  add constraint saved_places_place_id_fkey
  foreign key (place_id) references public.places(id) on delete cascade;
alter table public.user_follows
  add constraint user_follows_follower_id_fkey
  foreign key (follower_id) references public.profiles(id) on delete cascade;
alter table public.user_follows
  add constraint user_follows_following_id_fkey
  foreign key (following_id) references public.profiles(id) on delete cascade;
alter table public.trips
  add constraint trips_owner_id_fkey
  foreign key (owner_id) references public.profiles(id) on delete cascade;
alter table public.trip_members
  add constraint trip_members_trip_id_fkey
  foreign key (trip_id) references public.trips(id) on delete cascade;
alter table public.trip_members
  add constraint trip_members_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.trip_members
  add constraint trip_members_invited_by_user_id_fkey
  foreign key (invited_by_user_id) references public.profiles(id) on delete set null;
alter table public.trip_places
  add constraint trip_places_trip_id_fkey
  foreign key (trip_id) references public.trips(id) on delete cascade;
alter table public.trip_places
  add constraint trip_places_place_id_fkey
  foreign key (place_id) references public.places(id) on delete cascade;

create index if not exists profiles_auth_user_id_idx on public.profiles (auth_user_id);
create index if not exists places_city_id_idx on public.places (city_id);
create index if not exists places_category_id_idx on public.places (category_id);
create index if not exists place_images_place_id_idx on public.place_images (place_id);
create index if not exists saved_places_user_id_idx on public.saved_places (user_id);
create index if not exists saved_places_place_id_idx on public.saved_places (place_id);
create index if not exists user_follows_follower_id_idx on public.user_follows (follower_id);
create index if not exists user_follows_following_id_idx on public.user_follows (following_id);
create index if not exists trips_owner_id_idx on public.trips (owner_id);
create index if not exists trip_members_trip_id_idx on public.trip_members (trip_id);
create index if not exists trip_members_user_id_idx on public.trip_members (user_id);
create index if not exists trip_places_trip_id_idx on public.trip_places (trip_id);
create index if not exists trip_places_place_id_idx on public.trip_places (place_id);

drop trigger if exists profiles_set_public_id on public.profiles;
create trigger profiles_set_public_id
before insert on public.profiles
for each row execute function public.set_profile_public_id();

drop trigger if exists categories_set_readable_id on public.categories;
drop trigger if exists categories_set_public_id on public.categories;
create trigger categories_set_public_id
before insert on public.categories
for each row execute function public.set_category_public_id();

drop trigger if exists cities_set_readable_id on public.cities;
drop trigger if exists cities_set_public_id on public.cities;
create trigger cities_set_public_id
before insert on public.cities
for each row execute function public.set_city_public_id();

drop trigger if exists places_set_readable_id on public.places;
drop trigger if exists places_set_public_id on public.places;
create trigger places_set_public_id
before insert on public.places
for each row execute function public.set_place_public_id();

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
    from public.profiles
    where username = candidate_username
      and auth_user_id <> new.id
  ) loop
    suffix := suffix + 1;
    candidate_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (
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
  on conflict (auth_user_id) do update
  set
    email = excluded.email,
    email_verified = excluded.email_verified,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    email = lower(new.email),
    email_verified = new.email_confirmed_at is not null,
    updated_at = now()
  where auth_user_id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email, email_confirmed_at on auth.users
for each row
execute function public.handle_user_email_update();

create or replace function public.current_profile_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where auth_user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_profile_id() from public;
grant execute on function public.current_profile_id() to authenticated;

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
      and owner_id = public.current_profile_id()
  );
$$;

revoke all on function public.is_trip_owner(uuid) from public;
grant execute on function public.is_trip_owner(uuid) to authenticated;

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
      and owner_id = public.current_profile_id()
  )
  or exists (
    select 1
    from public.trip_members
    where trip_id = trip_uuid
      and user_id = public.current_profile_id()
  );
$$;

revoke all on function public.is_trip_member(uuid) from public;
grant execute on function public.is_trip_member(uuid) to authenticated;

grant usage on schema public to anon, authenticated;
grant usage, select on sequence public.user_id_seq to authenticated;
grant usage, select on sequence public.category_id_seq to authenticated;
grant usage, select on sequence public.city_id_seq to authenticated;
grant usage, select on sequence public.place_id_seq to authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.cities to anon, authenticated;
grant select on public.places to anon, authenticated;
grant select on public.place_images to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.saved_places to authenticated;
grant select, insert, delete on public.user_follows to authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.trip_members to authenticated;
grant select, insert, update, delete on public.trip_places to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.cities enable row level security;
alter table public.places enable row level security;
alter table public.place_images enable row level security;
alter table public.saved_places enable row level security;
alter table public.user_follows enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_places enable row level security;

create policy "Public can read profiles"
on public.profiles for select
using (true);

create policy "Users can insert their own profile"
on public.profiles for insert
with check ((select auth.uid()) = auth_user_id);

create policy "Users can update their own profile"
on public.profiles for update
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);

create policy "Public can read categories"
on public.categories for select
using (deleted_at is null);

create policy "Public can read cities"
on public.cities for select
using (deleted_at is null);

create policy "Public can read places"
on public.places for select
using (deleted_at is null);

create policy "Public can read place images"
on public.place_images for select
using (true);

create policy "Users can read their saved places"
on public.saved_places for select
using (public.current_profile_id() = user_id);

create policy "Users can save places for themselves"
on public.saved_places for insert
with check (public.current_profile_id() = user_id);

create policy "Users can update their saved places"
on public.saved_places for update
using (public.current_profile_id() = user_id)
with check (public.current_profile_id() = user_id);

create policy "Users can delete their saved places"
on public.saved_places for delete
using (public.current_profile_id() = user_id);

create policy "Public can read follows"
on public.user_follows for select
using (true);

create policy "Users can follow as themselves"
on public.user_follows for insert
with check (public.current_profile_id() = follower_id);

create policy "Users can unfollow as themselves"
on public.user_follows for delete
using (public.current_profile_id() = follower_id);

create policy "Trip members can read trips"
on public.trips for select
using (public.is_trip_member(id));

create policy "Users can create their own trips"
on public.trips for insert
with check (public.current_profile_id() = owner_id);

create policy "Trip owners can update trips"
on public.trips for update
using (public.current_profile_id() = owner_id)
with check (public.current_profile_id() = owner_id);

create policy "Trip owners can delete trips"
on public.trips for delete
using (public.current_profile_id() = owner_id);

create policy "Trip members can read trip members"
on public.trip_members for select
using (public.is_trip_member(trip_id));

create policy "Trip owners can add trip members"
on public.trip_members for insert
with check (public.is_trip_owner(trip_id) or public.current_profile_id() = user_id);

create policy "Trip owners can update trip members"
on public.trip_members for update
using (public.is_trip_owner(trip_id))
with check (public.is_trip_owner(trip_id));

create policy "Trip owners and members can delete memberships"
on public.trip_members for delete
using (public.is_trip_owner(trip_id) or public.current_profile_id() = user_id);

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
  and (storage.foldername(name))[1] = public.current_profile_id()
);

drop policy if exists "Users can update their profile pictures" on storage.objects;
create policy "Users can update their profile pictures"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = public.current_profile_id()
)
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = public.current_profile_id()
);

drop policy if exists "Users can delete their profile pictures" on storage.objects;
create policy "Users can delete their profile pictures"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = public.current_profile_id()
);

with max_ids as (
  select max((substring(id from '[0-9]+$'))::bigint) as max_id from public.profiles
)
select setval('public.user_id_seq', coalesce(max_id, 1), max_id is not null)
from max_ids;

with max_ids as (
  select max((substring(id from '[0-9]+$'))::bigint) as max_id from public.categories
)
select setval('public.category_id_seq', coalesce(max_id, 1), max_id is not null)
from max_ids;

with max_ids as (
  select max((substring(id from '[0-9]+$'))::bigint) as max_id from public.cities
)
select setval('public.city_id_seq', coalesce(max_id, 1), max_id is not null)
from max_ids;

with max_ids as (
  select max((substring(id from '[0-9]+$'))::bigint) as max_id from public.places
)
select setval('public.place_id_seq', coalesce(max_id, 1), max_id is not null)
from max_ids;

commit;
