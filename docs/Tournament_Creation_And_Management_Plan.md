## Tournament Creation & Management Plan — League + Semis Knockout (No Realtime)

### Goals
- Primary format: League (group-stage round-robin) followed by Semi-Finals and Final.
- Manage tournaments: match checklist per group, standings with tie-breakers, knockout preview (Semis → Final), and a public live view.
- Replace current localStorage MVP with Supabase while preserving UX and existing helpers. No realtime features to avoid cost (manual refresh/SSR instead).

### Current Building Blocks (already in repo)
- Pages: `app/(with-sidebar)/t/[tournamentId]/manage/page.jsx`, `app/t/[tournamentId]/live/page.js`.
- UI: `components/bracket/Bracket.jsx`, shared buttons and styles, accent/brand colors.
- Auth/Space: `(with-sidebar)/layout.jsx` session guard, space scoping via env and Supabase.
- Local MVP: `app/(wizard)/tournaments/new/page.jsx` creates league + semis tournaments in localStorage; helpers in `lib/tournament.js`, `lib/standings.js`, `lib/bracket.js`, storage in `lib/localStore.js` and draft in `lib/wizardDraft.js`.

---

### Data Model (Supabase)
- `tournaments`
  - id (uuid, pk)
  - space_id (uuid, fk → spaces.id)
  - name (text)
  - format (text: 'league_semis_final')
  - status (text: 'draft' | 'active' | 'completed')
  - settings jsonb (e.g., groups_count, league_match_format)
  - created_at, updated_at

- `entries`
  - id (uuid, pk)
  - tournament_id (uuid)
  - seed (int, nullable)
  - group_letter (text, nullable) — 'A', 'B', ... assigned during launch

- `entry_players` (for doubles)
  - id (uuid, pk)
  - entry_id (uuid)
  - player_id (uuid)
  - skill_rank_for_tournament (int)

- `matches`
  - id (uuid, pk)
  - tournament_id (uuid)
  - round_label (text) — e.g., 'Group A', 'Group B', 'Semi-Final', 'Final'
  - order_in_round (int)
  - entry1_id (uuid, nullable)
  - entry2_id (uuid, nullable)
  - entry1_score (int, nullable)
  - entry2_score (int, nullable)
  - status (text: 'pending' | 'in_progress' | 'completed')
  - winner_entry_id (uuid, nullable)

- Optional later: `groups` table if we want normalized groups; for V1, `entries.group_letter` + `matches.round_label` is sufficient.

RLS: All reads/writes restricted to `space_id` via joins to `tournaments.space_id` and user membership.

---

### Creation Wizard (League + Semis → Final)
Route: `app/(wizard)/tournaments/new/`

Steps (align with existing localStorage MVP):
1) Details
   - Fields: name (required), date, entry fee, prize, format fixed to 'League + Knockout', knockout stage fixed to 'Semi-Finals', league match format (e.g., 'Total 4 games').
2) Select Players
   - Multi-select from Space roster; doubles pairing via balanced halves; seed/reorder if needed.
3) Entries & Groups
   - Generate balanced doubles entries using `generateBalancedDoublesEntries` or from explicit pools; snake-seed into N groups using `snakeSeedEntriesIntoGroups`.
   - Generate round-robin matches per group with `generateRoundRobinMatchesForGroup`.
4) Review & Launch
   - Persist: create `tournaments`, `entries`, and group-stage `matches` with `round_label = 'Group A' | 'Group B' | ...`.
   - Redirect to Manage page.

Knockout generation:
- After all group matches completed, compute standings per group with `computeStandings` and qualify top 2.
- Create Semi-Finals (A1 vs B2, B1 vs A2) and Final via `createSemisFinalBracket`.

---

### Manage Page (Admin)
Route: `app/(with-sidebar)/t/[tournamentId]/manage/page.jsx`

Primary views:
- Bracket view (existing `Bracket.jsx`): shows rounds and matches.
- Scoring modal/panel: update `entry1_score`, `entry2_score`, set `status`, compute winner.

