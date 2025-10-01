-- Temporarily disable RLS, backfill user_id on legacy rows, and re-enable RLS
-- NOTE: Run in the Supabase SQL editor or psql with a role that has privileges to alter RLS

begin;

alter table public.cards disable row level security;
alter table public.review_logs disable row level security;

-- Set your target user here
-- Replace with the correct UUID for the owner of imported rows
-- You provided: e0c93724-e737-40fc-bfc7-7ca63e0ca9ce

update public.cards
set user_id = 'e0c93724-e737-40fc-bfc7-7ca63e0ca9ce'
where user_id is null;

update public.review_logs
set user_id = 'e0c93724-e737-40fc-bfc7-7ca63e0ca9ce'
where user_id is null;

alter table public.cards enable row level security;
alter table public.review_logs enable row level security;

commit;

-- Quick sanity checks
select count(*) as total, count(*) filter (where user_id is null) as null_user from public.cards;
select count(*) as total, count(*) filter (where user_id is null) as null_user from public.review_logs;

