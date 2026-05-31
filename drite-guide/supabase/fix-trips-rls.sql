-- Repair trip write policies for the auth.users-id based schema.
-- Run this in the Supabase SQL editor if creating a trip fails with:
-- "new row violates row level security policy for table \"trips\"".

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

grant execute on function public.current_app_user_id() to authenticated;
grant execute on function public.is_trip_member(uuid) to authenticated;
grant select, insert, update, delete on public.trips to authenticated;

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
