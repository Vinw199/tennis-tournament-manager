"use client";

import { Button } from "@/components/ui/Button";
// use submit button and loading state
import { SubmitButton } from "@/components/SubmitButton";
import { useState } from "react";

// local actions
import { completeTournamentAction } from "@/app/t/actions";


export function PageHeader({ tournament, isAdmin, finalCompleted }) {
    const [loading, setLoading] = useState(false);
    if (!tournament) return null;
    return (
        <header className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold">Manage Tournament</h1>
                <p className="text-sm text-muted-foreground">
                    Live updates and score entry for your event.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(`${location.origin}/t/${tournament.id}/live`)}
                >
                    Share Live Link
                </Button>
                {isAdmin && (
                    <SubmitButton
                        isPending={loading}
                        disabled={!finalCompleted}
                        onClick={async () => {
                            setLoading(true);
                            const res = await completeTournamentAction({ tournamentId: tournament.id });
                            if (res?.error) return alert(res.error);
                            location.href = "/past-events";
                            setLoading(false);
                        }}
                        pendingText="Completing Tournament..."
                    >
                        Complete Tournament
                    </SubmitButton>
                )}
            </div>
        </header>
    );
}