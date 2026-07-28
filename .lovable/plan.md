
# Milestone 2 — The Remaining 14 Modules

Everything stays local. No cloud backend, no Lovable AI. The assistant talks to an Ollama instance running on the user's own machine.

## 1. Persistence layer (do this first)

The mock store currently lives in memory and resets on reload. Before adding 14 modules of editable data, it gets a persistence adapter:

- Hydrate from `localStorage` on boot; fall back to the generated seed when the key is empty or the stored version is stale
- Write-through on every mutation, debounced, versioned key (`studio-os/db/v1`) so schema changes can re-seed cleanly
- Settings gains "Reset to seed data" and "Export / import JSON" so the store stays inspectable
- One generic `useEntity(collection)` hook + `EntityFormDialog` so new modules don't each hand-roll query keys and mutations

This turns each new module into schema + columns + form fields rather than a fresh data stack.

## 2. New entities

Added to `src/features/data/types.ts` as zod schemas, seeded in `seed.ts`, and cross-linked to existing sessions/equipment by id:

Artist · Project · Client · Task · MaintenanceTicket · InventoryItem · PatchPoint / PatchConnection · Invoice + Expense · Campaign · KnowledgeDoc · TrainingModule + TraineeProgress · CalendarEvent (derived from sessions + bookings) · Conversation + Message · StudioSettings

## 3. Modules

Each gets list + filters + detail + create/edit/delete, role-gated the same way Sessions and Equipment are.

**Operations**
- **Artists** — roster table, detail sheet with contact/label, session history, preferred chains, linked projects
- **Projects** — project records with status pipeline, linked artist, member sessions, deliverable checklist
- **Tasks** — board grouped by status plus a table view, priority/assignee/due filters, inline complete
- **Calendar** — month + week grid over sessions, maintenance due dates and bookings; click-through to source record; create session from a slot

**Assets**
- **Maintenance** — ticket queue (open / in progress / done), links to equipment, logging a completed ticket appends to that gear's maintenance history and clears its service flag
- **Patchbay** — editable rack/row/column grid of normalled patch points, per-point source/destination/notes, saved patch presets, printable view. Grid + forms, not a drag canvas
- **Inventory** — consumables and stock (cables, tape, media) with quantity, min-threshold, low-stock flag feeding the dashboard, check-in/out log

**Business**
- **Clients** — CRM records, contact history log, linked artists/projects/invoices, lifetime value
- **Finance** — invoices and expenses with create/edit, paid/overdue states, monthly revenue summary and simple charts
- **Marketing** — campaign records with channel, status, budget, run dates and linked release/project

**Intelligence**
- **Knowledge Base** — local docs with markdown body, tags, folders, full-text search across the store; retrieval here also feeds the assistant's context
- **Intern Training** — curriculum modules with lessons and sign-off checkboxes, per-trainee progress, owner/engineer can sign off
- **AI Assistant** — see below

**System**
- **Settings** — studio profile, rooms list, user roster and role management, Ollama connection config, data export/import/reset

## 4. AI Assistant — local Ollama

The browser talks straight to Ollama on the user's machine; nothing routes through a server.

- Base URL configurable in Settings, default `http://localhost:11434`, persisted locally
- "Test connection" probes `/api/tags` and lists installed models for a model picker
- Chat streams from `/api/chat` (NDJSON), rendered with markdown and a stop button
- Threaded conversations, each with its own URL (`/assistant/$conversationId`), stored in localStorage alongside the rest of the data
- Retrieval without pgvector: keyword/BM25-style scoring over Knowledge Base docs, session notes, and equipment notes, top matches injected into the system prompt with visible source chips on each answer
- Clear connection-failure state explaining the CORS requirement (`OLLAMA_ORIGINS`) when the probe fails, since Ollama must allow the browser origin

## 5. Global search

The top-bar search and Cmd+K palette are extended to search across every entity type, grouped by module, with keyboard navigation into records.

## Technical notes

- No new routes needed for the 14 modules themselves; existing stubs are replaced. New child routes added for detail views (`artists.$artistId`, `projects.$projectId`, `clients.$clientId`, `knowledge.$docId`, `assistant.$conversationId`)
- All data access keeps going through per-feature `data.ts` modules, so a real API swap stays a per-feature change
- Ollama access is isolated in `src/features/assistant/ollama.ts` — the only file in the app that makes a network call
- Head metadata per route already exists on the stubs and gets updated as each module lands

## Suggested build order

Persistence + shared entity plumbing → Artists, Projects, Clients → Tasks, Maintenance, Inventory → Calendar, Finance, Marketing, Training → Knowledge Base → Patchbay → Assistant + global search → Settings.

Happy to ship this in one pass or stop after each group for review.
