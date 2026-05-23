-- Repair RLS policies for user-owned saves and trips.
-- Run this in the Supabase SQL editor if logged-in users get:
-- "new row violates row-level security policy" for saved_places or trips.

grant select, insert, update, delete on public.saved_places to authenticated;
grant select, insert, update, delete on public.trips to authenticated;

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
    from public.trips
    where id = trip_uuid
      and members @> jsonb_build_array(
        jsonb_build_object('user_id', public.current_app_user_id())
      )
  );
$$;

revoke all on function public.is_trip_member(uuid) from public;
grant execute on function public.is_trip_member(uuid) to authenticated;

drop policy if exists "Users can read their saved places" on public.saved_places;
create policy "Users can read their saved places"
on public.saved_places for select
to authenticated
using (public.current_app_user_id() = user_id);

drop policy if exists "Users can save places for themselves" on public.saved_places;
create policy "Users can save places for themselves"
on public.saved_places for insert
to authenticated
with check (public.current_app_user_id() = user_id);

drop policy if exists "Users can update their saved places" on public.saved_places;
create policy "Users can update their saved places"
on public.saved_places for update
to authenticated
using (public.current_app_user_id() = user_id)
with check (public.current_app_user_id() = user_id);

drop policy if exists "Users can delete their saved places" on public.saved_places;
create policy "Users can delete their saved places"
on public.saved_places for delete
to authenticated
using (public.current_app_user_id() = user_id);

drop policy if exists "Trip members can read trips" on public.trips;
create policy "Trip members can read trips"
on public.trips for select
to authenticated
using (public.is_trip_member(id));

drop policy if exists "Users can create their own trips" on public.trips;
create policy "Users can create their own trips"
on public.trips for insert
to authenticated
with check (public.current_app_user_id() = owner_id);

drop policy if exists "Trip owners can update trips" on public.trips;
create policy "Trip owners can update trips"
on public.trips for update
to authenticated
using (public.current_app_user_id() = owner_id)
with check (public.current_app_user_id() = owner_id);

drop policy if exists "Trip owners can delete trips" on public.trips;
create policy "Trip owners can delete trips"
on public.trips for delete
to authenticated
using (public.current_app_user_id() = owner_id);
