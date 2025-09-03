import { createClient } from '@/utils/supabase/server';
import { RosterClient } from '@/components/roster/RosterClient';
import { getActiveSpaceId } from '@/lib/supabase/spaces';

export default async function ClubRosterPage() {
  const supabase = await createClient();
  const spaceId = await getActiveSpaceId();

  // Fetch initial data on the server
  const { data: players } = await supabase
    .from('players')
    .select('id,name,default_skill_rank,age,gender,profile_picture_url')
    .eq('space_id', spaceId)
    .order('name', { ascending: true });

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
      <RosterClient initialPlayers={players || []} spaceId={spaceId} />
    </div>
  );
}