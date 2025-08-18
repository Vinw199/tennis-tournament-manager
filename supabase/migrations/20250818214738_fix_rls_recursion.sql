-- Step 1: Create helper functions to get a user's space memberships.
-- These functions run with elevated privileges (SECURITY DEFINER) to bypass RLS on
-- the space_members table, thus preventing infinite recursion.

-- Function for general membership (read access)
create or replace function get_user_spaces()
returns setof uuid
language sql
security definer
set search_path = ''
as $$
  select space_id from public.space_members where user_id = auth.uid()
$$;

-- Function for ADMIN membership (write access)
create or replace function get_user_admin_spaces()
returns setof uuid
language sql
security definer
set search_path = ''
as $$
  select space_id from public.space_members where user_id = auth.uid() and role = 'admin'
$$;


-- Step 2: Drop all old policies to ensure a clean slate.
drop policy if exists "Members can view spaces they belong to" on spaces;
drop policy if exists "Admins can manage spaces they belong to" on spaces;
drop policy if exists "Members can view other members in their space" on space_members;
drop policy if exists "Admins can manage members in their space" on space_members;
drop policy if exists "Members can view players in their space" on players;
drop policy if exists "Admins can manage players in their space" on players;
drop policy if exists "Members can view tournaments in their space" on tournaments;
drop policy if exists "Admins can manage tournaments in their space" on tournaments;
drop policy if exists "Admins can manage their own drafts" on wizard_drafts;
drop policy if exists "Members can view entries for tournaments in their space" on entries;
drop policy if exists "Admins can manage entries for tournaments in their space" on entries;
drop policy if exists "Members can view entry_players for tournaments in their space" on entry_players;
drop policy if exists "Admins can manage entry_players for tournaments in their space" on entry_players;
drop policy if exists "Members can view matches for tournaments in their space" on matches;
drop policy if exists "Admins can manage matches for tournaments in their space" on matches;


-- Step 3: Recreate all policies using the correct helper functions.

-- Table: spaces
create policy "Members can view spaces they belong to" on spaces for select
  using (id in (select get_user_spaces()));
create policy "Admins can manage spaces they belong to" on spaces for all
  using (id in (select get_user_admin_spaces()))
  with check (id in (select get_user_admin_spaces()));

-- Table: space_members
create policy "Members can view other members in their space" on space_members for select
  using (space_id in (select get_user_spaces()));
create policy "Admins can manage members in their space" on space_members for all
  using (space_id in (select get_user_admin_spaces()))
  with check (space_id in (select get_user_admin_spaces()));

-- Table: players
create policy "Members can view players in their space" on players for select
  using (space_id in (select get_user_spaces()));
create policy "Admins can manage players in their space" on players for all
  using (space_id in (select get_user_admin_spaces()))
  with check (space_id in (select get_user_admin_spaces()));

-- Table: tournaments
create policy "Members can view tournaments in their space" on tournaments for select
  using (space_id in (select get_user_spaces()));
create policy "Admins can manage tournaments in their space" on tournaments for all
  using (space_id in (select get_user_admin_spaces()))
  with check (space_id in (select get_user_admin_spaces()));

-- Table: wizard_drafts
create policy "Admins can manage their own drafts" on wizard_drafts for all
  using (user_id = auth.uid() and space_id in (select get_user_admin_spaces()))
  with check (user_id = auth.uid() and space_id in (select get_user_admin_spaces()));

-- Table: entries
create policy "Members can view entries for tournaments in their space" on entries for select
  using (exists (
    select 1 from tournaments
    where tournaments.id = entries.tournament_id
      and tournaments.space_id in (select get_user_spaces())
  ));
create policy "Admins can manage entries for tournaments in their space" on entries for all
  using (exists (
    select 1 from tournaments
    where tournaments.id = entries.tournament_id
      and tournaments.space_id in (select get_user_admin_spaces())
  ))
  with check (exists (
    select 1 from tournaments
    where tournaments.id = entries.tournament_id
      and tournaments.space_id in (select get_user_admin_spaces())
  ));

-- Table: entry_players
create policy "Members can view entry_players for tournaments in their space" on entry_players for select
  using (exists (
    select 1 from entries
    join tournaments on entries.tournament_id = tournaments.id
    where entries.id = entry_players.entry_id
      and tournaments.space_id in (select get_user_spaces())
  ));
create policy "Admins can manage entry_players for tournaments in their space" on entry_players for all
  using (exists (
    select 1 from entries
    join tournaments on entries.tournament_id = tournaments.id
    where entries.id = entry_players.entry_id
      and tournaments.space_id in (select get_user_admin_spaces())
  ))
  with check (exists (
    select 1 from entries
    join tournaments on entries.tournament_id = tournaments.id
    where entries.id = entry_players.entry_id
      and tournaments.space_id in (select get_user_admin_spaces())
  ));

-- Table: matches
create policy "Members can view matches for tournaments in their space" on matches for select
  using (exists (
    select 1 from tournaments
    where tournaments.id = matches.tournament_id
      and tournaments.space_id in (select get_user_spaces())
  ));
create policy "Admins can manage matches for tournaments in their space" on matches for all
  using (exists (
    select 1 from tournaments
    where tournaments.id = matches.tournament_id
      and tournaments.space_id in (select get_user_admin_spaces())
  ))
  with check (exists (
    select 1 from tournaments
    where tournaments.id = matches.tournament_id
      and tournaments.space_id in (select get_user_admin_spaces())
  ));
