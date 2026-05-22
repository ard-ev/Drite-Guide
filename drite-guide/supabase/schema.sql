-- Drite Guide Supabase schema
-- Run this in the Supabase SQL editor before pointing the app at the project.

create extension if not exists "pgcrypto";

create sequence if not exists public.user_id_seq as bigint start with 1;
create sequence if not exists public.category_id_seq as bigint start with 1;
create sequence if not exists public.city_id_seq as bigint start with 1;
create sequence if not exists public.place_id_seq as bigint start with 1;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_strong_signup_password(password_value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    length(password_value) >= 8
    and password_value ~ '[A-Z]'
    and password_value ~ '[0-9]',
    false
  );
$$;

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

create table if not exists public.users (
  id text primary key default public.generate_user_public_id()
    check (id ~ '^usr_[0-9]{6}$'),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null unique,
  username text not null unique,
  profile_picture_path text,
  role text not null default 'user' check (role in ('user', 'admin')),
  preferred_language text not null default 'en',
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.users.profile_picture_path is
  'User photo stored in the public profile-pictures bucket. Store either the object path, a profile-pictures/... storage path, or a full image URL.';

create table if not exists public.signup_attempts (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key check (id ~ '^cat_[0-9]{6}$'),
  name text not null,
  image_path text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.categories.image_path is
  'Category image stored in the public category-images bucket. Store either the object path, a supabase://category-images/... reference, a category-images/... storage path, or a full image URL.';

create table if not exists public.cities (
  id text primary key check (id ~ '^cty_[0-9]{6}$'),
  city_name text not null,
  image_path text,
  hero_image_path text,
  location_text text,
  latitude double precision,
  longitude double precision,
  description text,
  is_featured boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.places (
  id text primary key check (id ~ '^plc_[0-9]{6}$'),
  category_id text not null references public.categories(id) on delete restrict,
  city_id text not null references public.cities(id) on delete restrict,
  name text not null,
  description text,
  address text,
  google_maps_link text,
  latitude double precision,
  longitude double precision,
  main_image_path text,
  phone text,
  website text,
  opening_hours jsonb,
  rating_average numeric(3, 2) not null default 0,
  ratings_count integer not null default 0,
  is_featured boolean not null default false,
  created_by_user_id text references public.users(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_places_city_name_address unique (city_id, name, address)
);

create table if not exists public.place_images (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references public.places(id) on delete cascade,
  image_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint place_images_place_sort_unique unique (place_id, sort_order)
);

comment on column public.places.main_image_path is
  'Main place photo. Use a full https URL, a supabase://place-images/... reference, or a place-images/... storage path.';
comment on column public.place_images.image_path is
  'Place gallery photo. Use a full https URL, a supabase://place-images/... reference, or a place-images/... storage path.';

create table if not exists public.saved_places (
  user_id text not null references public.users(id) on delete cascade,
  place_id text not null references public.places(id) on delete cascade,
  priority integer,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table if not exists public.user_follows (
  follower_id text not null references public.users(id) on delete cascade,
  following_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint user_follows_no_self_follow check (follower_id <> following_id)
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  start_date date not null,
  end_date date not null,
  shared_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_valid_date_range check (end_date >= start_date)
);

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'invited' check (status in ('invited', 'accepted')),
  invited_by_user_id text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_members_trip_user_unique unique (trip_id, user_id)
);

create table if not exists public.trip_places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  place_id text not null references public.places(id) on delete cascade,
  visit_date date,
  visit_start_time time,
  visit_end_time time,
  note text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_places_trip_place_unique unique (trip_id, place_id)
);

create index if not exists categories_name_idx on public.categories (name);
create index if not exists users_auth_user_id_idx on public.users (auth_user_id);
create index if not exists signup_attempts_email_created_at_idx
  on public.signup_attempts (email_hash, created_at desc);
create index if not exists signup_attempts_ip_created_at_idx
  on public.signup_attempts (ip_hash, created_at desc);
create index if not exists cities_city_name_idx on public.cities (city_name);
create index if not exists places_city_id_idx on public.places (city_id);
create index if not exists places_category_id_idx on public.places (category_id);
create index if not exists places_name_idx on public.places (name);
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

drop trigger if exists users_set_public_id on public.users;
create trigger users_set_public_id
before insert on public.users
for each row execute function public.set_user_public_id();

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

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists cities_set_updated_at on public.cities;
create trigger cities_set_updated_at
before update on public.cities
for each row execute function public.set_updated_at();

drop trigger if exists places_set_updated_at on public.places;
create trigger places_set_updated_at
before update on public.places
for each row execute function public.set_updated_at();

drop trigger if exists saved_places_set_updated_at on public.saved_places;
create trigger saved_places_set_updated_at
before update on public.saved_places
for each row execute function public.set_updated_at();

drop trigger if exists user_follows_set_updated_at on public.user_follows;
create trigger user_follows_set_updated_at
before update on public.user_follows
for each row execute function public.set_updated_at();

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists trip_members_set_updated_at on public.trip_members;
create trigger trip_members_set_updated_at
before update on public.trip_members
for each row execute function public.set_updated_at();

drop trigger if exists trip_places_set_updated_at on public.trip_places;
create trigger trip_places_set_updated_at
before update on public.trip_places
for each row execute function public.set_updated_at();

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
      and owner_id = public.current_app_user_id()
  )
  or exists (
    select 1
    from public.trip_members
    where trip_id = trip_uuid
      and user_id = public.current_app_user_id()
  );
$$;

revoke all on function public.is_trip_member(uuid) from public;
grant execute on function public.is_trip_member(uuid) to authenticated;

alter table public.users enable row level security;
alter table public.signup_attempts enable row level security;
alter table public.categories enable row level security;
alter table public.cities enable row level security;
alter table public.places enable row level security;
alter table public.place_images enable row level security;
alter table public.saved_places enable row level security;
alter table public.user_follows enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_places enable row level security;

grant usage on schema public to anon, authenticated;
grant usage, select on sequence public.user_id_seq to authenticated;
grant usage, select on sequence public.category_id_seq to authenticated;
grant usage, select on sequence public.city_id_seq to authenticated;
grant usage, select on sequence public.place_id_seq to authenticated;
revoke all on function public.is_strong_signup_password(text) from public;
grant execute on function public.is_strong_signup_password(text) to service_role;
grant select on public.users to anon, authenticated;
revoke all on public.signup_attempts from anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.cities to anon, authenticated;
grant select on public.places to anon, authenticated;
grant select on public.place_images to anon, authenticated;

grant select, insert, update on public.users to authenticated;
grant select, insert, update, delete on public.saved_places to authenticated;
grant select, insert, delete on public.user_follows to authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.trip_members to authenticated;
grant select, insert, update, delete on public.trip_places to authenticated;

drop policy if exists "Public can read users" on public.users;
create policy "Public can read users"
on public.users for select
using (true);

drop policy if exists "No client access to signup attempts" on public.signup_attempts;
create policy "No client access to signup attempts"
on public.signup_attempts for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "Users can insert their own profile" on public.users;
drop policy if exists "Users can insert themselves" on public.users;
create policy "Users can insert themselves"
on public.users for insert
with check ((select auth.uid()) = auth_user_id);

drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Users can update themselves" on public.users;
create policy "Users can update themselves"
on public.users for update
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
using (deleted_at is null);

drop policy if exists "Public can read cities" on public.cities;
create policy "Public can read cities"
on public.cities for select
using (deleted_at is null);

drop policy if exists "Public can read places" on public.places;
create policy "Public can read places"
on public.places for select
using (deleted_at is null);

drop policy if exists "Public can read place images" on public.place_images;
create policy "Public can read place images"
on public.place_images for select
using (true);

drop policy if exists "Users can read their saved places" on public.saved_places;
create policy "Users can read their saved places"
on public.saved_places for select
using (public.current_app_user_id() = user_id);

drop policy if exists "Users can save places for themselves" on public.saved_places;
create policy "Users can save places for themselves"
on public.saved_places for insert
with check (public.current_app_user_id() = user_id);

drop policy if exists "Users can update their saved places" on public.saved_places;
create policy "Users can update their saved places"
on public.saved_places for update
using (public.current_app_user_id() = user_id)
with check (public.current_app_user_id() = user_id);

drop policy if exists "Users can delete their saved places" on public.saved_places;
create policy "Users can delete their saved places"
on public.saved_places for delete
using (public.current_app_user_id() = user_id);

drop policy if exists "Public can read follows" on public.user_follows;
create policy "Public can read follows"
on public.user_follows for select
using (true);

drop policy if exists "Users can follow as themselves" on public.user_follows;
create policy "Users can follow as themselves"
on public.user_follows for insert
with check (public.current_app_user_id() = follower_id);

drop policy if exists "Users can unfollow as themselves" on public.user_follows;
create policy "Users can unfollow as themselves"
on public.user_follows for delete
using (public.current_app_user_id() = follower_id);

drop policy if exists "Trip members can read trips" on public.trips;
create policy "Trip members can read trips"
on public.trips for select
using (public.is_trip_member(id));

drop policy if exists "Users can create their own trips" on public.trips;
create policy "Users can create their own trips"
on public.trips for insert
with check (public.current_app_user_id() = owner_id);

drop policy if exists "Trip owners can update trips" on public.trips;
create policy "Trip owners can update trips"
on public.trips for update
using (public.current_app_user_id() = owner_id)
with check (public.current_app_user_id() = owner_id);

drop policy if exists "Trip owners can delete trips" on public.trips;
create policy "Trip owners can delete trips"
on public.trips for delete
using (public.current_app_user_id() = owner_id);

drop policy if exists "Trip members can read trip members" on public.trip_members;
create policy "Trip members can read trip members"
on public.trip_members for select
using (public.is_trip_member(trip_id));

drop policy if exists "Trip owners can add trip members" on public.trip_members;
create policy "Trip owners can add trip members"
on public.trip_members for insert
with check (public.is_trip_owner(trip_id) or public.current_app_user_id() = user_id);

drop policy if exists "Trip owners can update trip members" on public.trip_members;
create policy "Trip owners can update trip members"
on public.trip_members for update
using (public.is_trip_owner(trip_id))
with check (public.is_trip_owner(trip_id));

drop policy if exists "Trip owners and members can delete memberships" on public.trip_members;
create policy "Trip owners and members can delete memberships"
on public.trip_members for delete
using (public.is_trip_owner(trip_id) or public.current_app_user_id() = user_id);

drop policy if exists "Trip members can read trip places" on public.trip_places;
create policy "Trip members can read trip places"
on public.trip_places for select
using (public.is_trip_member(trip_id));

drop policy if exists "Trip owners can add trip places" on public.trip_places;
create policy "Trip owners can add trip places"
on public.trip_places for insert
with check (public.is_trip_owner(trip_id));

drop policy if exists "Trip owners can update trip places" on public.trip_places;
create policy "Trip owners can update trip places"
on public.trip_places for update
using (public.is_trip_owner(trip_id))
with check (public.is_trip_owner(trip_id));

drop policy if exists "Trip owners can delete trip places" on public.trip_places;
create policy "Trip owners can delete trip places"
on public.trip_places for delete
using (public.is_trip_owner(trip_id));

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
