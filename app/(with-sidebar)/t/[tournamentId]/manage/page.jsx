"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "../../../../../components/ui/Card";
import Button from "../../../../../components/ui/Button";
import ScoreModal from "../../../../../components/score/ScoreModal";
import ConfirmDialog from "../../../../../components/ui/ConfirmDialog";
import { computeStandings } from "../../../../../domain/tournament/standings";
import { createSemisFinalBracket } from "../../../../../domain/tournament/bracket";
import Bracket from "../../../../../components/bracket/Bracket";
import { createClient } from "@/utils/supabase/client";
import { completeTournamentAction, createFinalAction, createSemisAction } from "../../../../t/actions";

export default function ManageTournament({ params }) {
  const { tournamentId } = React.use(params);

  const [groups, setGroups] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const supabase = createClient();
        const spaceId = process.env.NEXT_PUBLIC_SPACE_ID;
        // Determine admin
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes?.user;
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

        // Fetch entries and matches for this tournament
        const [{ data: entries, error: e1 }, { data: matches, error: e2 }] = await Promise.all([
          supabase.from("entries").select("id,name").eq("tournament_id", tournamentId),
          supabase
            .from("matches")
            .select("id, round, entry1_id, entry2_id, entry1_score, entry2_score, status")
            .eq("tournament_id", tournamentId),
        ]);
        if (e1 || e2) throw new Error(e1?.message || e2?.message || "Failed to load");
        if (!entries || !matches) throw new Error("Not found");

        const entryById = new Map(entries.map((e) => [e.id, e]));
        const hydratedMatches = matches.map((m) => ({
          id: m.id,
          round: m.round,
          entry1: entryById.get(m.entry1_id),
          entry2: entryById.get(m.entry2_id),
          entry1_score: m.entry1_score,
          entry2_score: m.entry2_score,
          status: m.status,
        }));

        // Derive groups from matches: collect unique entries per round that starts with "Group "
        const groupLabels = Array.from(new Set(hydratedMatches.map((m) => m.round).filter((r) => r?.startsWith("Group "))));
        const derivedGroups = groupLabels.map((label) => {
          const set = new Map();
          hydratedMatches
            .filter((m) => m.round === label)
            .forEach((m) => {
              if (m.entry1) set.set(m.entry1.id, m.entry1);
              if (m.entry2) set.set(m.entry2.id, m.entry2);
            });
          return Array.from(set.values());
        });

        // Fetch tournament status
        const { data: tRow } = await supabase
          .from("tournaments")
          .select("id, status")
          .eq("id", tournamentId)
          .maybeSingle();
        setTournament(tRow || { id: tournamentId });
        setGroups(derivedGroups);
        setMatches(hydratedMatches);
      } catch (err) {
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, [tournamentId]);

  // No local persistence; DB is source of truth

  const [activeMatch, setActiveMatch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [forfeitMatch, setForfeitMatch] = useState(null);

  const standingsByGroup = useMemo(() => {
    // compute per group from matches
    return groups.map((entries, gi) => {
      const groupMatches = matches.filter((m) => m.round === `Group ${String.fromCharCode(65 + gi)}`);
      return computeStandings(groupMatches);
    });
  }, [groups, matches]);

  const allGroupMatchesCompleted = useMemo(() => {
    const groupRounds = groups.map((_, gi) => `Group ${String.fromCharCode(65 + gi)}`);
    return matches
      .filter((m) => groupRounds.includes(m.round))
      .every((m) => m.status === "completed");
  }, [groups, matches]);

  const [bracket, setBracket] = useState(null);
  const [bracketRefresh, setBracketRefresh] = useState(0);
  const [semisExist, setSemisExist] = useState(false);
  const [semisCompleted, setSemisCompleted] = useState(false);
  const [finalCompleted, setFinalCompleted] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      // Build bracket model from DB if present; otherwise scaffold with TBD
      const { data: entries } = await supabase.from("entries").select("id,name").eq("tournament_id", tournamentId);
      const entryById = new Map(entries?.map((e) => [e.id, e]) || []);

      const { data: semis } = await supabase
        .from("matches")
        .select("id, entry1_id, entry2_id, entry1_score, entry2_score, status")
        .eq("tournament_id", tournamentId)
        .eq("round", "Semi-Finals");
      const hasSemis = Array.isArray(semis) && semis.length >= 2;
      const semisDone = !!hasSemis && semis.every((m) => m.status === "completed" && typeof m.entry1_score === "number" && typeof m.entry2_score === "number");
      setSemisExist(hasSemis);
      setSemisCompleted(semisDone);
      const { data: final } = await supabase
        .from("matches")
        .select("id, entry1_id, entry2_id, entry1_score, entry2_score, status")
        .eq("tournament_id", tournamentId)
        .eq("round", "Final")
        .maybeSingle();

      const model = { rounds: [{ name: "Semi-Finals", matches: ["sf1", "sf2"] }, { name: "Final", matches: ["final"] }], matches: [] };

      // Semis (use DB if available; else TBD)
      const s1 = semis?.[0];
      const s2 = semis?.[1];
      model.matches.push({
        id: "sf1",
        dbId: s1?.id || null,
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
        dbId: s2?.id || null,
        name: "Semi-Final 2",
        slots: [
          { participant: s2 ? entryById.get(s2.entry1_id) : null },
          { participant: s2 ? entryById.get(s2.entry2_id) : null },
        ],
        entry1_score: s2?.entry1_score ?? null,
        entry2_score: s2?.entry2_score ?? null,
        status: s2?.status ?? "pending",
      });

      // Final (use DB if available; else TBD with sources)
      model.matches.push({
        id: "final",
        dbId: final?.id || null,
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
      const done = final && final.status === "completed" && typeof final.entry1_score === "number" && typeof final.entry2_score === "number";
      setFinalCompleted(!!done);
    })();
  }, [allGroupMatchesCompleted, bracketRefresh, tournamentId]);

  function openScore(m) {
    setActiveMatch(m);
    setShowModal(true);
  }

  async function saveScore(data) {
    if (!isAdmin) {
      alert("Only admins can record scores.");
      setShowModal(false);
      return;
    }
    if (!activeMatch) return;
    // Try bracket first
    if (bracket && bracket.matches.some((m) => m.id === activeMatch.id)) {
      setBracket((prev) => ({
        ...prev,
        matches: prev.matches.map((m) =>
          m.id === activeMatch.id
            ? { ...m, ...data, status: "completed" }
            : m
        ),
      }));
      // Persist bracket match score to DB if mapped
      const supabase = createClient();
      if (activeMatch.dbId) {
        await supabase
          .from("matches")
          .update({ entry1_score: data.entry1_score, entry2_score: data.entry2_score, status: "completed" })
          .eq("id", activeMatch.dbId);
      }
      // Refresh bracket from DB
      setShowModal(false);
      setBracketRefresh((x) => x + 1);
      return;
    }
    // Otherwise update group stage matches
    setMatches((prev) => prev.map((m) => (m.id === activeMatch.id ? { ...m, ...data, status: "completed" } : m)));
    // Persist to DB
    const supabase = createClient();
    await supabase
      .from("matches")
      .update({ entry1_score: data.entry1_score, entry2_score: data.entry2_score, status: "completed" })
      .eq("id", activeMatch.id);
    setShowModal(false);
  }

  async function handleGenerateSemis() {
    const res = await createSemisAction({ tournamentId });
    if (res?.error) {
      alert(res.error);
      return;
    }
    setBracketRefresh((x) => x + 1);
  }

  async function handleGenerateFinal() {
    const res = await createFinalAction({ tournamentId });
    if (res?.error) {
      alert(res.error);
      return;
    }
    setBracketRefresh((x) => x + 1);
  }

  function requestForfeit(m, winnerEntryId) {
    setForfeitMatch({ match: m, winnerEntryId });
  }

  function confirmForfeit() {
    const { match: m, winnerEntryId } = forfeitMatch || {};
    if (!m) return;
    const entry1Wins = m.entry1.id === winnerEntryId;
    setMatches((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? {
              ...x,
              entry1_score: entry1Wins ? 4 : 0,
              entry2_score: entry1Wins ? 0 : 4,
              status: "completed",
            }
          : x
      )
    );
    setForfeitMatch(null);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Tournament</h1>
          {/* Removed public display of internal ID */}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigator.clipboard.writeText(`${location.origin}/t/${tournamentId}/live`)}
          >
            Share Live Link
          </Button>
          {isAdmin && (
            <Button
              variant="primary"
              disabled={!finalCompleted}
              onClick={async () => {
                const res = await completeTournamentAction({ tournamentId });
                if (res?.error) return alert(res.error);
                location.href = "/past-events";
              }}
            >
              Complete Tournament
            </Button>
          )}
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="font-semibold">Match Checklist</div>
              {isAdmin && tournament?.status !== "completed" && (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={handleGenerateSemis} disabled={!allGroupMatchesCompleted}>Generate Semis</Button>
                  <Button variant="secondary" onClick={handleGenerateFinal} disabled={!semisExist || !semisCompleted}>Generate Final</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groups.map((_, gi) => (
                <div key={gi}>
                  <div className="mb-2 text-sm font-semibold">Group {String.fromCharCode(65 + gi)}</div>
                  <ul className="space-y-2 text-sm">
                    {matches
                      .filter((m) => m.round === `Group ${String.fromCharCode(65 + gi)}`)
                      .map((m) => (
                        <li key={m.id} className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2">
                          <div>
                            {m.entry1.name} <span className="text-foreground/50">vs</span> {m.entry2.name}
                            {m.status === "completed" && (
                              <span className="ml-2 text-foreground/60">({m.entry1_score} - {m.entry2_score})</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                          <Button onClick={() => openScore(m)}>{m.status === "completed" ? "Edit Score" : "Enter Score"}</Button>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="font-semibold">Standings</div>
              {tournament?.status !== "completed" && (
                <div className="flex items-center gap-2 text-xs text-foreground/60">
                  <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-accent/60" />
                  Top 2 qualify
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
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
                      {standings.map((s) => {
                        const isQualifier = s.rank <= 2;
                        return (
                          <tr
                            key={s.entryId}
                            className={
                              isQualifier
                                ? "bg-accent/10 text-foreground"
                                : ""
                            }
                          >
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span>{s.rank}</span>
                                {isQualifier && (
                                  <span className="rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">Q</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">{s.entry.name}</td>
                            <td className="px-3 py-2">{s.gamesWon}</td>
                            <td className="px-3 py-2">{s.gamesLost}</td>
                            <td className="px-3 py-2">{s.gameDiff}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ScoreModal
        open={showModal}
        match={activeMatch}
        onClose={() => setShowModal(false)}
        onSave={saveScore}
        onForfeit={(m, winnerId) => requestForfeit(m, winnerId)}
      />

      <ConfirmDialog
        open={!!forfeitMatch}
        title="Award Forfeit"
        description={
          forfeitMatch
            ? `Confirm awarding a forfeit win to ${
                forfeitMatch.winnerEntryId === forfeitMatch.match.entry1.id
                  ? forfeitMatch.match.entry1.name
                  : forfeitMatch.match.entry2.name
              }?`
            : ""
        }
        confirmLabel="Award"
        onCancel={() => setForfeitMatch(null)}
        onConfirm={confirmForfeit}
      />

      {bracket && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="font-semibold">Knockout Preview</div>
              <div className="text-xs text-foreground/60">Semi-Finals & Final</div>
            </CardHeader>
            <CardContent>
              <Bracket
                model={bracket}
                onOpenScore={(m) => {
                  // Open the standard score modal on bracket matches
                  setActiveMatch({
                    id: m.id,
                    dbId: m.dbId || null,
                    round: m.name,
                    entry1: m.slots[0].participant,
                    entry2: m.slots[1].participant,
                    entry1_score: m.entry1_score,
                    entry2_score: m.entry2_score,
                    status: m.status,
                  });
                  setShowModal(true);
                }}
              />
              {(() => {
                const final = bracket.matches.find((m) => m.id === "final");
                const done =
                  final?.status === "completed" &&
                  typeof final.entry1_score === "number" &&
                  typeof final.entry2_score === "number";
                if (!done) return null;
                const winner =
                  final.entry1_score > final.entry2_score
                    ? final.slots[0].participant
                    : final.slots[1].participant;
                return (
                  <div className="mt-4 rounded-md border border-accent/40 bg-accent/10 p-3 text-sm">
                    <div className="font-semibold text-accent">Winner</div>
                    <div>{winner?.name}</div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


