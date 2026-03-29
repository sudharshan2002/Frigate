create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text,
  workspace text,
  avatar_url text,
  provider text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    workspace,
    avatar_url,
    provider
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'role',
    new.raw_user_meta_data ->> 'workspace',
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_app_meta_data ->> 'provider'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = coalesce(excluded.role, public.profiles.role),
    workspace = coalesce(excluded.workspace, public.profiles.workspace),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    provider = coalesce(excluded.provider, public.profiles.provider),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

drop policy if exists "Profiles can view own row" on public.profiles;
create policy "Profiles can view own row"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Profiles can update own row" on public.profiles;
create policy "Profiles can update own row"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Profiles can insert own row" on public.profiles;
create policy "Profiles can insert own row"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

insert into public.profiles (
  id,
  email,
  full_name,
  role,
  workspace,
  avatar_url,
  provider
)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name'),
  users.raw_user_meta_data ->> 'role',
  users.raw_user_meta_data ->> 'workspace',
  users.raw_user_meta_data ->> 'avatar_url',
  users.raw_app_meta_data ->> 'provider'
from auth.users as users
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  role = coalesce(excluded.role, public.profiles.role),
  workspace = coalesce(excluded.workspace, public.profiles.workspace),
  avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
  provider = coalesce(excluded.provider, public.profiles.provider),
  updated_at = timezone('utc', now());
