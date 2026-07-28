# The Studio OS — Milestone 1: Front-End Shell

Building the full interface with no backend. All data comes from a local mock layer designed so each module can be swapped to a real API later by replacing one file per feature. Nothing here calls an external service.

## Scope note on the original brief

Docker Compose, Fastify, Prisma, Ollama and pgvector can't run or be verified in this environment, so this milestone is the client: the design system, navigation, auth surface, and three fully-built modules. Feature folders expose a typed data-source interface (`listSessions`, `getEquipment`, …) so pointing them at a self-hosted API later is a per-feature swap, not a rewrite.

## Design language — Console Graphite

Dark by default, no light theme in this milestone.

- `#0C0D0F` page void, `#17191D` panel, `#2A2D33` rails/borders, `#E8A33D` amber accent
- Amber reserved for live/active state (recording, overdue, alerts) — never decorative
- Tight radii (2–4px), 1px hairline borders, no drop shadows, no gradients
- Mono for all numerics, IDs, timecodes, serials; sans for prose
- Dense rows, small type scale, ALL-CAPS section labels
- Status pins: amber (active), green (ok), red (fault), grey (idle)

All values land as tokens in `src/styles.css`. No hardcoded colors in components.

## Auth + roles

Client-side auth store with a seeded local admin, sign-in form, and route gating.

- Roles: `owner`, `engineer`, `assistant`, `intern`
- Public `/` sign-in screen; everything else lives under an `_authenticated` gate
- Signed-in home is `/dashboard`
- Role helpers (`hasRole`, `hasAnyRole`) gate sidebar items and destructive actions — interns see a reduced nav
- Session persists to localStorage; header shows the current user with sign-out

Passwords are not real security here — it's the UI contract for a real auth backend later.

## App shell

- Collapsible left sidebar, icon-only when collapsed, with all 17 modules: Dashboard, Sessions, Artists, Projects, Equipment, Maintenance, Patchbay, Inventory, Clients, Tasks, Calendar, Knowledge Base, AI Assistant, Marketing, Finance, Intern Training, Settings
- Top bar: global search field, current-date/room strip, user menu
- Command palette on `Cmd/Ctrl+K` for jump-to-anything navigation
- Keyboard-first: `g` then key for module jumps, `/` to focus search
- Every module not in the milestone gets a real route with a styled "module not wired yet" panel — no dead links

## Dashboard (command center)

Grid of widgets over mock data:

Today's sessions · Upcoming sessions · Equipment needing service · Maintenance reminders · Open tasks · Recent notes · Open invoices · Recent AI conversations

Widgets are declared in a registry array, so reordering or hiding is a data change, not a layout rewrite (drag-reorder deferred).

## Sessions

- List view: dense table, filter by date range / room / engineer / artist, sort, search
- Detail view: artist, engineer, assistant, date, room, project, songs, mic list, outboard, patching notes, cue mixes, session notes, problems, mix revisions, deliverables
- Create/edit form with zod validation, writing to the mock store
- Status pins for scheduled / tracking / mixing / delivered

## Equipment

- Grid + table toggle, filter by category, room, rack, status
- Detail view: manufacturer, model, serial, purchase date, warranty, location, rack, notes, known issues, favorite uses, maintenance history timeline, related sessions
- Create/edit form with validation
- "Needs service" flag feeding the dashboard widget

## Technical notes

- TanStack Router file routes; `_authenticated` layout owns the gate
- Zustand for auth + UI state (sidebar, palette); TanStack Query over the mock data source so the swap to HTTP later is transparent
- Strict TypeScript, zod schemas as the single source of truth for entity types
- Feature-folder layout: `src/features/{sessions,equipment,dashboard,auth}/` each with `data/`, `components/`, `schema.ts`
- Seed data: ~40 sessions across 2 years, ~60 equipment items, ~15 artists/clients — enough to exercise filtering and empty states

## Not in this milestone

AI Assistant, Knowledge Base ingestion, Patchbay canvas, Finance, Marketing, Calendar, Training, plugin system — routed and stubbed, built in later passes.