import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function GroupStandingsTable({ groupIndex, standings, isCompleted }) {
    
    return (
        <div>
            <h3 className="mb-2 text-sm font-semibold">Group {String.fromCharCode(65 + groupIndex)}</h3>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {/* The `[&_tr]:border-b-0` is a small utility to remove the double border look */}
                        <TableRow className="[&_tr]:border-b-0">
                            {/* Change: Muted color for headers for better hierarchy */}
                            <TableHead className="w-12 text-center text-muted-foreground">#</TableHead>
                            <TableHead className="text-muted-foreground">Team</TableHead>
                            <TableHead className="text-center text-muted-foreground">W</TableHead>
                            <TableHead className="text-center text-muted-foreground">L</TableHead>
                            <TableHead className="text-center text-muted-foreground">+/-</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {standings.map((s) => {
                            const isQualifier = s.rank <= 2 && isCompleted;
                            return (
                                <TableRow key={s.entryId} className={isQualifier ? "" : "text-muted-foreground"}>
                                    <TableCell
                                        className={`text-center text-sm text-muted-foreground ${isQualifier ? "" : ""
                                            }`}
                                    >
                                        {s.rank}
                                    </TableCell>

                                    <TableCell>
                                        <span className="font-medium">{s.entry.name}</span>
                                        {isQualifier && <span className="text-green-600 font-semibold ml-2">Q</span>}
                                    </TableCell>

                                    <TableCell className="text-center">{s.gamesWon}</TableCell>
                                    <TableCell className="text-center">{s.gamesLost}</TableCell>
                                    <TableCell
                                        className={`text-center font-mono text-sm ${s.gameDiff > 0 ? "text-green-600" : s.gameDiff < 0 ? "text-red-600" : ""
                                            }`}
                                    >
                                        {s.gameDiff > 0 ? `+${s.gameDiff}` : s.gameDiff}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}