"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function ScoreModal({ open, match, onClose, onSave, onForfeit }) {
  const [e1, setE1] = useState(0);
  const [e2, setE2] = useState(0);

  useEffect(() => {
    if (open && match) {
      setE1(match.entry1_score ?? 0);
      setE2(match.entry2_score ?? 0);
    }
  }, [open, match]);

  function save() {
    const s1 = Number(e1);
    const s2 = Number(e2);
    if (Number.isNaN(s1) || Number.isNaN(s2)) return;
    onSave?.({ entry1_score: s1, entry2_score: s2 });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Score</DialogTitle>
        </DialogHeader>
        {match && (
          <div className="space-y-4">
            <div className="text-sm">
              <div className="mb-2 font-medium">
                {match.entry1.name} vs {match.entry2.name}
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                <div className="text-xs">
                  <Label className="mb-1 text-foreground/60 block">{match.entry1.name}</Label>
                  <Input type="number" min={0} value={e1} onChange={(e) => setE1(e.target.value)} />
                </div>
                <div className="text-center text-foreground/50">—</div>
                <div className="text-xs">
                  <Label className="mb-1 text-foreground/60 block">{match.entry2.name}</Label>
                  <Input type="number" min={0} value={e2} onChange={(e) => setE2(e.target.value)} />
                </div>
              </div>
              <div className="mt-2 text-xs text-foreground/60">League format hint: Total 4 games.</div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              {onForfeit && (
                <div className="text-[11px]">
                  <span className="mr-2 text-foreground/60">Award forfeit to:</span>
                  <Button variant="secondary" onClick={() => onForfeit(match, match.entry1.id)}>
                    {match.entry1?.name || "Entry 1"}
                  </Button>
                  <Button variant="secondary" className="ml-2" onClick={() => onForfeit(match, match.entry2.id)}>
                    {match.entry2?.name || "Entry 2"}
                  </Button>
                </div>
              )}
              <div className="ml-auto flex gap-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={save}>Save</Button>
              </div>
            </div>
          </div>
        )}
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}


