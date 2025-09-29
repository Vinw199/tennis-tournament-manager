"use client";

import React from "react";
import { useTournamentManager } from "@/hooks/useTournamentManager";

import { Card, CardContent, CardHeader } from "../../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import ScoreModal from "@/components/score/ScoreModal";
import ConfirmDialog from "../../../../../components/ui/ConfirmDialog";
import Bracket from "@/components/bracket/Bracket";

export default function ManageTournamentClient({ initialData }) {
    const {
        loading,
        error,
        isAdmin,
        tournament,
        groups,
        matches,
        standingsByGroup,
        bracket,
        activeMatch,
        showModal,
        forfeitMatch,
        allGroupMatchesCompleted,
        semisExist,
        semisCompleted,
        finalCompleted,
        openScore,
        saveScore,
        setShowModal,
        setForfeitMatch,
        confirmForfeit,
        handleGenerateSemis,
        handleGenerateFinal,
    } = useTournamentManager(initialData);

    return (
        <div className="mx-auto max-w-6xl">
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
                            <div className="space-y-6">
                                {loading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-1/3" />
                                        {[...Array(4)].map((_, i) => (
                                            <Skeleton key={i} className="h-8 w-full" />
                                        ))}
                                    </div>
                                ) : groups.map((_, gi) => (
                                    <div key={gi} className="space-y-2">
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
                                        <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-brand/60" />
                                        Top 2 qualify
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-1/3" />
                                        {[...Array(5)].map((_, i) => (
                                            <Skeleton key={i} className="h-8 w-full" />
                                        ))}
                                    </div>
                                ) : standingsByGroup.map((standings, gi) => (
                                    <div key={gi} className="rounded-md border border-black/10">
                                        <div className="border-b bg-black/5 px-4 py-2 text-sm font-semibold">Group {String.fromCharCode(65 + gi)}</div>
                                        <Table className="text-xs">
                                            <TableHeader>
                                                <TableRow className="text-foreground/60">
                                                    <TableHead className="px-3 py-2">#</TableHead>
                                                    <TableHead className="px-3 py-2">Entry</TableHead>
                                                    <TableHead className="px-3 py-2">GW</TableHead>
                                                    <TableHead className="px-3 py-2">GL</TableHead>
                                                    <TableHead className="px-3 py-2">GD</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {standings.map((s) => {
                                                    const isQualifier = s.rank <= 2;
                                                    return (
                                                        <TableRow
                                                            key={s.entryId}
                                                            className={isQualifier ? "bg-brand/10 text-foreground" : ""}
                                                        >
                                                            <TableCell className="px-3 py-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span>{s.rank}</span>
                                                                    {isQualifier && (
                                                                        <span className="rounded-sm bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">Q</span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-3 py-2">{s.entry.name}</TableCell>
                                                            <TableCell className="px-3 py-2">{s.gamesWon}</TableCell>
                                                            <TableCell className="px-3 py-2">{s.gamesLost}</TableCell>
                                                            <TableCell className="px-3 py-2">{s.gameDiff}</TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
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
                            ? `Confirm awarding a forfeit win to ${forfeitMatch.winnerEntryId === forfeitMatch.match.entry1.id
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
                                        <div className="mt-4 rounded-md border border-brand/40 bg-brand/10 p-3 text-sm">
                                            <div className="font-semibold text-brand">Winner</div>
                                            <div>{winner?.name}</div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}