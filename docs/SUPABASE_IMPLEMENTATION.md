## Supabase Implementation (Short Plan)

This document outlines how we will replace all localStorage usage with Supabase, aligned with the project's multi-tenant architecture and UX goals.

### 1) Setup
- Use Supabase CLI for local dev: `supabase start`
- Environment variables in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `NEXT_PUBLIC_SPACE_ID` (MVP single space)
- Use helpers in `utils/supabase/`:
  - Browser: `utils/supabase/client.js` using `createBrowserClient`
  - Server: `utils/supabase/server.js` using `createServerClient`
  - Middleware: `utils/supabase/middleware.js` for token refresh and cookie sync

### 2) Auth & Route Protection
- Supabase Auth for email/password (MVP) → oauth later.
- Session check in `(with-sidebar)` layout (server): redirect unauthenticated users to `(auth)/login`.
- RLS ensures users can only access rows for their `space_id` via `space_members`.
 - Middleware refreshes tokens and syncs cookies; unauthenticated access allowed on `/login`, `/signup`, `/error`.

### 3) Multi-tenancy
- All user data rows include `space_id`.
- RLS helpers and template:
  - `get_user_spaces()` for membership checks (read)
  - `get_user_admin_spaces()` for admin checks (write)
  - Example: `using (space_id in (select get_user_spaces()))` and `with check (space_id in (select get_user_admin_spaces()))`

### 4) Schema (minimum to launch)
- `users` (managed by Supabase)
- `spaces` (id, name, created_by)
- `space_members` (space_id, user_id, role)
- `players` (id, space_id, name, default_skill_rank, age, gender, profile_picture_url)
- `tournaments` (id, space_id, date, name, status, entry_fee, prize_money_details, settings jsonb)
- `entries` (id, tournament_id, name)
- `entry_players` (entry_id, player_id, skill_rank_for_tournament)
- `matches` (id, tournament_id, round, entry1_id, entry2_id, entry1_score, entry2_score, status)
- `wizard_drafts` (id, space_id, user_id, updated_at, data jsonb) – Supabase-only drafts (no localStorage)
- (Optional later) `club_finances`, `templates`

Migrations will live in `supabase/migrations` with SQL files checked into git.

### 5) Draft Persistence (Wizard)
- Store full draft in `wizard_drafts.data`:
  - `step`, `details`, `selectedPlayerIds`, `halfByPlayerId`, `numberOfGroups`
- On wizard load, fetch latest draft for `(space_id, user_id)` and hydrate state.
- On Exit → Save: upsert draft; on Launch: delete draft.

### 6) Data Fetching Model
- Server Components:
  - Read players/tournaments/entries/matches via server Supabase client.
  - Filter by `space_id` and `tournament_id`.
- Client Components:
  - Use browser Supabase client for Realtime and client-side interactions (e.g., scoring modal).

### 7) Scoring & Live Updates
- Write scores with direct table updates (RLS-protected). No realtime for cost control.

### 8) Storage (Player Pictures)
- Bucket `avatars` with public read and RLS write by member.
- `players.profile_picture_url` stores the public URL.

### 9) Status Flow & Locking
- `tournaments.status`: `planning` → `active` → `completed`.
- On completion: lock `matches` from edits (enforced by RLS or trigger).

### 10) Progressive Rollout
- Phase A: implement `wizard_drafts` + Auth + RLS; keep roster/tournaments/matches in Supabase but feature-parity with current MVP.
- Phase B: enable Realtime on `matches` for Live and Manage.
- Phase C: introduce `templates`, `club_finances`, and multi-space management UI.

### 11) Error Handling & Observability
- Graceful toasts for write errors.
- Server-side logging for failed Supabase operations.

### 12) Performance
- Prefer Server Components for reads; select only fields needed.
- Add composite indexes on `(space_id, tournament_id)` and common filters.
 - Avoid recursive policy conditions; use SECURITY DEFINER helpers for membership/role.

This plan keeps the current UI/logic intact while swapping the persistence layer. All queries must be filtered by `space_id` and respect RLS.


