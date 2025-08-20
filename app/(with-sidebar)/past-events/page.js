import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function PastEvents() {
  const supabase = await createClient();
  const spaceId = process.env.NEXT_PUBLIC_SPACE_ID;
  let tournaments = [];
  if (spaceId) {
    const { data } = await supabase
      .from("tournaments")
      .select("id, name, date")
      .eq("space_id", spaceId)
      .eq("status", "completed")
      .order("date", { ascending: false });
    tournaments = data || [];
  }
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Past Events</h1>
        <p className="text-sm text-foreground/70">Completed tournaments in your space.</p>
      </header>
      {tournaments.length === 0 ? (
        <p className="text-sm text-foreground/70">No completed tournaments yet.</p>
      ) : (
        <ul className="divide-y rounded-md border border-black/10 bg-white">
          {tournaments.map((t) => {
            const formattedDate = t.date
              ? new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "";
            return (
              <li key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-foreground/60">{formattedDate}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Link className="rounded-md border px-3 py-1 text-sm" href={`/past-events/${t.id}`}>View</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
