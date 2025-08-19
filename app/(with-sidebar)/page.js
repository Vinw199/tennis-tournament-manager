import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let hasDraft = false;
  let activeTournament = null;
  if (user) {
    const spaceId = process.env.NEXT_PUBLIC_SPACE_ID;
    if (spaceId) {
      const { data } = await supabase
        .from("wizard_drafts")
        .select("id")
        .eq("space_id", spaceId)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      hasDraft = !!data;

      // Fetch latest active tournament for this space
      const { data: t } = await supabase
        .from("tournaments")
        .select("id, name, date, status")
        .eq("space_id", spaceId)
        .eq("status", "active")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (t) activeTournament = t;
    }
  }
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Dashboard</h1>
        <div className="flex items-center gap-2">
          {hasDraft && (
            <Link
              href="/tournaments/new"
              className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-4 py-2 text-sm shadow hover:bg-black/5"
            >
              Continue setup
            </Link>
          )}
          <Link
            href="/tournaments/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-white shadow hover:opacity-95"
          >
            Create New Tournament
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="mb-2 text-lg font-semibold">Active Tournament</h2>
          {activeTournament ? (
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="font-semibold">{activeTournament.name}</div>
                <div className="text-foreground/60">{activeTournament.date}</div>
              </div>
              <div className="flex items-center gap-2">
                <Link className="rounded-md border px-3 py-1" href={`/t/${activeTournament.id}/manage`}>Manage</Link>
                <Link className="rounded-md border px-3 py-1" href={`/t/${activeTournament.id}/live`}>Live</Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/70">
              No active tournament. Click &quot;Create New Tournament&quot; to start.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="mb-2 text-lg font-semibold">Quick Links</h2>
          <ul className="text-sm leading-7">
            <li>
              <Link className="text-brand underline" href="/roster">
                Manage Club Roster
              </Link>
            </li>
            <li>
              <Link className="text-brand underline" href="/past-events">
                View Past Events
              </Link>
            </li>
            <li>
              <Link className="text-brand underline" href="/settings">
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}


