"use server";

import { createClient } from "@/utils/supabase/server";
import { getActiveSpaceId } from "@/lib/supabase/spaces";

export async function launchTournamentAction(payload) {
  const supabase = await createClient();
  const spaceId = await getActiveSpaceId();
  if (!spaceId) {
    return { error: "Missing space id" };
  }
  const { name, date, entryFee, prize, settings, entries, matches } = payload;

  // Direct inserts (no RPC)
  const { data: tRes, error: tErr } = await supabase
    .from("tournaments")
    .insert({
      space_id: spaceId,
      date,
      name,
      status: "active",
      entry_fee: entryFee ? Number(entryFee) : null,
      prize_money_details: prize || null,
      settings: settings || {},
    })
    .select("id")
    .single();
  if (tErr) return { error: tErr.message };
  const tournamentId = tRes.id;

  // Insert entries and build index mapping
  const { data: insEntries, error: eErr } = await supabase
    .from("entries")
    .insert(entries.map((e) => ({ tournament_id: tournamentId, name: e.name })))
    .select("id,name");
  if (eErr) return { error: eErr.message };
  const nameToId = new Map((insEntries || []).map((e) => [e.name, e.id]));
  const indexToId = new Map();
  entries.forEach((e, i) => indexToId.set(i + 1, nameToId.get(e.name)));

  const matchRows = matches.map((m) => ({
    tournament_id: tournamentId,
    round: m.round,
    entry1_id: indexToId.get(m.entry1_index),
    entry2_id: indexToId.get(m.entry2_index),
    status: "pending",
  }));
  const { error: mErr } = await supabase.from("matches").insert(matchRows);
  if (mErr) return { error: mErr.message };

  return { tournamentId };
}

export async function getWizardDraftAction() {
  const supabase = await createClient();
  const spaceId = await getActiveSpaceId();
  if (!spaceId) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("wizard_drafts")
    .select("data")
    .eq("space_id", spaceId)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.data || null;
}

export async function upsertWizardDraftAction(draft) {
  const supabase = await createClient();
  const spaceId = await getActiveSpaceId();
  if (!spaceId) return { error: "Missing space id" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No user" };
  const payload = { space_id: spaceId, user_id: user.id, data: draft };
  const { error } = await supabase
    .from("wizard_drafts")
    .upsert(payload, { onConflict: "space_id,user_id" });
  return { error: error?.message || null };
}

export async function clearWizardDraftAction() {
  const supabase = await createClient();
  const spaceId = await getActiveSpaceId();
  if (!spaceId) return { error: "Missing space id" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No user" };
  const { error } = await supabase
    .from("wizard_drafts")
    .delete()
    .eq("space_id", spaceId)
    .eq("user_id", user.id);
  return { error: error?.message || null };
}


