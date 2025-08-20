## Tennis Tournament App

Modern tournament manager for club events with clean admin tools and a mobile-first public view.

### Tech Stack
- Next.js App Router (15) + React 19
- Tailwind CSS v4
- Supabase backend (schema, indexes, RLS). Drafts and launches are Supabase-only (no localStorage).

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

### Data Persistence
- Supabase tables: `spaces`, `space_members`, `players`, `tournaments`, `entries`, `matches`, `wizard_drafts`.
- Drafts: `wizard_drafts` per `(space_id, user_id)`; autosave debounced.
- Launch: inserts `tournaments`, `entries`, and group-stage `matches`.

### Design System
- Brand green: `#2f7a2a` (sidebar gradient uses darker → lighter)
- Accent purple: `#4B306A` (buttons/lines)
- Font: Inter

Sidebar active behavior:
- Current page row tinted; hover shows a small white pill indicator to the left.

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
- Past Events: recap page with formatted dates and read-only view; filters by date/name
- Live page: shows name/date, Semis/Final bracket; redirects to recap when completed (no live links for completed events)
- Testing: unit tests for `domain/` (entries, snake seeding, round-robin, standings); light E2E for create → manage → complete

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

