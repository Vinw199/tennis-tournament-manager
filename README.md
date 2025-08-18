## Tennis Tournament App

Modern tournament manager for club events with clean admin tools and a mobile-first public view.

### Tech Stack
- Next.js App Router (15) + React 19
- Tailwind CSS v4
- Local development: Supabase backend ready (schema, indexes, RLS); app still uses `localStorage` until integration is completed.

### Project Structure (high level)
- `app/layout.js` – root layout with no sidebar
- `app/(with-sidebar)/layout.jsx` – admin layout with the left sidebar
  - `app/(with-sidebar)/page.js` – Event Dashboard
  - `app/(with-sidebar)/roster/page.js` – Club Roster (CRUD via localStorage)
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
  - Launch creates a tournament in localStorage and redirects to Manage
- Manage:
  - Match checklist per group, enter/edit scores, forfeit with confirm dialog
  - Standings calculated with tie-breakers (games won → game difference → head-to-head)
  - Semi-final preview bracket (A1 vs B2, B1 vs A2) with connectors; final auto-fills winners
  - “Share Live Link” copies `/t/[id]/live`
- Live:
  - Read-only standings and match checklist; refresh to see latest (realtime planned)

### Data Persistence (MVP)
Local storage utilities in `lib/localStore.js`:
- Tournaments are stored under key `ttapp_tournaments_v1` as a map `{ [id]: tournament }`
- Players are stored under key `ttapp_players_v1` as an array

Tournament object shape (simplified):
```json
{
  "id": "t_...",
  "details": { "name": "...", "date": "YYYY-MM-DD", ... },
  "groups": [ [entry], [entry], ... ],
  "matches": [
    { "id": "g0_0", "round": "Group A", "entry1": {...}, "entry2": {...}, "entry1_score": null, "entry2_score": null, "status": "pending" }
  ]
}
```

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
- Auth (Supabase) + route protection
- Autosave/resume drafts for the wizard + exit confirmation
- Full knockout bracket generation (8–128) with seeding/byes
- Live page polling or Supabase Realtime
- Migrate localStorage to Supabase tables with RLS and multi-tenant `space_id`

### Supabase Status & Docs
- See `docs/Status Update & Next Steps - 2025-08-18.md` for the latest backend status and immediate next steps.
- Supabase implementation details and roadmap:
  - `docs/SUPABASE_IMPLEMENTATION.md`
  - `docs/SUPABASE_ROADMAP.md`
  - `docs/PROGRESS - 2025-08-18.md` (daily progress log, challenges, and changes)

