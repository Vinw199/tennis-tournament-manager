"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupStandingsTable } from "@/components/manage/GroupStandingsTable";
import Bracket from "@/components/bracket/Bracket";

export function InfoPanel({ loading, standingsByGroup, bracket, tournament, openBracketScore, allGroupMatchesCompleted }) {
    return (
        <Tabs defaultValue="standings">
            <TabsList className='mx-auto mb-2 px-1'>
                <TabsTrigger value="standings" className='cursor-pointer'>Standings</TabsTrigger>
                <TabsTrigger value="bracket" className='cursor-pointer'>Knockout Bracket</TabsTrigger>
            </TabsList>

            <TabsContent value="standings">
                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle className='text-xl text-black/90'>Standings</CardTitle>
                            <CardDescription>Top 2 from each group qualify for the knockout stage.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-40 w-full" />
                        ) : standingsByGroup.length > 0 ? (
                            // Use the responsive grid and map to the new component
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {standingsByGroup.map(({ standings, isCompleted }, gi) => (
                                    <GroupStandingsTable key={gi} groupIndex={gi} standings={standings} isCompleted={isCompleted} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Standings will be updated as scores are entered.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="bracket">
                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle className='text-xl text-black/90'>Knockout Bracket</CardTitle>
                            <CardDescription className=''>Preview of the Semi-Finals and Final matches.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading
                            ? <Skeleton className="h-64 w-full" />
                            : bracket
                                ? <Bracket model={bracket} onOpenScore={openBracketScore} />
                                : (
                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                        The bracket will be generated after the group stage is complete.
                                    </div>
                                )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}