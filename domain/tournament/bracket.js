// Bracket model helpers for knockout stages

export function createSemisFinalBracket({ a1, a2, b1, b2 }) {
  // a1: Group A winner, a2: Group A runner-up, etc.
  const matches = [
    {
      id: "sf1",
      name: "Semi-Final 1",
      roundIndex: 0,
      slots: [
        { participant: a1 }, // A1
        { participant: b2 }, // B2
      ],
      entry1_score: null,
      entry2_score: null,
      status: "pending",
      nextMatchId: "final",
      nextSlotIndex: 0,
    },
    {
      id: "sf2",
      name: "Semi-Final 2",
      roundIndex: 0,
      slots: [
        { participant: b1 }, // B1
        { participant: a2 }, // A2
      ],
      entry1_score: null,
      entry2_score: null,
      status: "pending",
      nextMatchId: "final",
      nextSlotIndex: 1,
    },
    {
      id: "final",
      name: "Final",
      roundIndex: 1,
      slots: [
        { source: { type: "winner", matchId: "sf1" } },
        { source: { type: "winner", matchId: "sf2" } },
      ],
      entry1_score: null,
      entry2_score: null,
      status: "pending",
    },
  ];

  const rounds = [
    { name: "Semi-Finals", matches: ["sf1", "sf2"] },
    { name: "Final", matches: ["final"] },
  ];

  return { matches, rounds };
}

export function computeKnockoutWinner(match) {
  if (
    match.status === "completed" &&
    typeof match.entry1_score === "number" &&
    typeof match.entry2_score === "number"
  ) {
    return match.entry1_score > match.entry2_score
      ? match.slots[0].participant
      : match.slots[1].participant;
  }
  return null;
}


