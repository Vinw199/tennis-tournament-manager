"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "../../../../../components/ui/Card";
import Button from "../../../../../components/ui/Button";
import ScoreModal from "../../../../../components/score/ScoreModal";
import ConfirmDialog from "../../../../../components/ui/ConfirmDialog";
import { computeStandings } from "../../../../../lib/standings";
import { generateRoundRobinMatchesForGroup } from "../../../../../lib/tournament";
import { createSemisFinalBracket } from "../../../../../lib/bracket";
import Bracket from "../../../../../components/bracket/Bracket";
import { getTournament, saveTournament } from "../../../../../lib/localStore";

export default function ManageTournament({ params }) {
  const { tournamentId } = React.use(params);

  const [groups, setGroups] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tournament, setTournament] = useState(null);

  useEffect(() => {
    const t = getTournament(tournamentId);
    if (t) {
      setTournament(t);
      setGroups(t.groups || []);
      setMatches(
        (t.matches || []).map((m, idx) => ({
          ...m,
          id: m.id || `g_${idx}`,
          round: m.round || `Group ${String.fromCharCode(65 + (idx % 2))}`,
        }))
      );
    } else {
      // fallback for direct access
      const groupA = [
        { id: "e1", name: "Team A" },
        { id: "e2", name: "Team B" },
        { id: "e3", name: "Team C" },
      ];
      const groupB = [
        { id: "e4", name: "Team D" },
        { id: "e5", name: "Team E" },
        { id: "e6", name: "Team F" },
      ];
      setGroups([groupA, groupB]);
      const all = [];
      [groupA, groupB].forEach((entries, gi) => {
        const gm = generateRoundRobinMatchesForGroup(entries).map((m, j) => ({
          id: `g${gi}_${j}`,
          round: `Group ${String.fromCharCode(65 + gi)}`,
          entry1: m.entry1,
          entry2: m.entry2,
          entry1_score: null,
          entry2_score: null,
          status: "pending",
        }));
        all.push(...gm);
      });
      setMatches(all);
    }
  }, [tournamentId]);

  // Persist changes to local storage whenever matches (or groups) update
  useEffect(() => {
    if (!groups.length && !matches.length) return;
    const payload = {
      ...(tournament || {}),
      id: tournamentId,
      groups,
      matches,
    };
    saveTournament(payload);
  }, [groups, matches, tournamentId]);

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

  useEffect(() => {
    if (!allGroupMatchesCompleted) {
      setBracket(null);
      return;
    }
    const a = standingsByGroup[0] || [];
    const b = standingsByGroup[1] || [];
    const a1 = a.find((s) => s.rank === 1)?.entry;
    const a2 = a.find((s) => s.rank === 2)?.entry;
    const b1 = b.find((s) => s.rank === 1)?.entry;
    const b2 = b.find((s) => s.rank === 2)?.entry;
    if (!a1 || !a2 || !b1 || !b2) return;

    // Initialize or refresh bracket if participants changed
    if (!bracket) {
      setBracket(createSemisFinalBracket({ a1, a2, b1, b2 }));
      return;
    }
    const sf1 = bracket.matches.find((m) => m.id === "sf1");
    const sf2 = bracket.matches.find((m) => m.id === "sf2");
    const same =
      sf1?.slots[0].participant?.id === a1.id &&
      sf1?.slots[1].participant?.id === b2.id &&
      sf2?.slots[0].participant?.id === b1.id &&
      sf2?.slots[1].participant?.id === a2.id;
    if (!same) setBracket(createSemisFinalBracket({ a1, a2, b1, b2 }));
  }, [allGroupMatchesCompleted, standingsByGroup]);

  function openScore(m) {
    setActiveMatch(m);
    setShowModal(true);
  }

  function saveScore(data) {
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
      setShowModal(false);
      return;
    }
    // Otherwise update group stage matches
    setMatches((prev) => prev.map((m) => (m.id === activeMatch.id ? { ...m, ...data, status: "completed" } : m)));
    setShowModal(false);
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
          <p className="text-sm text-foreground/70">Tournament ID: {tournamentId}</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigator.clipboard.writeText(`${location.origin}/t/${tournamentId}/live`)}
        >
          Share Live Link
        </Button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="font-semibold">Match Checklist</div>
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
              <div className="flex items-center gap-2 text-xs text-foreground/60">
                <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-accent/60" />
                Top 2 qualify
              </div>
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


