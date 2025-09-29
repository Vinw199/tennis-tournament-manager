// path: app/(wizard)/tournaments/new/page.jsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "../../../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../../../components/ui/card";
import Stepper from "../../../../components/ui/Stepper";
import { Label } from "../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";

import { launchTournamentAction } from "../../../(wizard)/actions";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";

import {
  generateBalancedDoublesEntries,
  snakeSeedEntriesIntoGroups,
  generateRoundRobinMatchesForGroup,
  generateBalancedDoublesEntriesFromPools,
} from "../../../../domain/tournament";
import { getWizardDraftFromDbClient, upsertWizardDraftInDbClient, clearWizardDraftInDbClient } from "../../../../lib/wizard/draft.js";

import { getActiveSpaceId } from "@/lib/supabase/spaces";

const DEFAULT_GROUPS = 2;

export default function NewTournamentWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isHydratingDraft, setIsHydratingDraft] = useState(true); // whether the draft is being hydrated from Supabase
  const [isLoadingRoster, setIsLoadingRoster] = useState(true); // whether the roster is being loaded from Supabase
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  const [details, setDetails] = useState({
    name: "",
    date: new Date().toISOString().slice(0, 10),
    entryFee: "",
    prize: "",
    format: "League + Knockout",
    knockoutStage: "Semi-Finals",
    leagueMatchFormat: "Total 4 games",
  });
  const [roster, setRoster] = useState([]);
  
  // Load roster from Supabase for the current Space
  useEffect(() => {
    (async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const spaceId = await getActiveSpaceId();
      if (!spaceId) return;
      const { data } = await supabase
        .from("players")
        .select("id, name, default_skill_rank:default_skill_rank, age, gender")
        .eq("space_id", spaceId)
        .eq("is_active", true)
        .order("default_skill_rank", { ascending: true });
      const mapped = (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        skillRank: p.default_skill_rank,
        age: p.age,
        gender: p.gender,
      }));
      setRoster(mapped);
      setIsLoadingRoster(false);
    })();
  }, []);

  // Header button event from layout
  useEffect(() => {
    function onExit() {
      setShowExitDialog(true);
    }
    window.addEventListener('wizard:exit', onExit);
    return () => {
      window.removeEventListener('wizard:exit', onExit);
    };
  }, []);

  const [selectedPlayerIds, setSelectedPlayerIds] = useState(new Set());
  const [numberOfGroups, setNumberOfGroups] = useState(DEFAULT_GROUPS);
  const [pairsSeed, setPairsSeed] = useState(0); // pairs seed means the seed/rank for the pairs
  const [halfByPlayerId, setHalfByPlayerId] = useState(null); // { [playerId]: 'top'|'bottom' }

  // Hydrate from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const draft = await getWizardDraftFromDbClient();
      if (!cancelled) {
        if (draft) {
          setStep(draft.step ?? 1);
          setDetails((prev) => draft.details ?? prev);
          setSelectedPlayerIds(new Set(draft.selectedPlayerIds ?? []));
          setNumberOfGroups((prev) => draft.numberOfGroups ?? prev);
          setHalfByPlayerId(draft.halfByPlayerId ?? null);
        }
        setIsHydratingDraft(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Derived data for steps 3
  // Initialize recommended halves when entering step 3 or selection changes
  const selectedPlayers = useMemo(
    () => roster.filter((p) => selectedPlayerIds.has(p.id)).sort((a, b) => (a.skillRank ?? a.default_skill_rank) - (b.skillRank ?? b.default_skill_rank)),
    [roster, selectedPlayerIds]
  );

  const recommendedHalves = useMemo(() => {
    const mid = Math.ceil(selectedPlayers.length / 2);
    const topHalf = selectedPlayers.slice(0, mid);
    const bottomHalf = selectedPlayers.slice(mid);
    return { topHalf, bottomHalf };
  }, [selectedPlayers]);

  const { topHalf, bottomHalf } = useMemo(() => {
    if (!halfByPlayerId) return recommendedHalves;
    const topHalf = [];
    const bottomHalf = [];
    for (const p of selectedPlayers) {
      const half = halfByPlayerId[p.id];
      if (half === 'bottom') bottomHalf.push(p);
      else topHalf.push(p);
    }
    return { topHalf, bottomHalf };
  }, [halfByPlayerId, recommendedHalves, selectedPlayers]);

  // isBalanced means the top and bottom halves are balanced (size difference ≤ 1)
  const isBalanced = Math.abs(topHalf.length - bottomHalf.length) <= 1;

  const generatedEntries = useMemo(() => {
    if (topHalf.length < 1 || bottomHalf.length < 1) return [];
    // Include pairsSeed to reshuffle pairs on demand
    void pairsSeed;
    return generateBalancedDoublesEntriesFromPools({ topHalf, bottomHalf });
  }, [topHalf, bottomHalf, pairsSeed]);

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
    "Pools, Entries & Groups",
    "Review",
  ];

  const nameError = step === 1 && details.name.trim().length === 0;
  const canGoToStep2 = !nameError;

  function regeneratePairs() {
    setPairsSeed((s) => s + 1);
  }

  async function launchTournament() {
    const entries = generatedEntries.map((e) => ({ name: e.name }));
    // Build matches referencing entries by index within their group list
    const entryIndexById = new Map();
    generatedEntries.forEach((e, i) => entryIndexById.set(e.id, i + 1)); // 1-based index for SQL array access
    const matches = checklist.flatMap((groupMatches, gi) =>
      groupMatches.map((m) => ({
        round: `Group ${String.fromCharCode(65 + gi)}`,
        entry1_index: entryIndexById.get(m.entry1.id),
        entry2_index: entryIndexById.get(m.entry2.id),
      }))
    );
    const { tournamentId, error } = await launchTournamentAction({
      name: details.name,
      date: details.date,
      entryFee: details.entryFee,
      prize: details.prize,
      settings: { leagueMatchFormat: details.leagueMatchFormat, groups: numberOfGroups },
      entries,
      matches,
    });
    if (error) {
      alert(`Failed to launch: ${error}`);
      return;
    }
    clearWizardDraftInDbClient();
    router.push(`/t/${tournamentId}/manage`);
  }

  // Draft state payload for explicit saves
  const draft = {
    step,
    details,
    selectedPlayerIds: Array.from(selectedPlayerIds),
    numberOfGroups,
    halfByPlayerId,
  };

  async function saveDraft(nextStep) {
    const payload = nextStep ? { ...draft, step: nextStep } : draft;
    await upsertWizardDraftInDbClient(payload);
  }

  async function goToStep(nextStep) {
    setStep(nextStep);
    await saveDraft(nextStep);
  }

  if (isHydratingDraft || isLoadingRoster) {
    const { Skeleton } = require("../../../../components/ui/skeleton");
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold">New Tournament</div>
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-8 w-full" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-2xl font-bold">New Tournament {step ? `(Step ${step})` : ""}</h1>
      <Stepper steps={steps} current={step} />

      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="font-semibold">Step 1: Details & Format</div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="text-sm">
                <Label className="mb-1 text-foreground/70 block">Tournament Name</Label>
                <input className="w-full rounded-md border px-3 py-2" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
                {nameError && <div className="mt-1 text-xs text-red-600">Name is required.</div>}
              </div>
              <div className="text-sm">
                <Label className="mb-1 text-foreground/70 block">Date</Label>
                <input type="date" className="w-full rounded-md border px-3 py-2" value={details.date} onChange={(e) => setDetails({ ...details, date: e.target.value })} />
              </div>
              <div className="text-sm">
                <Label className="mb-1 text-foreground/70 block">Entry Fee per Player</Label>
                <input className="w-full rounded-md border px-3 py-2" value={details.entryFee} onChange={(e) => setDetails({ ...details, entryFee: e.target.value })} />
              </div>
              <div className="text-sm">
                <Label className="mb-1 text-foreground/70 block">Prize Money Details</Label>
                <input className="w-full rounded-md border px-3 py-2" value={details.prize} onChange={(e) => setDetails({ ...details, prize: e.target.value })} />
              </div>
              <div className="text-sm">
                <Label className="mb-1 text-foreground/70 block">Format</Label>
                <Select value={details.format} onValueChange={(v) => setDetails({ ...details, format: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="League + Knockout">League + Knockout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm">
                <Label className="mb-1 text-foreground/70 block">Knockout Stage</Label>
                <Select value={details.knockoutStage} onValueChange={(v) => setDetails({ ...details, knockoutStage: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semi-Finals">Semi-Finals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm md:col-span-2">
                <Label className="mb-1 text-foreground/70 block">League Match Format</Label>
                <input className="w-full rounded-md border px-3 py-2" value={details.leagueMatchFormat} onChange={(e) => setDetails({ ...details, leagueMatchFormat: e.target.value })} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button onClick={() => goToStep(2)} disabled={!canGoToStep2}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="font-semibold">Step 2: Select Players
                <span className="ml-2 text-xs font-normal text-foreground/60">{selectedPlayerIds.size}/{roster.length} selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedPlayerIds(new Set(roster.map((p) => p.id)))}
                  disabled={roster.length > 0 && selectedPlayerIds.size === roster.length}
                >
                  Select all
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedPlayerIds(new Set())}
                  disabled={selectedPlayerIds.size === 0}
                >
                  Clear all
                </Button>
              </div>
            </div>
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
              <Button variant="secondary" onClick={() => goToStep(1)}>
                Back
              </Button>
              <div className="text-xs text-foreground/60">Select at least 4 players to continue.</div>
              <Button onClick={() => goToStep(3)} disabled={selectedPlayerIds.size < 4}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="font-semibold">Step 3: Pools, Entries & Groups</div>
          </CardHeader>
          <CardContent>
            {/* Pools editor */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">Top/Bottom Pools</div>
                <div className={"text-xs font-medium " + (isBalanced ? "text-green-700" : "text-red-600")}>{isBalanced ? "Balanced" : "Unbalanced"}</div>
              </div>
              {!halfByPlayerId && (
                <div className="mb-2 text-xs text-foreground/60">Using recommended split by rank. You can adjust below.</div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-black/10">
                  <div className="border-b bg-black/5 px-4 py-2 text-sm font-semibold flex items-center justify-between">
                    <span>Top Pool ({topHalf.length})</span>
                    <Button
                      aria-label="Reset pools to recommended"
                      title="Restore recommended split by rank"
                      variant="secondary"
                      onClick={() => setHalfByPlayerId(Object.fromEntries(recommendedHalves.topHalf.map(p => [p.id,'top']).concat(recommendedHalves.bottomHalf.map(p => [p.id,'bottom']))))}
                    >
                      Reset
                    </Button>
                  </div>
                  <ul className="px-4 py-3 text-sm">
                    {topHalf.map((p) => (
                      <li key={p.id} className="flex items-center justify-between py-1">
                        <span>#{p.skillRank ?? p.default_skill_rank} {p.name}</span>
                        <Button aria-label={`Move ${p.name} to Bottom pool`} variant="secondary" onClick={() => setHalfByPlayerId((prev) => ({ ...(prev || {}), [p.id]: 'bottom' }))}>Move to Bottom</Button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md border border-black/10">
                  <div className="border-b bg-black/5 px-4 py-2 text-sm font-semibold">Bottom Pool ({bottomHalf.length})</div>
                  <ul className="px-4 py-3 text-sm">
                    {bottomHalf.map((p) => (
                      <li key={p.id} className="flex items-center justify-between py-1">
                        <span>#{p.skillRank ?? p.default_skill_rank} {p.name}</span>
                        <Button aria-label={`Move ${p.name} to Top pool`} variant="secondary" onClick={() => setHalfByPlayerId((prev) => ({ ...(prev || {}), [p.id]: 'top' }))}>Move to Top</Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {/* Balance validation */}
              {!isBalanced && (
                <div className="mt-2 text-xs text-red-600">Pools should be balanced (size difference ≤ 1) for best pairing.</div>
              )}
            </div>

            {/* Entries & Groups */}
            <div className="mb-1 flex items-center justify-between">
              <div className="text-sm text-foreground/70">
                Generated entries: {generatedEntries.length}
                <span className="ml-2 text-foreground/50">(based on current pools)</span>
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
              <Button variant="ghost" onClick={regeneratePairs} disabled={!isBalanced || generatedEntries.length === 0}>
                Regenerate Pairs
              </Button>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <Button variant="secondary" onClick={() => goToStep(2)}>
                Back
              </Button>
              <div className="text-xs text-foreground/60">
                {!isBalanced && <span>Balance pools to continue.</span>}
                {isBalanced && generatedEntries.length === 0 && <span>No entries yet.</span>}
              </div>
              <Button onClick={() => goToStep(4)} disabled={!groups.length || !isBalanced}>Next</Button>
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
              <Button variant="secondary" onClick={() => goToStep(3)}>
                Back
              </Button>
              <Button onClick={launchTournament} disabled={
                !details.name.trim() ||
                selectedPlayerIds.size < 4 ||
                !generatedEntries.length ||
                !groups.length ||
                !isBalanced
              }>Launch Tournament</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={showExitDialog}
        title="Exit Draft"
        description="Do you want to save before exiting?"
        confirmLabel="Save & Exit"
        cancelLabel="Discard"
        onConfirm={async () => { await saveDraft(); setShowExitDialog(false); router.push("/"); }}
        onCancel={async () => { await clearWizardDraftInDbClient(); setShowExitDialog(false); router.push("/"); }}
      />
    </div>
  );
}



