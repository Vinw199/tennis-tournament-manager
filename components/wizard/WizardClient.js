"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Stepper from "@/components/ui/Stepper";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// local imports
import Step1Details from "@/components/wizard/steps/Step1Details";
import Step2Players from "@/components/wizard/steps/Step2Players";
import Step3Pools from "@/components/wizard/steps/Step3Pools";
import Step4Review from "@/components/wizard/steps/Step4Review";

import { launchTournamentAction } from "@/app/(wizard)/actions";
import { getWizardDraftFromDbClient, upsertWizardDraftInDbClient, clearWizardDraftInDbClient } from "@/lib/wizard/draft.js";
import { generateBalancedDoublesEntriesFromPools, snakeSeedEntriesIntoGroups, generateRoundRobinMatchesForGroup } from "@/domain/tournament";

const DEFAULT_GROUPS = 2;
const defaultDetails = {
    name: "",
    date: new Date().toISOString().slice(0, 10),
    entryFee: "",
    prize: "",
    format: "League + Knockout",
    knockoutStage: "Semi-Finals",
    leagueMatchFormat: "Total 4 games",
};

export default function WizardClient({ initialRoster = [], initialDraft = null }) {
    const router = useRouter();
    const [showExitDialog, setShowExitDialog] = useState(false);

    // --- State Initialization from Server Props ---
    const [step, setStep] = useState(initialDraft?.step ?? 1);
    const [details, setDetails] = useState(initialDraft?.details ?? defaultDetails);
    const [roster, setRoster] = useState(initialRoster);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState(new Set(initialDraft?.selectedPlayerIds ?? []));
    const [numberOfGroups, setNumberOfGroups] = useState(initialDraft?.numberOfGroups ?? DEFAULT_GROUPS);
    const [halfByPlayerId, setHalfByPlayerId] = useState(initialDraft?.halfByPlayerId ?? null);
    const [isLaunching, setIsLaunching] = useState(false); // new state for launching tournament

    const [pairsSeed, setPairsSeed] = useState(0);

    // --- Event listener for exit button in layout ---
    useEffect(() => {
        function onExit() {
            setShowExitDialog(true);
        }
        window.addEventListener('wizard:exit', onExit);
        return () => window.removeEventListener('wizard:exit', onExit);
    }, []);

    // --- All derived data logic remains the same ---
    const selectedPlayers = useMemo(
        () => roster.filter((p) => selectedPlayerIds.has(p.id)).sort((a, b) => (a.skillRank ?? a.default_skill_rank) - (b.skillRank ?? b.default_skill_rank)),
        [roster, selectedPlayerIds]
    );
    // ... (rest of the useMemo hooks are unchanged)

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

    const isBalanced = Math.abs(topHalf.length - bottomHalf.length) <= 1;

    const generatedEntries = useMemo(() => {
        if (topHalf.length < 1 || bottomHalf.length < 1) return [];
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


    // --- All event handlers and actions remain the same ---
    const steps = ["Details", "Players", "Pools, Entries & Groups", "Review"];
    const nameError = step === 1 && details.name.trim().length === 0;
    const canGoToStep2 = !nameError;

    // 1. DEFINE completedStep
    const completedStep = useMemo(() => {
        if (details.name.trim().length === 0) return 0; // Step 1 is not complete
        if (selectedPlayerIds.size < 4) return 1; // Step 2 is not complete
        if (!isBalanced || generatedEntries.length === 0) return 2; // Step 3 is not complete
        return 3; // All prerequisite steps for review are complete
    }, [details.name, selectedPlayerIds.size, isBalanced, generatedEntries.length]);

    function regeneratePairs() {
        setPairsSeed((s) => s + 1);
    }

    async function launchTournament() {
        try {
            setIsLaunching(true); // set isLaunching to true when launching tournament
            const entries = generatedEntries.map((e) => ({ name: e.name }));
            const entryIndexById = new Map();
            generatedEntries.forEach((e, i) => entryIndexById.set(e.id, i + 1));
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
                throw new Error(`Failed to launch: ${error}`);
            }
            await clearWizardDraftInDbClient();
            router.push(`/t/${tournamentId}/manage`);
        } catch (error) {
            throw new Error(`Failed to launch: ${error}`);
        } finally {
            setIsLaunching(false); // set isLaunching to false when launching tournament is done
        }
    }

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
        // Prevent user from jumping to a step they haven't unlocked
        if (nextStep > completedStep + 1) return;
        setStep(nextStep);
        await saveDraft(nextStep);
    }

    const canLaunch =
        details.name.trim().length > 0 &&
        selectedPlayerIds.size >= 4 &&
        generatedEntries.length > 0 &&
        groups.length > 0 &&
        isBalanced;

    // --- The entire JSX return block is unchanged ---
    return (
        <div className="mx-auto max-w-5xl">
            <h1 className="mb-2 text-2xl font-bold">New Tournament {step ? `(Step ${step})` : ""}</h1>
            <Stepper steps={steps} current={step} completedStep={completedStep} onStepClick={goToStep} />

            {step === 1 && <Step1Details details={details} setDetails={setDetails} goToStep={goToStep} />}

            {step === 2 && (
                <Step2Players
                    roster={roster}
                    selectedPlayerIds={selectedPlayerIds}
                    setSelectedPlayerIds={setSelectedPlayerIds}
                    goToStep={goToStep}
                />
            )}

            {step === 3 && (
                <Step3Pools
                    goToStep={goToStep}
                    topHalf={topHalf}
                    bottomHalf={bottomHalf}
                    isBalanced={isBalanced}
                    setHalfByPlayerId={setHalfByPlayerId}
                    recommendedHalves={recommendedHalves}
                    generatedEntries={generatedEntries}
                    numberOfGroups={numberOfGroups}
                    setNumberOfGroups={setNumberOfGroups}
                    groups={groups}
                    regeneratePairs={regeneratePairs}
                />
            )}

            {step === 4 && (
                <Step4Review
                    details={details}
                    numberOfGroups={numberOfGroups}
                    groups={groups}
                    totalPlayers={selectedPlayers.length}
                    totalEntries={generatedEntries.length}
                    checklist={checklist}
                    goToStep={goToStep}
                    launchTournament={launchTournament}
                    canLaunch={canLaunch}
                    isLaunching={isLaunching}
                />
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
