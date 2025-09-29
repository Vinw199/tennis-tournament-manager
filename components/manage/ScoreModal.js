"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

// local components
import { EntryName } from "./EntryName";
import { SubmitButton } from "../SubmitButton";

export default function ScoreModal({ open, match, onClose, onSave, onForfeit }) {
  const [e1, setE1] = useState("");
  const [e2, setE2] = useState("");
  const [forfeitTarget, setForfeitTarget] = useState(null);     // state to manage the forfeit selection
  const [loading, setLoading] = useState(false); // loading state for the submit button

  useEffect(() => {
    if (open && match) {
      // Reset state when modal opens
      setE1(match.entry1_score ?? "");
      setE2(match.entry2_score ?? "");
      setForfeitTarget(null);
    }
  }, [open, match]);

  // --- Functions to handle mutually exclusive actions ---
  const handleScoreChange = (setter) => (e) => {
    setter(e.target.value);
    // Clear forfeit selection if user types a score
    if (forfeitTarget) {
      setForfeitTarget(null);
    }
  };

  const handleForfeitChange = (value) => {
    setForfeitTarget(value);
    // Clear scores if user selects a forfeit
    setE1("");
    setE2("");
  };

  async function handleSubmit() {
    setLoading(true);
    try {
      if (forfeitTarget) {
        // The `onForfeit` function needs the full match and the winning entry's ID
        await onForfeit?.(match, forfeitTarget);
      } else {
        const s1 = Number(e1);
        const s2 = Number(e2);
        if (Number.isNaN(s1) || Number.isNaN(s2)) return;
        await onSave?.({ entry1_score: s1, entry2_score: s2 });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // --- Logic to disable the save button if no action is possible ---
  const canSave = e1 !== "" && e2 !== "";
  const canForfeit = !!forfeitTarget;
  const isSubmitDisabled = !canSave && !canForfeit;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center pb-3 text-xl font-bold">Enter Score</DialogTitle>
          {match && (
            <section className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <EntryName name={match.entry1.name} className="text-center text-sm" />
              <div className="text-muted-foreground">vs</div>
              <EntryName name={match.entry2.name} className="text-center text-sm" />
            </section>
          )}
        </DialogHeader>

        {match && (
          <>
            <div className="space-y-6 pt-4">
              {/* --- Score Input Section with Dash --- */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <Input
                  type="number"
                  min={0}
                  value={e1}
                  onChange={handleScoreChange(setE1)}
                  className="text-center text-lg h-12"
                  placeholder="0"
                  autoFocus
                />
                {/* Change: Replaced "vs" with a dash */}
                <div className="text-center text-2xl font-semibold text-muted-foreground">-</div>
                <Input
                  type="number"
                  min={0}
                  value={e2}
                  onChange={handleScoreChange(setE2)}
                  className="text-center text-lg h-12"
                  placeholder="0"
                />
              </div>

              {/* --- New Forfeit Section with RadioGroup --- */}
              {onForfeit && (
                <div className="space-y-3">
                  <Label className="text-xs text-neutral-600">Or award a forfeit to:</Label>
                  <RadioGroup value={forfeitTarget} onValueChange={handleForfeitChange}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={match.entry1.id} id={`r1-${match.id}`} className="cursor-pointer" />
                      <Label htmlFor={`r1-${match.id}`} className="pl-2 font-normal cursor-pointer text-neutral-600 hover:text-neutral-700 transition-colors delay-50">
                        <EntryName name={match.entry1.name} />
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={match.entry2.id} id={`r2-${match.id}`} className="cursor-pointer" />
                      <Label htmlFor={`r2-${match.id}`} className="pl-2 font-normal cursor-pointer text-neutral-600 hover:text-neutral-700 transition-colors delay-50">
                        <EntryName name={match.entry2.name} />
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button className="cursor-pointer" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <SubmitButton
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                isPending={loading}
                pendingText={forfeitTarget ? "Confirming Forfeit" : "Saving Score"}
              >
                {forfeitTarget ? "Confirm Forfeit" : "Save Score"}
              </SubmitButton>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}