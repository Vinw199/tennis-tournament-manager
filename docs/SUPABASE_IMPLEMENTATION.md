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
 - Public access allowed on `/accept-invite/[token]` for welcome page only; onboarding is protected and only available to authenticated users without a space.

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

#### 4b) Invitation & Collaboration
- players
  - add `user_id uuid null references auth.users(id)`
- invites
  - `id uuid primary key`
  - `space_id uuid references spaces(id)`
  - `player_id uuid references players(id) unique` (1:1 link ensures unambiguous ownership)
  - `invited_by uuid references auth.users(id)`
  - `invitee_email text`
  - `token text unique`
  - `status text check (status in ('pending','accepted','expired'))`
  - `created_at timestamptz default now()`
  - `expires_at timestamptz null`
- profiles view
  - `create view public.profiles as select id, raw_user_meta_data->>'display_name' as display_name from auth.users;`
- space_members constraint
  - `alter table public.space_members add constraint user_id_space_id_unique unique (user_id, space_id);`

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
  - Use browser Supabase client for client-side interactions (e.g., scoring modal).
  - Public Live page reads are allowed via RLS for active tournaments only; completed redirects to recap.
  - Invitation acceptance route `/accept-invite/[token]` reads minimal invite context publicly via RLS for valid, pending tokens.
  - Onboarding route `/onboarding` is server-rendered; it fetches the user's spaces and redirects to `/` when the user already has a space.

### 7) Scoring & Live Updates
- Write scores with direct table updates (RLS-protected). No realtime for cost control.
- Live page is public for active tournaments (RLS policy); completed events should be viewed on the recap route.

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

---

## Invitation System Details

### RLS for Invitations
- Public read-only access is permitted for invite-related rows when and only when a valid, pending `token` is supplied by the `/accept-invite/[token]` route.
  - Scope: selected fields from `invites`, `players`, and `spaces` necessary to render the welcome page.
- All writes remain restricted to authenticated users; acceptance is performed via a SECURITY DEFINER function or server action that enforces final checks.

### Accept Invite Flow (Server)
1) Validate: token exists, is `pending`, not expired; email matches `invitee_email` if provided; user is not already a member of the space.
2) Single transaction:
   - `update players set user_id = auth.uid() where id = :player_id;`
   - `insert into space_members (space_id, user_id, role) values (:space_id, auth.uid(), 'member') on conflict do nothing;`
   - `update invites set status = 'accepted' where id = :invite_id;`
3) Post-transaction:
   - Seed `auth.users.raw_user_meta_data.display_name` from `players.name` when missing (service role context or admin RPC).
   - Set `sb-space-id` cookie to the joined space so it becomes active immediately.
   - Redirect to dashboard `/?invite_accepted=true` to trigger a one-time welcome dialog.

### Email Delivery
- Send invitation emails via Resend using a React Email template populated with space name and inviter display name from `public.profiles`.
- Configure `RESEND_API_KEY` as an environment secret; send from server-side only.

### Migrations
- See:
  - `supabase/migrations/20250903154137_add_invitation_system.sql`
  - `supabase/migrations/20250904154434_create_accept_invite_function.sql`
  - `supabase/migrations/20250905183827_create_profiles_view.sql`
  - `supabase/migrations/20250905200630_updat_invites_rls_policy.sql`

---

## Onboarding Details

### Route and Guard
- Route: `/onboarding` (server component page).
- Guard: The page queries `space_members` for the current user; if any membership exists, it redirects to `/`.

### Server Action: handleOnboarding
- Inputs: `userName`, `spaceName`.
- Steps:
  1) Update `auth.users` metadata `display_name` with `userName`.
  2) Insert into `spaces` with `created_by = auth.uid()`.
  3) DB trigger adds creator to `space_members`.
  4) Insert `players` row with `{ space_id, name: userName, user_id: auth.uid(), default_skill_rank: 1 }`.
  5) Redirect to `/`.
- Errors are surfaced inline on the form.

### Middleware Behavior
- Unauthenticated users are redirected to `/login` except for public routes (`/login`, `/signup`, `/error`, `/accept-invite/*`, and `/t/[id]/live`).
- After signup without an invite token, users are redirected to `/onboarding`.

