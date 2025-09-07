## Tennis Tournament App

Modern tournament manager for club events with clean admin tools and a mobile-first public view.

### Tech Stack
- Next.js App Router (15) + React 19
- Tailwind CSS v4
- Supabase backend (schema, indexes, RLS). Drafts and launches are Supabase-only (no localStorage).
- shadcn/ui (locally generated components) on Radix primitives
- lucide-react for icons
- Sonner (via shadcn) for toasts

### Project Structure (high level)
- `app/layout.js` – root layout with no sidebar
- `app/(with-sidebar)/layout.jsx` – admin layout with the left sidebar
  - `app/(with-sidebar)/page.js` – Event Dashboard
  - `app/(with-sidebar)/roster/page.js` – Club Roster (Supabase CRUD)
  - `app/(with-sidebar)/past-events/page.js`
  - `app/(with-sidebar)/settings/page.js`
- `app/(wizard)/tournaments/new/` – Tournament creation wizard (no sidebar)
- `app/(with-sidebar)/t/[tournamentId]/manage/` – Manage tournament (with sidebar)
- `app/t/[tournamentId]/live/` – Public read-only live page (no sidebar)
- `app/accept-invite/[token]/page.js` – Invitation acceptance (public read-only via RLS for pending invites)
- `app/onboarding/page.jsx` – First-time setup for new users (create profile name and space)

### Current MVP Features
- Roster: add/edit/delete players (name, rank, age, gender, optional picture URL)
- Wizard: 4-step flow (details → players → entries & groups → review & launch)
  - Balanced doubles entry generation
  - Snake seeding into groups
  - Round-robin match checklist per group
  - Draft autosaves to Supabase; launch inserts to Supabase and redirects to Manage
- Manage:
  - Match checklist per group, enter/edit scores, forfeit with confirm dialog
  - Standings calculated with tie-breakers (games won → game difference → head-to-head)
  - Semi-final preview bracket (A1 vs B2, B1 vs A2) with connectors; final auto-fills winners
  - “Share Live Link” copies `/t/[id]/live`
- Live:
  - Read-only standings and match checklist; refresh to see latest (realtime planned)

### Onboarding (First-Time Setup)
- Route: `/onboarding`.
- After signup without an invite, users are redirected here to enter their name and create their first space.
- Guard: If the user already belongs to at least one space, `/onboarding` redirects to `/`.
- Form: `components/onboarding/OnboardingForm.jsx` posts to a server action that:
  - Updates `auth.users` display_name to the entered name.
  - Inserts a row into `spaces` and relies on a DB trigger to add the creator to `space_members`.
  - Creates a `players` row for the user and links it via `players.user_id`.
  - Redirects to `/` on success.

### Data Persistence
- Supabase tables: `spaces`, `space_members`, `players`, `tournaments`, `entries`, `matches`, `wizard_drafts`.
- Drafts: `wizard_drafts` per `(space_id, user_id)`; autosave debounced.
- Launch: inserts `tournaments`, `entries`, and group-stage `matches`.

### Invitation & Collaboration
- Admins invite real users to claim specific roster players.
- Route: `/accept-invite/[token]` (works while logged out; read-only data via RLS only for valid pending invites).
- Acceptance flow:
  - Validates token, email, and membership.
  - Links `players.user_id`, inserts `space_members`, and marks invite accepted in a single transaction.
  - Seeds `auth.users` display name from the player's name when missing, sets `sb-space-id`, then redirects to dashboard with `?invite_accepted=true` to trigger a one-time welcome.
- Key schema updates:
  - `players.user_id` (nullable FK → `auth.users.id`)
  - `invites` (id, space_id, player_id UNIQUE, invited_by, invitee_email, token UNIQUE, status, created_at, expires_at)
  - `profiles` view for safe user display names
  - `space_members` UNIQUE `(user_id, space_id)`
- Email delivery via Resend using a server-side React email template.
- New files: `app/accept-invite/[token]/page.js`, `components/acceptInvite/AcceptInviteForm.jsx`, `components/emails/InvitationEmail.jsx`, `components/WelcomeDialog.jsx`.

### Design System
- Brand green: `#2f7a2a`
- Neutral accents (no teal/purple). Tokens mapped to Tailwind v4 CSS variables
  - `--primary` = brand green
  - `--accent` = neutral (muted)
  - Skeletons use `bg-muted` (neutral), not colored
- Minimal transitions (150–200ms), cozy density
- Icons: lucide-react
- Font: Inter

