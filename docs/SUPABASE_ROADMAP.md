## Supabase Implementation Roadmap

**Goal**: Replace localStorage MVP with a secure, multi-tenant Supabase backend while preserving current UX. Enable clean migration to advanced features later.

### Phase 0 — Setup
- **Project/CLI**: Initialize and run locally with Supabase CLI.
- **Env vars (.env.local)**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `NEXT_PUBLIC_SPACE_ID` (hardcoded MVP space)
- **SDK**: Install `@supabase/supabase-js`.
- **Helpers**:
  - `utils/supabase/client.js` (browser client via @supabase/ssr createBrowserClient)
  - `utils/supabase/server.js` (server helper via @supabase/ssr createServerClient)

### Phase 1 — Schema, RLS, migrations (Completed)
- **Tables** (per Database Schema Design): `spaces`, `space_members`, `players`, `tournaments`, `entries`, `entry_players`, `matches`, `wizard_drafts` (Phase 2: `templates`, `club_finances`).
- **Migrations**: All changes via SQL files in `supabase/migrations` and checked into git.
- **Indexes**: Add common filters: `players(space_id)`, `tournaments(space_id, status)`, `entries(tournament_id)`, `entry_players(entry_id)`, `matches(tournament_id, round)`.
- **RLS Policies**: Enable RLS on all user data tables.
  - Template:
    - `using (space_id in (select space_id from space_members where user_id = auth.uid()))`
    - `with check (space_id in (select space_id from space_members where user_id = auth.uid()))`
  - For `entries`, `entry_players`, `matches`, scope via parent `tournaments.space_id` (FK joins in policies or security definer RPCs).
- **Seed**: `supabase/seed.sql` with default Space, admin member, and sample players.

### Phase 2 — Auth and route protection (In Progress)
- **Auth**: Use Supabase Auth (email/password) in `(auth)/login` and `(auth)/signup`.
- **Protect admin area**: In `app/(with-sidebar)/layout.jsx` (server), check session; redirect to `(auth)/login` if no session.
- **Space scope**: Read `NEXT_PUBLIC_SPACE_ID` on server; all queries filter by `space_id`; RLS enforces membership via `space_members`.

### Phase 3 — Wizard draft persistence (replace localStorage)
- Replace `lib/wizardDraft.js` with Supabase-backed draft using `wizard_drafts`.
- Upsert latest draft for `(space_id, user_id)` on changes; debounce 300–500ms.
- Draft shape in `wizard_drafts.data`:
  - `step`, `details`, `selectedPlayerIds`, `numberOfGroups`, `halfByPlayerId`.
- On wizard load, fetch latest draft and hydrate state.
- On successful launch, delete the draft.

### Phase 4 — Players (roster) on Supabase
- **Reads**: Server Components fetch `players` filtered by `space_id`.
- **CRUD**: Client mutations via Supabase browser client (toasts on success/failure), RLS-protected.
- **Avatars**: Storage bucket `avatars` with authenticated writes; store public URL in `players.profile_picture_url`.

### Phase 5 — Launch Tournament via transactional RPC
- **RPC: `launch_tournament` (SQL, idempotent)**
  - Inputs: `space_id`, `name`, `date`, `settings jsonb`, `entry_fee`, `prize_money_details`, `entries payload` (array of pairs with ranks), `number_of_groups`, `round_robin pairs`, `idempotency_key`.
  - Transaction:
    - Insert `tournaments` (status `active`).
    - Insert `entries` and `entry_players` with `skill_rank_for_tournament`.
    - Insert group-stage `matches` with rounds like `Group A`, `Group B`, ...
  - Returns: `tournament_id`.
  - Security: Validate caller membership; execute with `security definer` and internal checks.
- **Wizard change**: On “Launch Tournament”, reuse existing helpers in `lib/tournament.js` to build payload, call RPC, clear draft, `router.push(/t/[id]/manage)`.

### Phase 6 — Manage and Live pages read from DB
- **Manage (`app/(with-sidebar)/t/[tournamentId]/manage/page`)**:
  - Server read: `tournaments`, `entries`, `matches` by `tournament_id`.
  - Scoring modal: client update `matches.entry1_score/entry2_score`, set `status = 'completed'`.
  - Standings: compute via server (preferred) or client using helpers; tie-break: games won → game difference → head-to-head → manual.
- **Live (`app/t/[tournamentId]/live/page`)**:
  - Server read of `entries` + `matches`; render read-only standings and checklist.
  - Realtime subscription added in Phase 8.

### Phase 7 — Lifecycle, playoffs generation, and locking
- **Status flow**: `planning → active → completed`.
- **RPCs**:
  - `finalize_groups_generate_semis(tournament_id)` — determine qualifiers, create semi-final matches.
  - `generate_final(tournament_id)` — create final from semi winners.
  - `complete_tournament(tournament_id)` — set status `completed` and lock edits.
- **RLS/Triggers**: Prevent writes to `matches` when parent tournament is `completed`.

### Phase 8 — Realtime updates (recommended after MVP)
- Enable Realtime on `matches` channel filtered by `tournament_id` (and implicitly by RLS/space).
- Subscribe in Manage and Live pages to refresh on score updates.

### Phase 9 — Templates and finances (Phase 2 scope)
- **Templates**: CRUD `templates` scoped by `space_id`; allow “Save as Template” from completed tournaments.
- **Club Finances**: `club_finances` and UI to “Add Net Balance to Club Funds”.

### Deliverables & acceptance checks
- Admin routes require session; unauthenticated users are redirected to login.
- All reads/writes scoped by `space_id`; RLS policies active and enforced.
- Wizard drafts persist/restore across reloads/devices; debounce prevents excessive writes.
- Launch is atomic and idempotent; duplicate clicks do not duplicate data.
- Manage/Live pages render from Supabase; scoring updates persist; standings respect tie-break rules.
- Completion locks further edits to `matches`.

### Implementation order (suggested)
1) Phases 0–2 (setup, schema, auth) → 3 (drafts) → 5 (RPC launch) → 6 (read from DB)
2) Then 7 (lifecycle) → 8 (realtime) → 9 (templates/finances)






