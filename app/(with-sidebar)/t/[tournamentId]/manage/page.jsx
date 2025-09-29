import { createClient } from "@/utils/supabase/server";
import ManageTournamentClient from "./ManageTournamentClient";

export default async function ManageTournamentPage({ params }) {
  const { tournamentId } = params;
  const supabase = await createClient();

  // Fetch all initial data in parallel
  const [
    { data: tournament, error: tErr },
    { data: entries, error: eErr },
    { data: matches, error: mErr },
  ] = await Promise.all([
    supabase.from("tournaments").select("id, status").eq("id", tournamentId).maybeSingle(),
    supabase.from("entries").select("id, name").eq("tournament_id", tournamentId),
    supabase.from("matches").select("*").eq("tournament_id", tournamentId),
  ]);

  const initialData = {
    tournament,
    entries,
    matches,
  };

  const error = tErr || eErr || mErr;
  if (error) {
    // A simple error state for now
    return <div>Error loading tournament: {error.message}</div>;
  }

  return <ManageTournamentClient initialData={initialData} />;
}