Sidebar active behavior:
- Current page row tinted; hover shows a small white pill indicator to the left.

### UI Component System (shadcn)
- Button: `components/ui/button`
- Card: `components/ui/card`
- Dialog: `components/ui/dialog` (replaced legacy `components/ui/Modal.jsx`)
- Table: `components/ui/table`
- Select: `components/ui/select`
- Skeleton: `components/ui/skeleton`
- Toaster (Sonner): `components/ui/sonner` with `<Toaster />` in `app/layout.js`

Notes
- All imports updated to shadcn Button; legacy Button removed from usage
- Confirm dialogs and score modals use shadcn Dialog
- Inputs: stick to styled native `<input>` (shadcn Input removed from usage by design)

### Key Decisions and Route Groups
- Root layout has no sidebar.
- Admin pages live under `(with-sidebar)` to inherit the sidebar.
- Auth `(auth)` and Wizard `(wizard)` groups intentionally omit the sidebar.
- Public Live route remains under `/t/[id]/live` with no sidebar.

### Running Locally
```bash
npm install
npm run dev
# open http://localhost:3000
```

### Near-term Roadmap
- Wizard UX: simplified save flow (no autosave), explicit saves on step change and Exit; deterministic pairing; validations
- Manage UX: badges for semis/final status, disable all edit actions when tournament is completed, non-admin read-only guard
- Scoring safety: enforce DB-side locking so writes to `matches` are rejected when parent `tournaments.status = 'completed'` (RLS/trigger)
- Live page: shows name/date, Semis/Final bracket; redirects to recap when completed (no live links for completed events)
- Testing: unit tests for `domain/` (entries, snake seeding, round-robin, standings); light E2E for create → manage → complete

### UI polish in this phase
- Global theme
  - Removed teal accent; mapped `--accent` to neutral; brand green drives primary
  - Added Sonner Toaster globally in `app/layout.js`
- Navigation & actions
  - Sidebar enhanced with lucide icons; consistent shadcn Buttons across pages
- Dashboard
  - Converted boxes to shadcn Cards and Buttons; added neutral skeleton when no active tournament
- Roster
  - Table migrated to shadcn Table; form uses native inputs with labels; added list skeleton while loading
- Wizard
  - Uses shadcn Select; native inputs; added page skeleton while hydrating
- Manage
  - Group tables use shadcn Table; stacked vertically; neutral skeletons while loading
  - Replaced alerts with Sonner toasts for generation errors
- Live
  - Standings use shadcn Table; stacked vertically; added skeletons for header and groups
- Past Events (Archive)
  - Simplified copy; list in a Card without inner borders; neutral skeleton/empty state
  - Content width aligned to `max-w-6xl` (also for Settings)

### Supabase Status & Docs
- See `docs/Status Update & Next Steps - 2025-08-18.md` for the latest backend status and immediate next steps.
- Supabase implementation details and roadmap:
  - `docs/SUPABASE_IMPLEMENTATION.md`
  - `docs/SUPABASE_ROADMAP.md`
  - `docs/PROGRESS - 2025-08-18.md` (daily progress log, challenges, and changes)

### Project Context for New Chats
- Architecture
  - Supabase-only drafts and launches (no localStorage, no RPCs, no realtime).
  - Manual knockout flow: buttons to generate Semi-Finals and Final; Final enabled only after semis completed.
  - Completed tournaments are read-only and shown under Past Events; `/t/[id]/live` redirects to recap when completed.
- Environment
  - Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SPACE_ID`.
  - Set `NEXT_PUBLIC_SPACE_ID` to your space's UUID (see `supabase/seed.sql` helper or your existing space).
  - Optional: `RESEND_API_KEY` for sending invitation emails.
- Key Files
  - Wizard: `app/(wizard)/tournaments/new/page.jsx` and server action `app/(wizard)/actions.js`.
  - Manage: `app/(with-sidebar)/t/[tournamentId]/manage/page.jsx` and actions `app/t/actions.js`.
  - Past Events: `app/(with-sidebar)/past-events/page.js` and recap `app/(with-sidebar)/past-events/[tournamentId]/page.js`.
- Folder Structure
  - Domain logic: `domain/` (pure helpers for entries, standings, bracket).
  - Data/clients: `data/` (e.g., wizard draft client helpers).
- Decisions
  - No realtime for cost control; Live page is read-only and refresh-based.
  - RLS enforced by `space_id`; admin-only writes to tournament data.

