import React from "react";
import { Button } from "../ui/Button";
import { cn } from "@/lib/utils";

export const MatchCard = React.forwardRef(function MatchCard({ match, onOpenScore }, ref) {
  if (!match) return null;

  const { name, status, slots, entry1_score, entry2_score } = match;

  const isCompleted = status === "completed" && typeof entry1_score === "number" && typeof entry2_score === "number";
  const slot0Winner = isCompleted && entry1_score > entry2_score;
  const slot1Winner = isCompleted && entry2_score > entry1_score;
  const isFinalAndCompleted = isCompleted && name === "Final";

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-md border bg-card p-3 text-sm text-card-foreground transition-all",
        isFinalAndCompleted && "border-primary/30 shadow-lg shadow-primary/10"
      )}
    >
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{name}</span>
        {onOpenScore && (
          <Button variant="outline" size="sm" onClick={() => onOpenScore(match)}>
            {isCompleted ? "Edit" : "Score"}
          </Button>
        )}
      </div>
      <div className="flex flex-col">
        {/* --- Participant 1 --- */}
        <div
          className={cn(
            "flex items-center justify-between rounded-t p-1 transition-opacity",
            slot0Winner && "bg-primary/10",
            slot1Winner && "opacity-50"
          )}
        >
          <div className="flex items-center gap-2">
            {/* Change: Font is only bold if they are the champion */}
            <span className={cn(isFinalAndCompleted && slot0Winner && "font-semibold")}>
              {slots[0].participant?.name || "TBD"}
            </span>
            {isFinalAndCompleted && slot0Winner && <span className="text-xs font-bold text-primary">🏆 Champion</span>}
          </div>
          <span className="font-semibold">{typeof entry1_score === "number" ? entry1_score : ""}</span>
        </div>
        
        {/* --- Participant 2 --- */}
        <div
          className={cn(
            "flex items-center justify-between rounded-b border-t p-1 transition-opacity",
            slot1Winner && "bg-primary/10",
            slot0Winner && "opacity-50"
          )}
        >
          <div className="flex items-center gap-2">
            {/* Change: Font is only bold if they are the champion */}
            <span className={cn(isFinalAndCompleted && slot1Winner && "font-semibold")}>
              {slots[1].participant?.name || "TBD"}
            </span>
            {isFinalAndCompleted && slot1Winner && <span className="text-xs font-bold text-primary">🏆 Champion</span>}
          </div>
          <span className="font-semibold">{typeof entry2_score === "number" ? entry2_score : ""}</span>
        </div>
      </div>
    </div>
  );
});