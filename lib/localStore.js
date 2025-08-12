// Simple localStorage helpers for MVP (no Supabase yet)

const KEY = "ttapp_tournaments_v1";
const PLAYERS_KEY = "ttapp_players_v1";

function readAll() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function saveTournament(tournament) {
  const map = readAll();
  map[tournament.id] = tournament;
  writeAll(map);
}

export function getTournament(id) {
  const map = readAll();
  return map[id] || null;
}

// Players helpers (scoped to default space for now)
function readPlayers() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PLAYERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePlayers(list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLAYERS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function listPlayers() {
  return readPlayers();
}

export function upsertPlayer(player) {
  const list = readPlayers();
  const idx = list.findIndex((p) => p.id === player.id);
  if (idx >= 0) list[idx] = player;
  else list.push(player);
  writePlayers(list);
  return player;
}

export function deletePlayer(playerId) {
  const list = readPlayers().filter((p) => p.id !== playerId);
  writePlayers(list);
}


