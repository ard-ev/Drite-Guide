create table if not exists public.category_translations (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.categories(id) on delete cascade,
  language_code varchar(8) not null,
  name varchar(255) not null,
  subtitle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, language_code)
);

create table if not exists public.city_translations (
  id uuid primary key default gen_random_uuid(),
  city_id text not null references public.cities(id) on delete cascade,
  language_code varchar(8) not null,
  city_name varchar(255) not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, language_code)
);

create table if not exists public.place_translations (
  id text primary key,
  place_id text not null references public.places(id) on delete cascade,
  language_code varchar(8) not null,
  name varchar(255) not null,
  description text not null,
  address text,
  opening_hours text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, language_code)
);

alter table public.place_translations
  add column if not exists address text,
  add column if not exists opening_hours text;

alter table public.category_translations
  add column if not exists subtitle text;

create index if not exists category_translations_lookup_idx
  on public.category_translations (category_id, language_code);

create index if not exists city_translations_lookup_idx
  on public.city_translations (city_id, language_code);

create index if not exists place_translations_lookup_idx
  on public.place_translations (place_id, language_code);

alter table public.category_translations enable row level security;
alter table public.city_translations enable row level security;
alter table public.place_translations enable row level security;

revoke all on public.category_translations from anon, authenticated;
revoke all on public.city_translations from anon, authenticated;
revoke all on public.place_translations from anon, authenticated;

grant select on public.category_translations to anon, authenticated;
grant select on public.city_translations to anon, authenticated;
grant select on public.place_translations to anon, authenticated;

drop policy if exists "Public can read category translations" on public.category_translations;
create policy "Public can read category translations"
on public.category_translations for select
to anon, authenticated
using (
  language_code in ('en', 'sq', 'de', 'es', 'it', 'fr')
  and exists (
    select 1
    from public.categories
    where categories.id = category_translations.category_id
      and categories.deleted_at is null
  )
);

drop policy if exists "Public can read city translations" on public.city_translations;
create policy "Public can read city translations"
on public.city_translations for select
to anon, authenticated
using (
  language_code in ('en', 'sq', 'de', 'es', 'it', 'fr')
  and exists (
    select 1
    from public.cities
    where cities.id = city_translations.city_id
      and cities.deleted_at is null
  )
);

drop policy if exists "Public can read place translations" on public.place_translations;
create policy "Public can read place translations"
on public.place_translations for select
to anon, authenticated
using (
  language_code in ('en', 'sq', 'de', 'es', 'it', 'fr')
  and exists (
    select 1
    from public.places
    where places.id = place_translations.place_id
      and places.deleted_at is null
  )
);

notify pgrst, 'reload schema';
