-- Enable Row Level Security for all user-data tables
alter table spaces enable row level security;
alter table space_members enable row level security;
alter table players enable row level security;
alter table tournaments enable row level security;
alter table entries enable row level security;
alter table entry_players enable row level security;
alter table matches enable row level security;
alter table wizard_drafts enable row level security;

--
-- Table: spaces
-- Read: Any member can see the space they belong to.
-- Write: Only admins can create, update, or delete the space.
--
create policy "Members can view spaces they belong to"
on spaces for select
using (
  auth.uid() in (
    select user_id from space_members where space_id = spaces.id
  )
);

create policy "Admins can manage spaces they belong to"
on spaces for all -- Covers INSERT, UPDATE, DELETE
using (
  auth.uid() in (
    select user_id from space_members where space_id = spaces.id and role = 'admin'
  )
) with check (
  auth.uid() in (
    select user_id from space_members where space_id = spaces.id and role = 'admin'
  )
);


--
-- Table: space_members
-- Read: Any member can see the list of other members in their space.
-- Write: Only admins can add, remove, or change the roles of members.
--
create policy "Members can view other members in their space"
on space_members for select
using (
  space_id in (
    select space_id from space_members where user_id = auth.uid()
  )
);

create policy "Admins can manage members in their space"
on space_members for all
using (
  space_id in (
    select space_id from space_members where user_id = auth.uid() and role = 'admin'
  )
) with check (
  space_id in (
    select space_id from space_members where user_id = auth.uid() and role = 'admin'
  )
);


--
-- Table: players (Club Roster)
-- Read: Any member can view the club roster.
-- Write: Only admins can manage the club roster.
--
create policy "Members can view players in their space"
on players for select
using (
  space_id in (
    select space_id from space_members where user_id = auth.uid()
  )
);

create policy "Admins can manage players in their space"
on players for all
using (
  space_id in (
    select space_id from space_members where user_id = auth.uid() and role = 'admin'
  )
) with check (
  space_id in (
    select space_id from space_members where user_id = auth.uid() and role = 'admin'
  )
);


--
-- Table: tournaments
-- Read: Any member can view tournaments in their space.
-- Write: Only admins can create and manage tournaments.
--
create policy "Members can view tournaments in their space"
on tournaments for select
using (
  space_id in (
    select space_id from space_members where user_id = auth.uid()
  )
);

create policy "Admins can manage tournaments in their space"
on tournaments for all
using (
  space_id in (
    select space_id from space_members where user_id = auth.uid() and role = 'admin'
  )
) with check (
  space_id in (
    select space_id from space_members where user_id = auth.uid() and role = 'admin'
  )
);


--
-- Table: wizard_drafts
-- Read & Write: Only the admin who created the draft can access it.
--
create policy "Admins can manage their own drafts"
on wizard_drafts for all
using (
  user_id = auth.uid() and space_id in (
    select space_id from space_members where user_id = auth.uid() and role = 'admin'
  )
) with check (
  user_id = auth.uid() and space_id in (
    select space_id from space_members where user_id = auth.uid() and role = 'admin'
  )
);


--
-- Table: entries, entry_players, matches (Nested Tables)
-- Logic: Access is granted if the user is a member/admin of the space
-- that owns the parent tournament.
--

-- entries
create policy "Members can view entries for tournaments in their space"
on entries for select
using (
  exists (
    select 1 from tournaments
    where tournaments.id = entries.tournament_id
      and tournaments.space_id in (select space_id from space_members where user_id = auth.uid())
  )
);

create policy "Admins can manage entries for tournaments in their space"
on entries for all
using (
  exists (
    select 1 from tournaments
    where tournaments.id = entries.tournament_id
      and tournaments.space_id in (select space_id from space_members where user_id = auth.uid() and role = 'admin')
  )
) with check (
  exists (
    select 1 from tournaments
    where tournaments.id = entries.tournament_id
      and tournaments.space_id in (select space_id from space_members where user_id = auth.uid() and role = 'admin')
  )
);

-- entry_players
create policy "Members can view entry_players for tournaments in their space"
on entry_players for select
using (
  exists (
    select 1 from entries
    join tournaments on entries.tournament_id = tournaments.id
    where entries.id = entry_players.entry_id
      and tournaments.space_id in (select space_id from space_members where user_id = auth.uid())
  )
);

create policy "Admins can manage entry_players for tournaments in their space"
on entry_players for all
using (
  exists (
    select 1 from entries
    join tournaments on entries.tournament_id = tournaments.id
    where entries.id = entry_players.entry_id
      and tournaments.space_id in (select space_id from space_members where user_id = auth.uid() and role = 'admin')
  )
) with check (
  exists (
    select 1 from entries
    join tournaments on entries.tournament_id = tournaments.id
    where entries.id = entry_players.entry_id
      and tournaments.space_id in (select space_id from space_members where user_id = auth.uid() and role = 'admin')
  )
);

-- matches
create policy "Members can view matches for tournaments in their space"
on matches for select
using (
  exists (
    select 1 from tournaments
    where tournaments.id = matches.tournament_id
      and tournaments.space_id in (select space_id from space_members where user_id = auth.uid())
  )
);

create policy "Admins can manage matches for tournaments in their space"
on matches for all
using (
  exists (
    select 1 from tournaments
    where tournaments.id = matches.tournament_id
      and tournaments.space_id in (select space_id from space_members where user_id = auth.uid() and role = 'admin')
  )
) with check (
  exists (
    select 1 from tournaments
    where tournaments.id = matches.tournament_id
      and tournaments.space_id in (select space_id from space_members where user_id = auth.uid() and role = 'admin')
  )
);