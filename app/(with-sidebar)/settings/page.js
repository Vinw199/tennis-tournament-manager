import { createClient } from "@/utils/supabase/server";

export default async function Settings() {
  const supabase = await createClient();
  const spaceId = process.env.NEXT_PUBLIC_SPACE_ID;
  let spaceName = "";
  if (spaceId) {
    const { data } = await supabase
      .from("spaces")
      .select("name")
      .eq("id", spaceId)
      .single();
    spaceName = data?.name || "";
  }
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-foreground/70">Manage your profile and preferences for this Space.</p>
      </header>
      <div className="space-y-4">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="mb-2 font-semibold">Space Name</h2>
          <input
            className="w-full rounded-md border px-3 py-2"
            defaultValue={spaceName}
            readOnly
          />
          <p className="mt-2 text-xs text-foreground/60">Supabase-backed editing will be enabled later.</p>
        </div>
      </div>
    </div>
  );
}



