"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "../../../../components/ui/Card";
import { computeStandings } from "../../../../domain/tournament/standings";
import { createClient } from "@/utils/supabase/client";
import Bracket from "../../../../components/bracket/Bracket";

export default function LiveTournamentView() {
  const { tournamentId } = useParams();
  const [entries, setEntries] = useState([]);
  const [matches, setMatches] = useState([]);
  const [bracket, setBracket] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState(null);
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentDate, setTournamentDate] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const spaceId = process.env.NEXT_PUBLIC_SPACE_ID;
      const [{ data: entries }, { data: matches }, userRes, { data: tRow }] = await Promise.all([
        supabase.from("entries").select("id,name").eq("tournament_id", tournamentId),
        supabase
          .from("matches")
          .select("id, round, entry1_id, entry2_id, entry1_score, entry2_score, status")
          .eq("tournament_id", tournamentId),
        supabase.auth.getUser(),
        supabase.from("tournaments").select("status, name, date").eq("id", tournamentId).maybeSingle(),
      ]);
      if (!entries || !matches) return;
      const entryById = new Map(entries.map((e) => [e.id, e]));
      setEntries(entries);
      setMatches(
        matches.map((m) => ({
          id: m.id,
          round: m.round,
          entry1: entryById.get(m.entry1_id),
          entry2: entryById.get(m.entry2_id),
          entry1_score: m.entry1_score,
          entry2_score: m.entry2_score,
          status: m.status,
        }))
      );

      // Build bracket model if Semis/Final exist
      const semis = matches.filter((m) => m.round === "Semi-Finals");
      const final = matches.find((m) => m.round === "Final");
      if ((semis?.length || 0) >= 2 || final) {
        const model = { rounds: [{ name: "Semi-Finals", matches: ["sf1", "sf2"] }, { name: "Final", matches: ["final"] }], matches: [] };
        const s1 = semis?.[0];
        const s2 = semis?.[1];
        model.matches.push({
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
        model.matches.push({
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
        model.matches.push({
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
        setBracket(model);
      } else {
        setBracket(null);
      }

      // Determine admin and status
      setStatus(tRow?.status || null);
      setTournamentName(tRow?.name || "");
      setTournamentDate(tRow?.date || "");
      if (tRow?.status === "completed") {
        window.location.replace(`/past-events/${tournamentId}`);
        return;
      }
      const user = userRes?.data?.user;
      if (user && spaceId) {
        const { data: mem } = await supabase
          .from("space_members")
          .select("role")
          .eq("space_id", spaceId)
          .eq("user_id", user.id)
          .maybeSingle();
        setIsAdmin(mem?.role === "admin");
      } else {
        setIsAdmin(false);
      }
    })();
  }, [tournamentId]);

  // Derive group labels and per-group matches
  const groupLabels = useMemo(
    () => Array.from(new Set(matches.map((m) => m.round).filter((r) => r?.startsWith("Group ")))),
    [matches]
  );

  const matchesByGroup = useMemo(() => {
    return groupLabels.map((label) => matches.filter((m) => m.round === label));
  }, [groupLabels, matches]);

  const standingsByGroup = useMemo(() => {
    return matchesByGroup.map((gm) => computeStandings(gm));
  }, [matchesByGroup]);

  return (
    <div className="mx-auto max-w-3xl p-4">
      <header className="mb-4">
        <h1 className="text-xl font-bold">{tournamentName || "Live Tournament"}</h1>
        {tournamentDate && (
          <div className="text-sm text-foreground/70">{new Date(tournamentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
        )}
        {status === "completed" && (
          <div className="mt-1 inline-flex items-center rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs text-accent">Completed</div>
        )}
        {isAdmin && (
          <a className="mt-2 block text-sm text-brand underline" href={`/t/${tournamentId}/manage`}>
            Admin: Manage & Enter Scores
          </a>
        )}
      </header>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <div className="text-base font-semibold">Group Standings</div>
          </CardHeader>
          <CardContent>
            {groupLabels.length === 0 ? (
              <p className="text-sm text-foreground/70">No groups yet.</p>
            ) : (
              <div className="grid gap-4">
                {standingsByGroup.map((standings, gi) => (
                  <div key={gi} className="rounded-md border border-black/10">
                    <div className="border-b bg-black/5 px-4 py-2 text-sm font-semibold">{groupLabels[gi]}</div>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-foreground/60">
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Entry</th>
                          <th className="px-3 py-2">GW</th>
                          <th className="px-3 py-2">GL</th>
                          <th className="px-3 py-2">GD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((s) => (
                          <tr key={s.entryId}>
                            <td className="px-3 py-2">{s.rank}</td>
                            <td className="px-3 py-2">{s.entry.name}</td>
                            <td className="px-3 py-2">{s.gamesWon}</td>
                            <td className="px-3 py-2">{s.gamesLost}</td>
                            <td className="px-3 py-2">{s.gameDiff}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base font-semibold">Match Checklist</div>
          </CardHeader>
          <CardContent>
            {groupLabels.length === 0 ? (
              <p className="text-sm text-foreground/70">No matches.</p>
            ) : (
              <div className="space-y-2">
                {matchesByGroup.map((gm, gi) => (
                  <div key={gi}>
                    <div className="mb-2 text-sm font-semibold">{groupLabels[gi]}</div>
                    <ul className="space-y-2 text-sm">
                      {gm.map((m) => (
                        <li key={m.id} className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2">
                          <div>
                            {m.entry1?.name} <span className="text-foreground/50">vs</span> {m.entry2?.name}
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
            )}
          </CardContent>
        </Card>
        {bracket && (
          <Card>
            <CardHeader>
              <div className="text-base font-semibold">Knockout</div>
              <div className="text-xs text-foreground/60">Semi-Finals & Final</div>
            </CardHeader>
            <CardContent>
              <Bracket model={bracket} />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}


