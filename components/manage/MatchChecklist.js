"use client";

import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";


// local components
import { MatchCard } from "@/components/manage/MatchCard";
import { LoadingButton } from "@/components/LoadingButton";

export function MatchChecklist({
    loading,
    groups,
    matches,
    openScore,
    isAdmin,
    tournament,
    handleGenerateKnockoutStage,
    handleGenerateFinal,
    allGroupMatchesCompleted,
    semisExist,
    finalExists,
    semisCompleted,
    isGeneratingKnockouts,
    isGeneratingFinal,
}) {

    // Dynamically set the number of columns based on the number of groups
    const gridCols = `md:grid-cols-${groups.length > 1 ? groups.length : 2}`;

    return (
        <Card>
            <CardHeader>
                {/* 2. Updated header with responsive flex classes */}
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className='text-xl text-black/90'>Fixtures</CardTitle>
                        <CardDescription>Enter scores for each group stage match.</CardDescription>
                    </div>
                    {isAdmin && tournament?.status !== "completed" && (
                        // <div className="flex shrink-0 items-center gap-2">
                        //     <LoadingButton
                        //         variant="secondary"
                        //         onClick={async () => {
                        //             setGenerateSemisLoading(true);
                        //             await handleGenerateSemis();
                        //             setGenerateSemisLoading(false);
                        //         }}
                        //         disabled={!allGroupMatchesCompleted}
                        //         isPending={generateSemisLoading}
                        //         pendingText="Generating Semis..."
                        //     >
                        //         Generate Semis
                        //     </LoadingButton>
                        //     <LoadingButton
                        //         variant="secondary"
                        //         onClick={async () => {
                        //             setGenerateFinalLoading(true);
                        //             await handleGenerateFinal();
                        //             setGenerateFinalLoading(false);
                        //         }}
                        //         disabled={!semisExist || !semisCompleted}
                        //         isPending={generateFinalLoading}
                        //         pendingText="Generating Final..."
                        //     >
                        //         Generate Final
                        //     </LoadingButton>
                        // </div>


                        <div className="flex shrink-0 items-center gap-2">
                            {!semisExist ? (
                                <LoadingButton
                                    variant="secondary"
                                    onClick={handleGenerateKnockoutStage}
                                    disabled={!allGroupMatchesCompleted}
                                    isPending={isGeneratingKnockouts}
                                    pendingText="Generating..."
                                >
                                    Generate Knockout Stage
                                </LoadingButton>
                            ) : !finalExists ? ( // This is the only check needed
                                <LoadingButton
                                    variant="secondary"
                                    onClick={handleGenerateFinal}
                                    disabled={!semisCompleted}
                                    isPending={isGeneratingFinal}
                                    pendingText="Generating..."
                                >
                                    Generate Final
                                </LoadingButton>
                            ) : null} {/* If the final exists, show nothing */}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : (
                    <div className={`grid gap-6 ${gridCols}`}>
                        {groups.map((_, gi) => (
                            <div key={gi} className="space-y-3">
                                <h3 className="text-sm font-semibold text-muted-foreground">
                                    Group {String.fromCharCode(65 + gi)}
                                </h3>
                                <ul className="space-y-3">
                                    {matches
                                        .filter((m) => m.round === `Group ${String.fromCharCode(65 + gi)}`)
                                        .map((m) => (
                                            // 3. Replaced the old list item with the new MatchCard
                                            <MatchCard key={m.id} match={m} onOpenScore={openScore} />
                                        ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}