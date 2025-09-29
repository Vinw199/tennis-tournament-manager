"use client";

import React from "react";

// hooks
import { useTournamentManager } from "@/hooks/useTournamentManager";

// local components
import ScoreModal from "@/components/manage/ScoreModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/manage/PageHeader";
import { MatchChecklist } from "@/components/manage/MatchChecklist";
import { InfoPanel } from "@/components/manage/InfoPanel";

export default function ManageTournamentClient({ initialData }) {

    const hookData = useTournamentManager(initialData);

    // Handler for the bracket's score modal
    function openBracketScore(bracketMatch) {
        const transformedMatch = {
            id: bracketMatch.id,
            dbId: bracketMatch.dbId || null,
            round: bracketMatch.name,
            entry1: bracketMatch.slots[0].participant,
            entry2: bracketMatch.slots[1].participant,
            entry1_score: bracketMatch.entry1_score,
            entry2_score: bracketMatch.entry2_score,
            status: bracketMatch.status,
        };
        hookData.setActiveMatch(transformedMatch); // Use the setter from the hook
        hookData.setShowModal(true); // Use the setter from the hook
    }

    return (
        <div className="mx-auto max-w-7xl space-y-10">
            <PageHeader {...hookData} />
            <MatchChecklist {...hookData} />
            <InfoPanel {...hookData} openBracketScore={openBracketScore} />

            <ScoreModal
                open={hookData.showModal}
                match={hookData.activeMatch}
                onClose={() => hookData.setShowModal(false)}
                onSave={hookData.saveScore}
                onForfeit={(m, winnerId) => hookData.requestForfeit(m, winnerId)}
            />
            <ConfirmDialog
                open={!!hookData.forfeitMatch}
                title="Award Forfeit"
                description={
                    hookData.forfeitMatch
                        ? `Confirm awarding a forfeit win to ${hookData.forfeitMatch.winnerEntryId === hookData.forfeitMatch.match.entry1.id
                            ? hookData.forfeitMatch.match.entry1.name
                            : hookData.forfeitMatch.match.entry2.name
                        }?`
                        : ""
                }
                confirmLabel="Award"
                onCancel={() => hookData.setForfeitMatch(null)}
                onConfirm={hookData.confirmForfeit}
            />
        </div>
    );
}