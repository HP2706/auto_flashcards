-- Enable Google OAuth in the Supabase dashboard (Authentication > Providers)
-- Add Redirect URLs: http://localhost:3000/auth/callback and your production URL

-- Profiles table to store app-specific user info
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure row exists on user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email), null)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;

-- Allow a logged in user to read their own profile
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using ((select auth.uid()) = id);

-- Allow a logged in user to update their own profile
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Optional: Allow reading everyone’s profile (public names)
-- create policy if not exists profiles_select_all on public.profiles for select using (true);

-- User scoping for cards and review_logs
alter table public.cards add column if not exists user_id uuid;
alter table public.review_logs add column if not exists user_id uuid;

-- Trigger function to set user_id from auth context on insert if missing
create or replace function public.set_row_user_id()
returns trigger as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_user_id_cards on public.cards;
create trigger set_user_id_cards before insert on public.cards
for each row execute function public.set_row_user_id();

drop trigger if exists set_user_id_review_logs on public.review_logs;
create trigger set_user_id_review_logs before insert on public.review_logs
for each row execute function public.set_row_user_id();

-- RLS: only owners can access their rows; allow legacy rows with null user_id to be visible to their creator on insert only
alter table public.cards enable row level security;
alter table public.review_logs enable row level security;

drop policy if exists cards_owner_access on public.cards;
create policy cards_owner_access on public.cards
  for all using (user_id = (select auth.uid())) with check (coalesce(user_id, (select auth.uid())) = (select auth.uid()));

drop policy if exists review_logs_owner_access on public.review_logs;
create policy review_logs_owner_access on public.review_logs
  for all using (user_id = (select auth.uid())) with check (coalesce(user_id, (select auth.uid())) = (select auth.uid()));
