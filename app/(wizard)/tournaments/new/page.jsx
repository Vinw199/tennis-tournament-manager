"use client";

import { useMemo, useState } from "react";
import Button from "../../../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../../../components/ui/Card";
import Stepper from "../../../../components/ui/Stepper";
import Modal from "../../../../components/ui/Modal";
import { useRouter } from "next/navigation";
import { saveTournament } from "../../../../lib/localStore";
import {
  generateBalancedDoublesEntries,
  snakeSeedEntriesIntoGroups,
  generateRoundRobinMatchesForGroup,
} from "../../../../lib/tournament";

const DEFAULT_GROUPS = 2;

export default function NewTournamentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({
    name: "",
    date: new Date().toISOString().slice(0, 10),
    entryFee: "",
    prize: "",
    format: "League + Knockout",
    knockoutStage: "Semi-Finals",
    leagueMatchFormat: "Total 4 games",
  });

  const [roster] = useState(() => [
    { id: "p1", name: "Player 1", skillRank: 1, age: 28, gender: "M" },
    { id: "p2", name: "Player 2", skillRank: 2, age: 29, gender: "M" },
    { id: "p3", name: "Player 3", skillRank: 3, age: 27, gender: "F" },
    { id: "p4", name: "Player 4", skillRank: 4, age: 30, gender: "F" },
    { id: "p5", name: "Player 5", skillRank: 5, age: 26, gender: "M" },
    { id: "p6", name: "Player 6", skillRank: 6, age: 25, gender: "M" },
  ]);

  const [selectedPlayerIds, setSelectedPlayerIds] = useState(new Set());
  const [numberOfGroups, setNumberOfGroups] = useState(DEFAULT_GROUPS);

  // Derived data for steps 3
  const generatedEntries = useMemo(() => {
    const selectedPlayers = roster.filter((p) => selectedPlayerIds.has(p.id));
    if (selectedPlayers.length < 2) return [];
    return generateBalancedDoublesEntries({ players: selectedPlayers });
  }, [roster, selectedPlayerIds]);

  const groups = useMemo(() => {
    if (!generatedEntries.length) return [];
    return snakeSeedEntriesIntoGroups({ entries: generatedEntries, numberOfGroups });
  }, [generatedEntries, numberOfGroups]);

  const checklist = useMemo(() => {
    if (!groups.length) return [];
    return groups.map((g) => generateRoundRobinMatchesForGroup(g));
  }, [groups]);

  const steps = [
    "Details",
    "Players",
    "Entries & Groups",
    "Review",
  ];

  const nameError = step === 1 && details.name.trim().length === 0;
  const canGoToStep2 = !nameError;

  function regeneratePairs() {
    // Trigger recompute by toggling selection set reference
    setSelectedPlayerIds(new Set(selectedPlayerIds));
  }

  function launchTournament() {
    const id = `t_${Date.now()}`;
    // Flatten model for manage page
    const payload = {
      id,
      details,
      roster,
      selectedPlayerIds: Array.from(selectedPlayerIds),
      generatedEntries,
      numberOfGroups,
      groups,
      matches: checklist.flatMap((groupMatches, gi) =>
        groupMatches.map((m, j) => ({
          id: `g${gi}_${j}`,
          round: `Group ${String.fromCharCode(65 + gi)}`,
          entry1: m.entry1,
          entry2: m.entry2,
          entry1_score: null,
          entry2_score: null,
          status: "pending",
        }))
      ),
    };
    saveTournament(payload);
    router.push(`/t/${id}/manage`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-2xl font-bold">New Tournament</h1>
      <Stepper steps={steps} current={step} />

      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="font-semibold">Step 1: Details & Format</div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <div className="mb-1 text-foreground/70">Tournament Name</div>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                />
                {nameError && (
                  <div className="mt-1 text-xs text-red-600">Name is required.</div>
                )}
              </label>
              <label className="text-sm">
                <div className="mb-1 text-foreground/70">Date</div>
                <input
                  type="date"
                  className="w-full rounded-md border px-3 py-2"
                  value={details.date}
                  onChange={(e) => setDetails({ ...details, date: e.target.value })}
                />
              </label>
              <label className="text-sm">
                <div className="mb-1 text-foreground/70">Entry Fee per Player</div>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={details.entryFee}
                  onChange={(e) => setDetails({ ...details, entryFee: e.target.value })}
                />
              </label>
              <label className="text-sm">
                <div className="mb-1 text-foreground/70">Prize Money Details</div>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={details.prize}
                  onChange={(e) => setDetails({ ...details, prize: e.target.value })}
                />
              </label>
              <label className="text-sm">
                <div className="mb-1 text-foreground/70">Format</div>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={details.format}
                  onChange={(e) => setDetails({ ...details, format: e.target.value })}
                >
                  <option>League + Knockout</option>
                </select>
              </label>
              <label className="text-sm">
                <div className="mb-1 text-foreground/70">Knockout Stage</div>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={details.knockoutStage}
                  onChange={(e) => setDetails({ ...details, knockoutStage: e.target.value })}
                >
                  <option>Semi-Finals</option>
                </select>
              </label>
              <label className="text-sm md:col-span-2">
                <div className="mb-1 text-foreground/70">League Match Format</div>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={details.leagueMatchFormat}
                  onChange={(e) =>
                    setDetails({ ...details, leagueMatchFormat: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button onClick={() => setStep(2)} disabled={!canGoToStep2}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="font-semibold">Step 2: Select Players</div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {roster.map((p) => {
                const checked = selectedPlayerIds.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                      checked ? "border-brand bg-brand/5" : "border-black/10 bg-white"
                    }`}
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-foreground/60">Rank {p.skillRank} · {p.gender} · {p.age}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(selectedPlayerIds);
                        if (e.target.checked) next.add(p.id);
                        else next.delete(p.id);
                        setSelectedPlayerIds(next);
                      }}
                    />
                  </label>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={selectedPlayerIds.size < 4}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="font-semibold">Step 3: Entries & Groups</div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-foreground/70">
                Generated entries: {generatedEntries.length}
              </div>
              <label className="text-sm">
                <span className="mr-2 text-foreground/70">Number of Groups</span>
                <select
                  className="rounded-md border px-2 py-1"
                  value={numberOfGroups}
                  onChange={(e) => setNumberOfGroups(Number(e.target.value))}
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {groups.map((g, idx) => (
                <div key={idx} className="rounded-md border border-black/10">
                  <div className="border-b bg-black/5 px-4 py-2 text-sm font-semibold">Group {String.fromCharCode(65 + idx)}</div>
                  <ul className="px-4 py-3 text-sm">
                    {g.map((e) => (
                      <li key={e.id} className="flex items-center justify-between py-1">
                        <span>{e.name}</span>
                        <span className="text-foreground/60">Avg Rank {e.averageRank}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={regeneratePairs}>
                Regenerate Pairs
              </Button>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={!groups.length}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <div className="font-semibold">Step 4: Review & Launch</div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-semibold">Summary</div>
                <ul className="text-sm text-foreground/70">
                  <li>Name: {details.name || "—"}</li>
                  <li>Date: {details.date}</li>
                  <li>Format: {details.format}</li>
                  <li>Knockout: {details.knockoutStage}</li>
                  <li>League Format: {details.leagueMatchFormat}</li>
                  <li>Groups: {numberOfGroups}</li>
                </ul>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold">Match Checklist (per group)</div>
                {checklist.map((groupMatches, idx) => (
                  <div key={idx} className="mb-3 rounded-md border border-black/10">
                    <div className="border-b bg-black/5 px-3 py-2 text-xs font-semibold">Group {String.fromCharCode(65 + idx)}</div>
                    <ul className="px-3 py-2 text-xs">
                      {groupMatches.map((m, i) => (
                        <li key={i} className="py-0.5">
                          {m.entry1.name} vs {m.entry2.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <Button variant="secondary" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button onClick={launchTournament}>Launch Tournament</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



