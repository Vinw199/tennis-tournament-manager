import { createClient } from "@/utils/supabase/client";

export async function getWizardDraftFromDbClient() {
  const supabase = createClient();
  const spaceId = process.env.NEXT_PUBLIC_SPACE_ID;
  if (!spaceId) return null;
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
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

export async function upsertWizardDraftInDbClient(draft) {
  const supabase = createClient();
  const spaceId = process.env.NEXT_PUBLIC_SPACE_ID;
  if (!spaceId) return { error: "Missing space id" };
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return { error: "No user" };
  const payload = { space_id: spaceId, user_id: user.id, data: draft };
  const { error } = await supabase
    .from("wizard_drafts")
    .upsert(payload, { onConflict: "space_id,user_id" });
  return { error: error?.message || null };
}

export async function clearWizardDraftInDbClient() {
  const supabase = createClient();
  const spaceId = process.env.NEXT_PUBLIC_SPACE_ID;
  if (!spaceId) return { error: "Missing space id" };
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return { error: "No user" };
  const { error } = await supabase
    .from("wizard_drafts")
    .delete()
    .eq("space_id", spaceId)
    .eq("user_id", user.id);
  return { error: error?.message || null };
}


