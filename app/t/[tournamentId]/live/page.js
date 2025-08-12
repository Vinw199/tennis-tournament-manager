"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "../../../../components/ui/Card";
import { getTournament } from "../../../../lib/localStore";
import { computeStandings } from "../../../../lib/standings";

export default function LiveTournamentView({ params }) {
  const { tournamentId } = React.use(params);
  const [t, setT] = useState(null);

  useEffect(() => {
    setT(getTournament(tournamentId));
  }, [tournamentId]);

  const groups = t?.groups || [];
  const matches = t?.matches || [];

  const matchesByGroup = useMemo(() => {
    return groups.map((entries) => {
      const entryIds = new Set(entries.map((e) => e.id));
      return matches.filter((m) => entryIds.has(m.entry1.id) && entryIds.has(m.entry2.id));
    });
  }, [groups, matches]);

  const standingsByGroup = useMemo(() => {
    return matchesByGroup.map((gm) => computeStandings(gm));
  }, [matchesByGroup]);

  return (
    <div className="mx-auto max-w-3xl p-4">
      <header className="mb-4">
        <h1 className="text-xl font-bold">Live Tournament</h1>
        <p className="text-sm text-foreground/70">Tournament ID: {tournamentId}</p>
        <a className="mt-2 inline-flex text-sm text-brand underline" href={`/t/${tournamentId}/manage`}>
          Admin: Manage & Enter Scores
        </a>
      </header>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <div className="text-base font-semibold">Group Standings</div>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <p className="text-sm text-foreground/70">No groups yet.</p>
            ) : (
              <div className="grid gap-4">
                {standingsByGroup.map((standings, gi) => (
                  <div key={gi} className="rounded-md border border-black/10">
                    <div className="border-b bg-black/5 px-4 py-2 text-sm font-semibold">Group {String.fromCharCode(65 + gi)}</div>
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
            {groups.length === 0 ? (
              <p className="text-sm text-foreground/70">No matches.</p>
            ) : (
              <div className="space-y-2">
                {matchesByGroup.map((gm, gi) => (
                  <div key={gi}>
                    <div className="mb-2 text-sm font-semibold">Group {String.fromCharCode(65 + gi)}</div>
                    <ul className="space-y-2 text-sm">
                      {gm.map((m) => (
                        <li key={m.id} className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2">
                          <div>
                            {m.entry1.name} <span className="text-foreground/50">vs</span> {m.entry2.name}
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
      </section>
    </div>
  );
}


