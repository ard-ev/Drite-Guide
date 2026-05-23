-- Align the manually recreated public.user_profile table with the app.
-- Run this in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create sequence if not exists public.user_id_seq as bigint start with 1;

create table if not exists public.user_profile (
  usr_id text
);

create table if not exists public.signup_attempts (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists signup_attempts_email_created_at_idx
  on public.signup_attempts (email_hash, created_at desc);
create index if not exists signup_attempts_ip_created_at_idx
  on public.signup_attempts (ip_hash, created_at desc);

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
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

alter table public.user_profile
  add column if not exists usr_id text,
  add column if not exists auth_user_id uuid,
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists email text,
  add column if not exists username text,
  add column if not exists profile_picture_path text,
  add column if not exists role text not null default 'user',
  add column if not exists preferred_language text not null default 'en',
  add column if not exists email_verified boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profile'
      and column_name = 'id'
  ) then
    execute '
      update public.user_profile
      set usr_id = id
      where (usr_id is null or btrim(usr_id) = '''')
        and id is not null
        and btrim(id) <> ''''
    ';
  end if;
end $$;

alter table public.user_profile
  alter column usr_id set default public.generate_user_public_id();

update public.user_profile
set usr_id = public.generate_user_public_id()
where usr_id is null or btrim(usr_id) = '';

update public.user_profile
set email = lower(usr_id || '@user.invalid')
where email is null or btrim(email) = '';

update public.user_profile
set username = usr_id
where username is null or btrim(username) = '';

alter table public.user_profile
  alter column usr_id set not null,
  alter column email set not null,
  alter column username set not null;

do $$
declare
  primary_key_name text;
begin
  select c.conname
  into primary_key_name
  from pg_constraint c
  where c.conrelid = 'public.user_profile'::regclass
    and c.contype = 'p'
    and not exists (
      select 1
      from unnest(c.conkey) as key(attnum)
      join pg_attribute a
        on a.attrelid = c.conrelid
       and a.attnum = key.attnum
      where a.attname = 'usr_id'
    )
  limit 1;

  if primary_key_name is not null then
    execute format(
      'alter table public.user_profile drop constraint %I',
      primary_key_name
    );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_profile'::regclass
      and contype = 'p'
  ) then
    alter table public.user_profile
      add constraint user_profile_pkey primary key (usr_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_profile'::regclass
      and conname = 'user_profile_usr_id_format_check'
  ) then
    alter table public.user_profile
      add constraint user_profile_usr_id_format_check
      check (usr_id ~ '^usr_[0-9]{6}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_profile'::regclass
      and conname = 'user_profile_email_key'
  ) then
    alter table public.user_profile
      add constraint user_profile_email_key unique (email);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_profile'::regclass
      and conname = 'user_profile_username_key'
  ) then
    alter table public.user_profile
      add constraint user_profile_username_key unique (username);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_profile'::regclass
      and conname = 'user_profile_auth_user_id_key'
  ) then
    alter table public.user_profile
      add constraint user_profile_auth_user_id_key unique (auth_user_id);
  end if;
end $$;

alter table public.user_profile drop column if exists id cascade;

create index if not exists user_profile_auth_user_id_idx
  on public.user_profile (auth_user_id);
create index if not exists user_profile_username_idx
  on public.user_profile (username);

create or replace function public.is_username_available(username_value text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    length(
      regexp_replace(
        lower(regexp_replace(btrim(coalesce(username_value, '')), '^@+', '')),
        '[^a-z0-9._-]+',
        '',
        'g'
      )
    ) >= 3
    and not exists (
      select 1
      from public.user_profile
      where username = regexp_replace(
        lower(regexp_replace(btrim(coalesce(username_value, '')), '^@+', '')),
        '[^a-z0-9._-]+',
        '',
        'g'
      )
    );
$$;

create or replace function public.set_user_public_id()
returns trigger
language plpgsql
as $$
begin
  if new.usr_id is null or btrim(new.usr_id) = '' then
    new.usr_id := public.generate_user_public_id();
  end if;

  return new;
end;
$$;

drop trigger if exists users_set_public_id on public.user_profile;
create trigger users_set_public_id
before insert on public.user_profile
for each row execute function public.set_user_public_id();

drop trigger if exists users_set_updated_at on public.user_profile;
create trigger users_set_updated_at
before update on public.user_profile
for each row execute function public.set_updated_at();

select setval(
  'public.user_id_seq',
  greatest(
    coalesce(
      (
        select max((substring(usr_id from '[0-9]+$'))::bigint)
        from public.user_profile
      ),
      0
    ) + 1,
    1
  ),
  false
);

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
    from public.user_profile
    where username = candidate_username
      and (
        auth_user_id is null
        or auth_user_id <> new.id
      )
  ) loop
    suffix := suffix + 1;
    candidate_username := base_username || suffix::text;
  end loop;

  insert into public.user_profile (
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
  on conflict (email) do update set
    auth_user_id = excluded.auth_user_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    username = excluded.username,
    preferred_language = excluded.preferred_language,
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
  update public.user_profile
  set
    email = lower(new.email),
    email_verified = new.email_confirmed_at is not null,
    updated_at = now()
  where auth_user_id = new.id
     or email = lower(old.email);

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
  select usr_id
  from public.user_profile
  where auth_user_id = (select auth.uid())
     or email = lower((select auth.jwt() ->> 'email'))
  limit 1;
$$;

revoke all on function public.current_app_user_id() from public;
grant execute on function public.current_app_user_id() to authenticated;

alter table public.user_profile enable row level security;

grant usage on schema public to anon, authenticated;
grant usage, select on sequence public.user_id_seq to authenticated;
revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;
grant select on public.user_profile to anon, authenticated;
grant select, insert, update on public.user_profile to authenticated;

drop policy if exists "Public can read user_profile" on public.user_profile;
drop policy if exists "Public can read users" on public.user_profile;
create policy "Public can read user_profile"
on public.user_profile for select
using (true);

drop policy if exists "Users can insert themselves" on public.user_profile;
create policy "Users can insert themselves"
on public.user_profile for insert
to authenticated
with check ((select auth.uid()) = auth_user_id);

drop policy if exists "Users can update themselves" on public.user_profile;
create policy "Users can update themselves"
on public.user_profile for update
to authenticated
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);

alter table public.signup_attempts enable row level security;
revoke all on public.signup_attempts from anon, authenticated;
revoke all on function public.is_strong_signup_password(text) from public;
grant execute on function public.is_strong_signup_password(text) to service_role;

drop policy if exists "No client access to signup attempts" on public.signup_attempts;
create policy "No client access to signup attempts"
on public.signup_attempts for all
to anon, authenticated
using (false)
with check (false);

drop table if exists public.users cascade;
drop table if exists public.profiles cascade;
drop table if exists public.trip_members cascade;
drop table if exists public.trip_places cascade;
