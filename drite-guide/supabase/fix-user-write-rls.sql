-- Repair RLS policies for user-owned saves and trips.
-- Run this in the Supabase SQL editor if logged-in users get:
-- "new row violates row-level security policy" for saved_places or trips.

grant select, insert, update, delete on public.saved_places to authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.trip_members to authenticated;
grant select, insert, update, delete on public.trip_places to authenticated;

drop policy if exists "Users can read their saved places" on public.saved_places;
create policy "Users can read their saved places"
on public.saved_places for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can save places for themselves" on public.saved_places;
create policy "Users can save places for themselves"
on public.saved_places for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their saved places" on public.saved_places;
create policy "Users can update their saved places"
on public.saved_places for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their saved places" on public.saved_places;
create policy "Users can delete their saved places"
on public.saved_places for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Trip members can read trips" on public.trips;
create policy "Trip members can read trips"
on public.trips for select
to authenticated
using (public.is_trip_member(id));

drop policy if exists "Users can create their own trips" on public.trips;
create policy "Users can create their own trips"
on public.trips for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Trip owners can update trips" on public.trips;
create policy "Trip owners can update trips"
on public.trips for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Trip owners can delete trips" on public.trips;
create policy "Trip owners can delete trips"
on public.trips for delete
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "Trip members can read trip members" on public.trip_members;
create policy "Trip members can read trip members"
on public.trip_members for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists "Trip owners can add trip members" on public.trip_members;
create policy "Trip owners can add trip members"
on public.trip_members for insert
to authenticated
with check (public.is_trip_owner(trip_id) or auth.uid() = user_id);

drop policy if exists "Trip owners can update trip members" on public.trip_members;
create policy "Trip owners can update trip members"
on public.trip_members for update
to authenticated
using (public.is_trip_owner(trip_id))
with check (public.is_trip_owner(trip_id));

drop policy if exists "Trip owners and members can delete memberships" on public.trip_members;
create policy "Trip owners and members can delete memberships"
on public.trip_members for delete
to authenticated
using (public.is_trip_owner(trip_id) or auth.uid() = user_id);

drop policy if exists "Trip members can read trip places" on public.trip_places;
create policy "Trip members can read trip places"
on public.trip_places for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists "Trip owners can add trip places" on public.trip_places;
create policy "Trip owners can add trip places"
on public.trip_places for insert
to authenticated
with check (public.is_trip_owner(trip_id));

drop policy if exists "Trip owners can update trip places" on public.trip_places;
create policy "Trip owners can update trip places"
on public.trip_places for update
to authenticated
using (public.is_trip_owner(trip_id))
with check (public.is_trip_owner(trip_id));

drop policy if exists "Trip owners can delete trip places" on public.trip_places;
create policy "Trip owners can delete trip places"
on public.trip_places for delete
to authenticated
using (public.is_trip_owner(trip_id));
