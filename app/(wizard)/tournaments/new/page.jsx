// path: app/(wizard)/tournaments/new/page.jsx

import { createClient } from "@/utils/supabase/server";
import { getActiveSpaceId } from "@/lib/supabase/spaces";
import WizardClient from "@/components/wizard/WizardClient";

export default async function NewTournamentWizardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); // get the user from the supabase auth
  const spaceId = await getActiveSpaceId(); // get the space id from the supabase spaces

  let roster = [];
  let initialDraft = null;

  if (spaceId && user) {
    // 1. Fetch the club roster on the server
    const { data: rosterData } = await supabase
      .from("players")
      .select("id, name, default_skill_rank, age, gender")
      .eq("space_id", spaceId)
      .eq("is_active", true)
      .order("default_skill_rank", { ascending: true });

    roster = (rosterData || []).map((p) => ({
      id: p.id,
      name: p.name,
      skillRank: p.default_skill_rank,
      age: p.age,
      gender: p.gender,
    }));

    // 2. Fetch the existing draft on the server
    const { data: draftData } = await supabase
      .from("wizard_drafts")
      .select("data")
      .eq("space_id", spaceId)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draftData) {
      initialDraft = draftData.data;
    }
  }

  // 3. Render the client component with the fetched data
  return <WizardClient initialRoster={roster} initialDraft={initialDraft} />;
}
