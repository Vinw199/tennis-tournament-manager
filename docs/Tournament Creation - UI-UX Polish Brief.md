## Tournament Creation – UI/UX Polish Brief

### Goal
- Elevate UI/UX and functionality of the Tournament Creation Wizard while preserving existing architecture and constraints.

### Scope
- Target route: `app/(wizard)/tournaments/new/page.jsx` (and `layout.jsx`).
- Domain logic remains in `domain/` (entries, seeding, standings).
- Persist drafts and launches via Supabase (no localStorage).

### Architecture
- Next.js App Router 15, React 19, Tailwind v4.
- shadcn/ui (Radix-based), lucide-react icons, Sonner toasts.
- Supabase with RLS; multi-tenant via `space_id`.
- Server Components for reads; Client Components for interactions. No realtime.

### Current Wizard Flow
- Steps: details → players → entries & groups → review & launch.
- Balanced doubles pairing; snake seeding; round-robin per group.
- Launch writes `tournaments`, `entries`, and group-stage `matches`.
- Drafts stored in `wizard_drafts` per `(space_id, user_id)`.

### Constraints and Guardrails
- Do not introduce new libraries without explicit approval.
- Knockout flow remains manual: buttons generate Semis and Final; no auto-creation.
- Ask for approval before removing major files/routes; prefer physical moves over re-exports when relocating files.

### Design System & UX Standards
- Brand: green `#2f7a2a`, neutral accents; avoid teal/purple.
- Transitions 150–200ms; cozy density; mobile-first.
- Use skeletons while loading; Sonner toasts for errors/success.
- Accessibility: labels, focus states, keyboard navigation, clear error messaging.

### Data & RLS Notes
- All queries filtered by `space_id`. Writes allowed to authenticated members per RLS.
- Onboarding: `/onboarding` for authenticated users without spaces (creates name, space, linked player).
- Invitations: `/accept-invite/[token]` has public read for valid pending invites; acceptance links `players.user_id`, inserts `space_members`, marks invite accepted, seeds display name, sets `sb-space-id`.

### Improvements to Propose and Implement (small, reviewable diffs)
- Step UX: clearer progress indicator, validations, disabled/visible states.
- Entries & groups: more transparent pairing/seeding feedback; undo/reset affordances.
- Review step: scannable summary with inline edit affordances by section.
- Launch: explicit confirm, better error handling and recovery paths.
- Performance: minimize over-fetch; render only needed fields; avoid unnecessary re-renders.
- Accessibility: focus management on step change; ARIA for dialogs/toasts.

### Acceptance Criteria
- No API/schema changes; no new dependencies.
- Manual Semis/Final behavior unchanged.
- Fully responsive and accessible.
- Changes delivered as small diffs per step with rationale; confirm constraints before sizable changes.



