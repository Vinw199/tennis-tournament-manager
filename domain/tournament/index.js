// Pure helpers for tournament logic (no DB, no side effects)

export function generateBalancedDoublesEntries({ players }) {
  // players: [{ id, name, skillRank }]
  const sorted = [...players].sort((a, b) => a.skillRank - b.skillRank);
  const midpoint = Math.ceil(sorted.length / 2);
  const topHalf = sorted.slice(0, midpoint);
  const bottomHalf = sorted.slice(midpoint);

  // Shuffle helper
  const shuffledBottom = [...bottomHalf].sort(() => Math.random() - 0.5);

  const size = Math.min(topHalf.length, shuffledBottom.length);
  const entries = [];
  for (let i = 0; i < size; i += 1) {
    const p1 = topHalf[i];
    const p2 = shuffledBottom[i];
    const averageRank = Math.round((p1.skillRank + p2.skillRank) / 2);
    entries.push({
      id: `e_${p1.id}_${p2.id}`,
      name: `${p1.name} / ${p2.name}`,
      players: [p1, p2],
      averageRank,
    });
  }
  return entries;
}

export function snakeSeedEntriesIntoGroups({ entries, numberOfGroups }) {
  // entries with averageRank, lower is better
  const sorted = [...entries].sort((a, b) => a.averageRank - b.averageRank);
  const groups = Array.from({ length: numberOfGroups }, () => []);
  let direction = 1; // 1 forward, -1 backward
  let idx = 0;
  for (const entry of sorted) {
    groups[idx].push(entry);
    if (direction === 1) {
      if (idx === numberOfGroups - 1) {
        direction = -1;
        idx -= 1;
      } else {
        idx += 1;
      }
    } else {
      if (idx === 0) {
        direction = 1;
        idx += 1;
      } else {
        idx -= 1;
      }
    }
  }
  return groups; // [ [entry, ...], [entry, ...], ... ]
}

export function generateRoundRobinMatchesForGroup(entriesInGroup) {
  const matches = [];
  for (let i = 0; i < entriesInGroup.length; i += 1) {
    for (let j = i + 1; j < entriesInGroup.length; j += 1) {
      matches.push({ entry1: entriesInGroup[i], entry2: entriesInGroup[j] });
    }
  }
  return matches;
}

// Generate entries from explicit pools
export function generateBalancedDoublesEntriesFromPools({ topHalf, bottomHalf }) {
  const shuffledBottom = [...bottomHalf].sort(() => Math.random() - 0.5);
  const size = Math.min(topHalf.length, shuffledBottom.length);
  const entries = [];
  for (let i = 0; i < size; i += 1) {
    const p1 = topHalf[i];
    const p2 = shuffledBottom[i];
    const averageRank = Math.round(((p1.skillRank ?? p1.default_skill_rank) + (p2.skillRank ?? p2.default_skill_rank)) / 2);
    entries.push({
      id: `e_${p1.id}_${p2.id}`,
      name: `${p1.name} / ${p2.name}`,
      players: [p1, p2],
      averageRank,
    });
  }
  return entries;
}


