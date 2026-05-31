-- Security hardening for Drite Guide before production.
-- Apply in Supabase SQL editor or via Supabase CLI, then reload PostgREST schema.

create extension if not exists "pgcrypto";

create or replace function public.normalize_username(username_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(
    regexp_replace(
      lower(regexp_replace(btrim(coalesce(username_value, '')), '^@+', '')),
      '[^a-z0-9._]+',
      '',
      'g'
    ),
    30
  );
$$;

create or replace function public.resolve_login_email(identifier_value text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email
  from public.user_profile
  where normalized_username = public.normalize_username(identifier_value)
     or lower(email) = lower(btrim(coalesce(identifier_value, '')))
  limit 1;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

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
alter table if exists public.user_followers enable row level security;
alter table if exists public.user_follows enable row level security;
alter table if exists public.saved_places enable row level security;
alter table if exists public.trips enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.cities enable row level security;
alter table if exists public.places enable row level security;
alter table if exists public.place_images enable row level security;
alter table if exists public.signup_attempts enable row level security;

revoke all on public.user_profile from anon, authenticated;
grant select (
  id,
  first_name,
  last_name,
  username,
  normalized_username,
  profile_picture_path,
  bio,
  preferred_language,
  created_at,
  updated_at
) on public.user_profile to anon, authenticated;
grant update (
  first_name,
  last_name,
  username,
  profile_picture_path,
  bio,
  preferred_language
) on public.user_profile to authenticated;

revoke all on public.categories from anon, authenticated;
revoke all on public.cities from anon, authenticated;
revoke all on public.places from anon, authenticated;
revoke all on public.place_images from anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.cities to anon, authenticated;
grant select on public.places to anon, authenticated;
grant select on public.place_images to anon, authenticated;

revoke all on public.saved_places from anon, authenticated;
grant select, insert, update, delete on public.saved_places to authenticated;

revoke all on public.trips from anon, authenticated;
grant select, insert, update, delete on public.trips to authenticated;

do $$
begin
  if to_regclass('public.user_followers') is not null then
    revoke all on public.user_followers from anon, authenticated;
    grant select, insert, delete on public.user_followers to authenticated;
  end if;

  if to_regclass('public.user_follows') is not null then
    revoke all on public.user_follows from anon, authenticated;
    grant select, insert, delete on public.user_follows to authenticated;
  end if;
end $$;

revoke all on public.signup_attempts from anon, authenticated;

drop policy if exists "Public can read users" on public.user_profile;
drop policy if exists "Authenticated users can read profiles" on public.user_profile;
drop policy if exists "Profiles are readable" on public.user_profile;
create policy "Public can read safe profile columns"
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
      old.id is distinct from new.id
      or old.email is distinct from new.email
      or old.email_verified is distinct from new.email_verified
      or old.role is distinct from new.role
      or old.created_at is distinct from new.created_at
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

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
to anon, authenticated
using (deleted_at is null);

drop policy if exists "Public can read cities" on public.cities;
create policy "Public can read cities"
on public.cities for select
to anon, authenticated
using (deleted_at is null);

drop policy if exists "Public can read places" on public.places;
create policy "Public can read places"
on public.places for select
to anon, authenticated
using (deleted_at is null);

drop policy if exists "Public can read place images" on public.place_images;
create policy "Public can read place images"
on public.place_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.places
    where places.id = place_images.place_id
      and places.deleted_at is null
  )
);

do $$
begin
  if to_regclass('public.user_followers') is not null then
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
  end if;
end $$;

create or replace function public.validate_trip_client_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  member_item jsonb;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.owner_id is distinct from auth.uid() then
    raise exception 'Trips can only be written by their owner';
  end if;

  for member_item in select value from jsonb_array_elements(coalesce(new.members, '[]'::jsonb))
  loop
    if member_item->>'role' = 'owner'
      and member_item->>'user_id' is distinct from new.owner_id::text
    then
      raise exception 'Only the trip owner can have the owner role';
    end if;

    if member_item->>'role' <> 'owner'
      and coalesce(member_item->>'status', 'invited') = 'accepted'
      and (
        tg_op = 'INSERT'
        or not exists (
          select 1
          from jsonb_array_elements(coalesce(old.members, '[]'::jsonb)) old_member(value)
          where old_member.value->>'user_id' = member_item->>'user_id'
            and coalesce(old_member.value->>'status', 'invited') = 'accepted'
        )
      )
    then
      raise exception 'Members must accept invites themselves';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trips_validate_client_write on public.trips;
create trigger trips_validate_client_write
before insert or update on public.trips
for each row execute function public.validate_trip_client_write();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('app-media', 'app-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('category-images', 'category-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('city-images', 'city-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('place-images', 'place-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('profile-pictures', 'profile-pictures', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read app media" on storage.objects;
create policy "Public can read app media"
on storage.objects for select
to anon, authenticated
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
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists "Users can update their profile pictures" on storage.objects;
create policy "Users can update their profile pictures"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists "Users can delete their profile pictures" on storage.objects;
create policy "Users can delete their profile pictures"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

notify pgrst, 'reload schema';
