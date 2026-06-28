-- Fix Supabase linter warnings for public SECURITY DEFINER auth lookup RPCs,
-- leftover migration backup tables, and stale content timestamps.

revoke all on function public.resolve_login_email(text) from public;
revoke all on function public.resolve_login_email(text) from anon;
revoke all on function public.resolve_login_email(text) from authenticated;
grant execute on function public.resolve_login_email(text) to service_role;

revoke all on function public.is_email_available(text) from public;
revoke all on function public.is_email_available(text) from anon;
revoke all on function public.is_email_available(text) from authenticated;
grant execute on function public.is_email_available(text) to service_role;

drop table if exists public._user_follows_migration_backup;
drop table if exists public._user_profile_migration_backup;

do $$
begin
  if to_regclass('public.alembic_version') is not null then
    execute 'alter table public.alembic_version disable row level security';
    execute 'revoke all on public.alembic_version from anon, authenticated';
  end if;
end $$;

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

drop trigger if exists category_translations_set_updated_at on public.category_translations;
create trigger category_translations_set_updated_at
before update on public.category_translations
for each row execute function public.set_updated_at();

drop trigger if exists city_translations_set_updated_at on public.city_translations;
create trigger city_translations_set_updated_at
before update on public.city_translations
for each row execute function public.set_updated_at();

drop trigger if exists place_translations_set_updated_at on public.place_translations;
create trigger place_translations_set_updated_at
before update on public.place_translations
for each row execute function public.set_updated_at();

do $$
declare
  table_name text;
  realtime_tables text[] := array[
    'categories',
    'category_translations',
    'cities',
    'city_translations',
    'places',
    'place_translations',
    'place_images'
  ];
begin
  foreach table_name in array realtime_tables loop
    if to_regclass('public.' || table_name) is not null
      and not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      )
    then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
