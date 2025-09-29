"use client";

import { Button } from "@/components/ui/Button";
import { Edit, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

function TeamDisplay({ name, isWinner, isCompleted }) {
    const players = name.includes(' / ') ? name.split(' / ') : [name];
    const shouldHighlight = isWinner || !isCompleted;

    return (
        <div
            className={cn(
                "grid grid-cols-[auto_1fr] items-center gap-2 text-sm font-medium",
                !shouldHighlight && "text-muted-foreground"
            )}
        >
            {isWinner ? (
                <Trophy className="h-4 w-4 shrink-0 text-amber-500" />
            ) : (
                <div className="w-4"></div>
            )}
            <div className="truncate">
                {players.map((player, index) => (
                    <div key={index} className="truncate">{player.trim()}</div>
                ))}
            </div>
        </div>
    );
}

export function MatchCard({ match, onOpenScore }) {
    const isCompleted = match.status === 'completed';
    const entry1Wins = isCompleted && match.entry1_score > match.entry2_score;
    const entry2Wins = isCompleted && match.entry2_score > match.entry1_score;

    return (
        // 1. Added the `group` class to the parent list item
        <li className="group flex items-center justify-between rounded-lg border bg-gradient-to-br from-card to-card/60 p-4 text-card-foreground shadow-sm">
            <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
                <TeamDisplay name={match.entry1.name} isWinner={entry1Wins} isCompleted={isCompleted} />
                <span className="text-center text-xs text-muted-foreground">vs</span>
                <TeamDisplay name={match.entry2.name} isWinner={entry2Wins} isCompleted={isCompleted} />
            </div>

            <div className="flex shrink-0 items-center gap-4 pl-4">
                {isCompleted && (
                    <div className="hidden font-mono text-sm font-semibold md:block">
                        {match.entry1_score} - {match.entry2_score}
                    </div>
                )}
                <Button className='cursor-pointer' size="icon" variant="ghost" onClick={() => onOpenScore(match)}>
                    <Edit className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
                    <span className="sr-only">{isCompleted ? 'Edit Score' : 'Enter Score'}</span>
                </Button>
            </div>
        </li>
    );
}