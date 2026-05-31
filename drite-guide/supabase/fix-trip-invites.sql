-- Add invite response helpers for trip members.
-- Invited users can accept their own invite or decline it without broad trips UPDATE access.

create or replace function public.accept_trip_invite(trip_uuid uuid)
returns public.trips
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  app_user_id uuid := auth.uid();
  now_text text := now()::text;
  updated_trip public.trips;
begin
  if app_user_id is null then
    raise exception 'Sign in required.';
  end if;

  update public.trips as target
  set
    members = (
      select coalesce(
        jsonb_agg(
          case
            when member_item.value->>'user_id' = app_user_id::text
              and coalesce(member_item.value->>'role', 'member') <> 'owner'
            then member_item.value || jsonb_build_object(
              'status', 'accepted',
              'updated_at', now_text
            )
            else member_item.value
          end
          order by member_item.ordinality
        ),
        '[]'::jsonb
      )
      from jsonb_array_elements(target.members) with ordinality as member_item(value, ordinality)
    ),
    updated_at = now()
  where target.id = trip_uuid
    and exists (
      select 1
      from jsonb_array_elements(target.members) as member_item(value)
      where member_item.value->>'user_id' = app_user_id::text
        and coalesce(member_item.value->>'role', 'member') <> 'owner'
        and coalesce(member_item.value->>'status', 'invited') = 'invited'
    )
  returning * into updated_trip;

  if updated_trip.id is null then
    raise exception 'Trip invite could not be found.';
  end if;

  return updated_trip;
end;
$$;

create or replace function public.decline_trip_invite(trip_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  app_user_id uuid := auth.uid();
  removed_count integer := 0;
begin
  if app_user_id is null then
    raise exception 'Sign in required.';
  end if;

  update public.trips as target
  set
    members = (
      select coalesce(jsonb_agg(member_item.value order by member_item.ordinality), '[]'::jsonb)
      from jsonb_array_elements(target.members) with ordinality as member_item(value, ordinality)
      where not (
        member_item.value->>'user_id' = app_user_id::text
        and coalesce(member_item.value->>'role', 'member') <> 'owner'
      )
    ),
    updated_at = now()
  where target.id = trip_uuid
    and exists (
      select 1
      from jsonb_array_elements(target.members) as member_item(value)
      where member_item.value->>'user_id' = app_user_id::text
        and coalesce(member_item.value->>'role', 'member') <> 'owner'
    );

  get diagnostics removed_count = row_count;

  if removed_count = 0 then
    raise exception 'Trip invite could not be found.';
  end if;
end;
$$;

revoke all on function public.accept_trip_invite(uuid) from public;
revoke all on function public.decline_trip_invite(uuid) from public;
grant execute on function public.accept_trip_invite(uuid) to authenticated;
grant execute on function public.decline_trip_invite(uuid) to authenticated;

notify pgrst, 'reload schema';
