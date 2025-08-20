import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Bracket from "../../../../components/bracket/Bracket";

export default async function PastEventDetails({ params }) {
  const { tournamentId } = params;
  const supabase = await createClient();

  const [{ data: t }, { data: entries }, { data: matches }] = await Promise.all([
    supabase.from("tournaments").select("id, name, date, status").eq("id", tournamentId).maybeSingle(),
    supabase.from("entries").select("id,name").eq("tournament_id", tournamentId),
    supabase
      .from("matches")
      .select("id, round, entry1_id, entry2_id, entry1_score, entry2_score, status")
      .eq("tournament_id", tournamentId),
  ]);

  const entryById = new Map((entries || []).map((e) => [e.id, e]));
  const semis = (matches || []).filter((m) => m.round === "Semi-Finals");
  const final = (matches || []).find((m) => m.round === "Final");

  let bracket = null;
  if ((semis?.length || 0) >= 2 || final) {
    bracket = { rounds: [{ name: "Semi-Finals", matches: ["sf1", "sf2"] }, { name: "Final", matches: ["final"] }], matches: [] };
    const s1 = semis?.[0];
    const s2 = semis?.[1];
    bracket.matches.push({
      id: "sf1",
      name: "Semi-Final 1",
      slots: [
        { participant: s1 ? entryById.get(s1.entry1_id) : null },
        { participant: s1 ? entryById.get(s1.entry2_id) : null },
      ],
      entry1_score: s1?.entry1_score ?? null,
      entry2_score: s1?.entry2_score ?? null,
      status: s1?.status ?? "pending",
    });
    bracket.matches.push({
      id: "sf2",
      name: "Semi-Final 2",
      slots: [
        { participant: s2 ? entryById.get(s2.entry1_id) : null },
        { participant: s2 ? entryById.get(s2.entry2_id) : null },
      ],
      entry1_score: s2?.entry1_score ?? null,
      entry2_score: s2?.entry2_score ?? null,
      status: s2?.status ?? "pending",
    });
    bracket.matches.push({
      id: "final",
      name: "Final",
      slots: [
        { participant: final ? entryById.get(final.entry1_id) : null, source: { type: "winner", matchId: "sf1" } },
        { participant: final ? entryById.get(final.entry2_id) : null, source: { type: "winner", matchId: "sf2" } },
      ],
      entry1_score: final?.entry1_score ?? null,
      entry2_score: final?.entry2_score ?? null,
      status: final?.status ?? "pending",
    });
  }

  const formattedDate = t?.date
    ? new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t?.name || "Tournament"}</h1>
          <p className="text-sm text-foreground/70">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link className="rounded-md border px-3 py-1 text-sm" href="/past-events">Back</Link>
        </div>
      </header>

      {bracket && (
        <div className="mb-6 rounded-md border border-black/10 bg-white p-4">
          <div className="mb-2 text-base font-semibold">Knockout</div>
          <Bracket model={bracket} />
        </div>
      )}

      <div className="rounded-md border border-black/10 bg-white p-4">
        <div className="mb-2 text-base font-semibold">Groups</div>
        <div className="space-y-4">
          {Array.from(new Set((matches || []).map((m) => m.round).filter((r) => r?.startsWith("Group ")))).map((label) => (
            <div key={label}>
              <div className="mb-2 text-sm font-semibold">{label}</div>
              <ul className="space-y-2 text-sm">
                {(matches || [])
                  .filter((m) => m.round === label)
                  .map((m) => (
                    <li key={m.id} className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2">
                      <div>
                        {entryById.get(m.entry1_id)?.name} <span className="text-foreground/50">vs</span> {entryById.get(m.entry2_id)?.name}
                      </div>
                      <div className="text-foreground/60">
                        {m.status === "completed" && typeof m.entry1_score === "number" && typeof m.entry2_score === "number"
                          ? `${m.entry1_score} - ${m.entry2_score}`
                          : "Pending"}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


