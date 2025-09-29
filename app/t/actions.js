"use server";

import { createClient } from "@/utils/supabase/server";
import { computeStandings } from "../../domain/tournament/standings";
import { revalidatePath } from "next/cache";

// export async function createSemisAction({ tournamentId }) {
//   const supabase = await createClient();
//   // Load entries and group matches
//   const [{ data: entries, error: e1 }, { data: matches, error: e2 }] = await Promise.all([
//     supabase.from("entries").select("id,name").eq("tournament_id", tournamentId),
//     supabase
//       .from("matches")
//       .select("id, round, entry1_id, entry2_id, entry1_score, entry2_score, status")
//       .eq("tournament_id", tournamentId),
//   ]);
//   if (e1 || e2) return { error: e1?.message || e2?.message };
//   const entryById = new Map(entries.map((e) => [e.id, e]));

//   const groupLabels = Array.from(new Set(matches.map((m) => m.round).filter((r) => r?.startsWith("Group "))));
//   if (groupLabels.length < 2) return { error: "Need at least two groups" };

//   // Build match objects for standings computation per group
//   const standingsByGroup = groupLabels.map((label) => {
//     const groupMatches = matches
//       .filter((m) => m.round === label)
//       .map((m) => ({
//         entry1: entryById.get(m.entry1_id),
//         entry2: entryById.get(m.entry2_id),
//         entry1_score: m.entry1_score,
//         entry2_score: m.entry2_score,
//         status: m.status,
//       }));
//     return computeStandings(groupMatches);
//   });

//   if (!standingsByGroup.every((s) => s.length >= 2)) {
//     return { error: "Not enough completed matches to determine qualifiers" };
//   }

//   const a = standingsByGroup[0];
//   const b = standingsByGroup[1];
//   const a1 = a.find((s) => s.rank === 1)?.entry?.id;
//   const a2 = a.find((s) => s.rank === 2)?.entry?.id;
//   const b1 = b.find((s) => s.rank === 1)?.entry?.id;
//   const b2 = b.find((s) => s.rank === 2)?.entry?.id;
//   if (!a1 || !a2 || !b1 || !b2) return { error: "Qualifiers not ready" };

//   // Check if semis already exist
//   const { data: existingSemis } = await supabase
//     .from("matches")
//     .select("id")
//     .eq("tournament_id", tournamentId)
//     .eq("round", "Semi-Finals");
//   if ((existingSemis?.length || 0) >= 2) return { ok: true };

//   const { error } = await supabase.from("matches").insert([
//     { tournament_id: tournamentId, round: "Semi-Finals", entry1_id: a1, entry2_id: b2, status: "pending" },
//     { tournament_id: tournamentId, round: "Semi-Finals", entry1_id: b1, entry2_id: a2, status: "pending" },
//   ]);
//   if (error) return { error: error.message };
//   return { ok: true };
// }

export async function createKnockoutStageAction({ tournamentId }) {
  const supabase = await createClient();

  try {
    // 1. Fetch all necessary data
    const [{ data: entries }, { data: matches }] = await Promise.all([
      supabase.from("entries").select("id, name").eq("tournament_id", tournamentId),
      supabase.from("matches").select("*").eq("tournament_id", tournamentId),
    ]);

    const entryById = new Map(entries.map(e => [e.id, e]));

    // 2. Hydrate matches and compute standings to find qualifiers
    const hydratedMatches = matches.map(m => ({
      ...m,
      entry1: entryById.get(m.entry1_id),
      entry2: entryById.get(m.entry2_id),
    }));

    const standingsA = computeStandings(hydratedMatches.filter(m => m.round === "Group A"));
    const standingsB = computeStandings(hydratedMatches.filter(m => m.round === "Group B"));

    const a1 = standingsA.find(s => s.rank === 1)?.entry?.id;
    const a2 = standingsA.find(s => s.rank === 2)?.entry?.id;
    const b1 = standingsB.find(s => s.rank === 1)?.entry?.id;
    const b2 = standingsB.find(s => s.rank === 2)?.entry?.id;

    if (!a1 || !a2 || !b1 || !b2) {
      throw new Error("Could not determine all qualifiers from group standings.");
    }

    // Prepare the 2 semi-finals matches
    const knockoutMatches = [
      { tournament_id: tournamentId, round: "Semi-Finals", entry1_id: a1, entry2_id: b2, status: "pending" },
      { tournament_id: tournamentId, round: "Semi-Finals", entry1_id: b1, entry2_id: a2, status: "pending" },
    ];
    // Insert the 2 semi-finals matches into the database
    const { error } = await supabase.from("matches").insert(knockoutMatches);
    if (error) throw error;

  } catch (error) {
    return { error: error.message };
  }

  revalidatePath(`/t/${tournamentId}/manage`);
  return { success: true };
}

export async function createFinalAction({ tournamentId }) {
  const supabase = await createClient();
  const { data: semis, error } = await supabase
    .from("matches")
    .select("id, entry1_id, entry2_id, entry1_score, entry2_score, status")
    .eq("tournament_id", tournamentId)
    .eq("round", "Semi-Finals");
  if (error) return { error: error.message };
  if (!semis || semis.length < 2) return { error: "Semi-Finals not found" };
  const winners = semis.map((m) => {
    if (m.status !== "completed") return null;
    if (typeof m.entry1_score !== "number" || typeof m.entry2_score !== "number") return null;
    return m.entry1_score > m.entry2_score ? m.entry1_id : m.entry2_id;
  });
  if (winners.some((w) => !w)) return { error: "Semi-Finals not completed" };

  // Check if final already exists
  const { data: finals } = await supabase
    .from("matches")
    .select("id")
    .eq("tournament_id", tournamentId)
    .eq("round", "Final");
  if ((finals?.length || 0) > 0) return { ok: true };

  const [w1, w2] = winners;
  const { error: e2 } = await supabase.from("matches").insert([
    { tournament_id: tournamentId, round: "Final", entry1_id: w1, entry2_id: w2, status: "pending" },
  ]);
  if (e2) return { error: e2.message };
  return { ok: true };
}

export async function completeTournamentAction({ tournamentId }) {
  const supabase = await createClient();
  // Verify final exists and is completed
  const { data: final, error } = await supabase
    .from("matches")
    .select("id, entry1_score, entry2_score, status")
    .eq("tournament_id", tournamentId)
    .eq("round", "Final")
    .maybeSingle();
  if (error) return { error: error.message };
  const done =
    final &&
    final.status === "completed" &&
    typeof final.entry1_score === "number" &&
    typeof final.entry2_score === "number";
  if (!done) return { error: "Final not completed" };

  const { error: uErr } = await supabase
    .from("tournaments")
    .update({ status: "completed" })
    .eq("id", tournamentId);
  if (uErr) return { error: uErr.message };
  return { ok: true };
}


