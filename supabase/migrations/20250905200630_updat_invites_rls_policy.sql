-- Drop the old, restrictive policy
DROP POLICY "Users can view pending invites" ON public.invites;

-- Create a new, more permissive policy that allows public access
-- to read-only data for pending invites.
CREATE POLICY "Public can view pending invites"
ON public.invites
FOR SELECT
TO public -- The key change: from 'authenticated' to 'public'
USING ( status = 'pending' );

CREATE POLICY "Public can view players from a pending invite"
ON public.players
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.invites
    WHERE invites.player_id = players.id AND invites.status = 'pending'
  )
);

CREATE POLICY "Public can view spaces from a pending invite"
ON public.spaces
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.invites
    WHERE invites.space_id = spaces.id AND invites.status = 'pending'
  )
);