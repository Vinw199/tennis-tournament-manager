import { useMemo } from "react";

export function useResolvedBracket(matches) {
  const resolvedMatches = useMemo(() => {
    if (!matches) return [];
    
    // Deep clone to avoid mutating the original data
    const clone = matches.map((m) => ({ ...m, slots: m.slots.map((s) => ({ ...s })) }));
    const byId = new Map(clone.map((m) => [m.id, m]));

    function winnerOf(m) {
      if (
        m.status === "completed" &&
        typeof m.entry1_score === "number" &&
        typeof m.entry2_score === "number"
      ) {
        return m.entry1_score > m.entry2_score ? m.slots[0].participant : m.slots[1].participant;
      }
      return null;
    }

    for (const m of clone) {
      m.slots.forEach((slot, idx) => {
        if (!slot.participant && slot.source?.type === "winner") {
          const src = byId.get(slot.source.matchId);
          const win = src ? winnerOf(src) : null;
          if (win) m.slots[idx].participant = win;
        }
      });
    }
    
    return clone;
  }, [matches]);

  return resolvedMatches;
}