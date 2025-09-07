import { createClient } from '@/utils/supabase/server';
import { RosterClient } from '@/components/roster/RosterClient';
import { getActiveSpaceId } from '@/lib/supabase/spaces';

export default async function ClubRosterPage() {
  const supabase = await createClient();
  const spaceId = await getActiveSpaceId();

  // Fetch initial data on the server
  // const { data: players } = await supabase
  //   .from('players')
  //   .select('id,name,default_skill_rank,age,gender,profile_picture_url')
  //   .eq('space_id', spaceId)
  //   .order('name', { ascending: true });

  // const { data: players } = await supabase
  //   .from('players')
  //   .select('*, invites(*), space_members(role)')
  //   .eq('space_id', spaceId)
  //   .order('name', { ascending: true });

  // Step 1: Reliably fetch all players for the space.
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*, invites(*)')
    .eq('space_id', spaceId);

  if (playersError) console.error("Error fetching players:", playersError.message);

  // Step 2: Reliably fetch all member roles for the space.
  const { data: members, error: membersError } = await supabase
    .from('space_members')
    .select('user_id, role')
    .eq('space_id', spaceId);

  if (membersError) console.error("Error fetching members:", membersError.message);

  // Step 3: Create a lookup map for roles (user_id -> role).
  const roleMap = new Map(members?.map(m => [m.user_id, m.role]) || []);

  // Step 4: Combine the data. This acts as a "left join", guaranteeing every
  // player is included in the final result.
  const playersWithRoles = players?.map(player => ({
    ...player,
    role: player.user_id ? roleMap.get(player.user_id) : null
  })) || [];

  // Step 5: Sort the combined data in code.
  // playersWithRoles.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-6xl">
      {/* <Suspense fallback={null}>
        <ToastHandler />
      </Suspense> */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Club Roster</h1>
          <p className="text-muted-foreground">
            Manage the list of players in your club.
          </p>
        </div>
      </header>
      <RosterClient initialPlayers={playersWithRoles || []} spaceId={spaceId} />
    </div>
  );
}