Core actions:
- Enter/adjust scores for group matches; standings update live; after groups complete, unlock Semis/Final.
- For Semis/Final, on submit, set winner and auto-advance into downstream slot.
- Mark match as in_progress/completed.
- Optional: reschedule metadata later.

Realtime:
- Subscribe to `matches` for this tournament; optimistic updates on admin actions.

Permissions:
- Only Space members with admin role can write; everyone in Space can read; public `live` is read-only.

---

### Live Page (Public)
Route: `app/t/[tournamentId]/live/page.js`
- Read-only bracket and statuses. No realtime; render server-side and rely on manual refresh. Optionally use short revalidation windows if acceptable.

---

### Server Actions / RPCs
- Server Actions (Next.js):
  - `launchTournament({ name, date, settings, entriesPayload, numberOfGroups, roundRobinPairs })` → calls RPC, clears draft, redirects.
  - `recordScore({ matchId, entry1Score, entry2Score })` → updates match; if Semis/Final, updates downstream.

- SQL RPCs (transactional, idempotent) — no realtime dependencies:
  - `launch_tournament(...)` — insert `tournaments`, `entries`, `entry_players`, and group-stage `matches` in one transaction.
  - `finalize_groups_generate_semis(tournament_id)` — determine qualifiers from standings, create Semi-Finals.
  - `generate_final(tournament_id)` — create Final from Semi winners.
  - Optional: `complete_tournament(tournament_id)` — mark completed and lock edits.

---

### UI Components (reuse/extend)
- `Bracket` (exists): ensure it renders rounds, highlights winners, and exposes callbacks for scoring.
- `ScoringModal`: small form with validation and keyboard-friendly inputs.
- `PlayerSelect` for wizard step.

---

### Milestones
1) Folder structure refactor (see below) and move domain logic out of `lib/` (0.5d)
2) Wire wizard to Space roster + persist draft in `wizard_drafts` (replace `lib/wizardDraft.js`) (1d)
3) Launch to Supabase via `launch_tournament` RPC (replace `lib/localStore.js`) (1d)
4) Manage page reads matches/entries from Supabase; scoring updates and standings (1.5d)
5) Semis + Final generation flow (RPCs + UI lock/unlock) (1d)
6) Live page SSR (no realtime) + manual refresh and optional low-cost revalidate (0.5d)
7) Polish: validations, empty states, loading (0.5d)

---

### Open Questions
- Groups count flexibility (2, 3, 4)? For MVP we assume 2.
- Forfeits and admin tie-break overrides storage model.
- Doubles vs singles toggle timeline; current helpers target doubles pairs.

---

### Architecture Changes (replace `lib/` with clearer layers)

Goal: Make intent obvious and keep domain logic separate from UI and data access.

- `domain/tournament/`
  - Pure logic, no side effects: `entries.ts` (pair generation), `grouping.ts` (snake seeding), `roundRobin.ts`, `standings.ts`, `bracket.ts`.
- `data/`
  - Supabase access and RPC wrappers: `tournaments.ts`, `entries.ts`, `matches.ts`, `rpc.ts`.
  - Reuse `utils/supabase/server` client factory; ensure all calls are space-scoped.
- `features/wizard/`
  - UI state and step logic. Local component state or a tiny custom hook; no external state library required.
  - Draft persistence abstraction that writes to Supabase `wizard_drafts` (with a localStorage fallback when offline).
- `app/(wizard)/...`
  - Routes-only. Fetch server data and render client components. Keep domain/data logic out of route files.

This refactor will physically move files out of `lib/` into `domain/`, `data/`, and `features/` as above.

---

### Wizard Improvements (allowed to change current flow)

- Use per-step subroutes for clarity and URL deep-linking:
  - `.../new/details`, `.../new/players`, `.../new/groups`, `.../new/review`.
- Fetch roster server-side on each step; pass as props to client components.
- Autosave draft with debounced writes (300–500ms) to `wizard_drafts`; no subscriptions needed.
- Make pairs and groups deterministic and reproducible (seeded shuffle) for auditability.


