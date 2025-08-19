// Standings with tie-breakers
// Input: matches: [{ entry1, entry2, entry1_score, entry2_score, status }]
// Output: array of { entryId, entry, gamesWon, gamesLost, gameDiff, rank }

function ensureEntry(statsMap, entry) {
  if (!statsMap.has(entry.id)) {
    statsMap.set(entry.id, {
      entryId: entry.id,
      entry,
      gamesWon: 0,
      gamesLost: 0,
      gameDiff: 0,
      opponents: new Map(), // opponentId -> { won, lost }
    });
  }
  return statsMap.get(entry.id);
}

export function computeStandings(matches) {
  const statsMap = new Map();

  for (const m of matches) {
    if (m.status !== "completed") continue;
    const s1 = m.entry1_score ?? 0;
    const s2 = m.entry2_score ?? 0;
    const e1 = ensureEntry(statsMap, m.entry1);
    const e2 = ensureEntry(statsMap, m.entry2);

    e1.gamesWon += s1;
    e1.gamesLost += s2;
    e1.gameDiff = e1.gamesWon - e1.gamesLost;
    e2.gamesWon += s2;
    e2.gamesLost += s1;
    e2.gameDiff = e2.gamesWon - e2.gamesLost;

    // Track head-to-head aggregates
    const opp1 = e1.opponents.get(e2.entryId || e2.entry.id) || { won: 0, lost: 0 };
    opp1.won += s1;
    opp1.lost += s2;
    e1.opponents.set(e2.entryId || e2.entry.id, opp1);

    const opp2 = e2.opponents.get(e1.entryId || e1.entry.id) || { won: 0, lost: 0 };
    opp2.won += s2;
    opp2.lost += s1;
    e2.opponents.set(e1.entryId || e1.entry.id, opp2);
  }

  const standings = Array.from(statsMap.values());

  standings.sort((a, b) => {
    // 1) Primary: total games won desc
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
    // 2) Game difference desc
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    // 3) Head-to-head: who won more games in mutual matchups
    const aVsB = a.opponents.get(b.entryId) || { won: 0, lost: 0 };
    const bVsA = b.opponents.get(a.entryId) || { won: 0, lost: 0 };
    const aHH = aVsB.won - aVsB.lost;
    const bHH = bVsA.won - bVsA.lost;
    if (bHH !== aHH) return bHH - aHH;
    // 4) Manual admin selection (not automated here) -> keep order stable
    return 0;
  });

  // Assign rank positions
  standings.forEach((s, idx) => (s.rank = idx + 1));
  return standings;
}


