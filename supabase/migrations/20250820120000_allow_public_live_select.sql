-- Allow public (unauthenticated) read access to live tournaments and their data
-- This complements existing member/admin policies. Access is allowed if ANY policy matches.

-- Tournaments: public can view when status = 'active'
create policy if not exists "Public can view active tournaments"
on public.tournaments for select
using (status = 'active');

-- Entries: public can view when parent tournament is active
create policy if not exists "Public can view entries for active tournaments"
on public.entries for select
using (
  exists (
    select 1 from public.tournaments t
    where t.id = entries.tournament_id and t.status = 'active'
  )
);

-- Matches: public can view when parent tournament is active
create policy if not exists "Public can view matches for active tournaments"
on public.matches for select
using (
  exists (
    select 1 from public.tournaments t
    where t.id = matches.tournament_id and t.status = 'active'
  )
);


