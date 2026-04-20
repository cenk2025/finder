-- Voon Lead Finder — Supabase Schema
-- Run in Supabase SQL Editor

-- Profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_user_id_idx on public.profiles(user_id);

-- Searches (haku)
create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  region text,
  industry_code text,
  industry_label text,
  target_audience text,
  status text not null default 'pending',
  result_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists searches_user_idx on public.searches(user_id, created_at desc);

-- Leads (liidit)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  search_id uuid references public.searches(id) on delete set null,
  business_name text not null,
  business_id text,
  phone text,
  email text,
  website text,
  address text,
  city text,
  postal_code text,
  region text,
  industry_code text,
  industry_label text,
  linkedin text,
  facebook text,
  instagram text,
  notes text,
  score int default 50,
  status text default 'new',
  created_at timestamptz not null default now()
);

create index if not exists leads_user_idx on public.leads(user_id, created_at desc);
create index if not exists leads_search_idx on public.leads(search_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.searches enable row level security;
alter table public.leads enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

-- Searches policies
drop policy if exists "searches_all_own" on public.searches;
create policy "searches_all_own" on public.searches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Leads policies
drop policy if exists "leads_all_own" on public.leads;
create policy "leads_all_own" on public.leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
