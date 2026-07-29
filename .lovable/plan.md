## Goal

Move both **accounts** and **studio data** off the browser and onto the Studio OS server, so every machine that hits the same container sees the same records and the same logins. Passwords stored as salted hashes, sessions in an encrypted HTTP-only cookie, and an owner-only **Users** screen for creating accounts and assigning roles. Still 100% local — no cloud, no external service.

## How you'd use it

1. On first boot the container creates one owner account from `STUDIO_ADMIN_EMAIL` / `STUDIO_ADMIN_PASSWORD` in your `.env` (a random password is generated and printed to the container log if you don't set one).
2. Sign in as that owner → **Settings → Users** (new sidebar entry, owner-only).
3. Add account: name, email, role (owner / engineer / assistant / intern), initial password. Edit a row to change role, rename, reset password, or deactivate.
4. Anyone on your network signs in against that server and works on the same shared sessions, equipment, archive and knowledge base.

## Part 1 — Accounts

**Storage** — a JSON file at `/data/users.json` in the container, on a named Docker volume so accounts survive image updates.

**Password security** — Node's built-in `scrypt` with a per-user random salt (no new dependencies). Only `salt` + `hash` are stored, comparison is timing-safe, and the browser never receives a hash.

**Sessions** — TanStack Start's `useSession` encrypted cookie (HTTP-only, `sameSite: lax`), keyed off `SESSION_SECRET`, auto-generated into `/data/session.key` on first boot if unset. Sign-in, sign-out and "who am I" run as server functions; CSRF middleware is already in place.

**Roles** — role names and the `atLeast` / `hasAnyRole` helpers are unchanged, so every module's existing `writeRole` gating keeps working. Every server function re-checks the caller's role server-side, so a tampered client can't create accounts or write data it shouldn't.

**Users module** — `/users` route (owner-only, hidden for other roles) in the existing `Panel`/table styling: accounts list with role, status and last sign-in; add/edit dialog; delete with confirm; guard against removing or demoting the last owner. The seeded demo roster and the "Local roster" panel on the sign-in page are removed.

## Part 2 — Shared studio data

**Storage** — the whole `StudioData` document (sessions, artists, equipment, patchbay, maintenance, inventory, clients, projects, marketing, finance, tasks, training, knowledge docs, audio/video archive, assistant threads, settings) moves to `/data/studio.json` on the same volume. Writes are serialised and atomic (write temp file → rename) so two people saving at once can't corrupt it, with a rolling backup copy kept alongside.

**Access** — three server functions: `loadStudio` (read, any signed-in user), `applyMutation` (create/update/delete one record, role-checked per collection), and `replaceStudio` (used by the Import and Reset-to-seed buttons, owner-only).

**Client store** — `src/features/data/store.ts` keeps the same public API (`useStudioDb`, `add`, `update`, `remove`, `patchSettings`…), so no module or component changes. Internally it hydrates from the server instead of localStorage, and each mutation posts to the server then reconciles. The whole app is behind a short loading state on first paint instead of reading localStorage.

**Freshness** — the store polls the server for changes every few seconds while the tab is focused and refetches on window focus, so two people on different machines converge quickly without needing websockets. Last write wins per record; conflicting simultaneous edits to the same row are not merged.

**Migration** — on first sign-in the app detects existing localStorage data and offers a one-click "Push this browser's data to the server" prompt (only when the server store is still empty), so nothing you've entered so far is lost. Export/Import JSON in Settings keeps working, now against the server file.

## Docker

`docker-compose.yml` gains a named `studio-data` volume mounted at `/data` plus the new env vars; the Dockerfile creates `/data` owned by the `studio` user. `.env.example` and `README.md` get first-run instructions and a note on backing up the volume.

## Technical notes

- New files: `src/features/auth/users.server.ts` (scrypt + user file store), `src/features/auth/session.server.ts`, `src/features/auth/auth.functions.ts`, `src/features/auth/admin.functions.ts`, `src/features/data/studio.server.ts` (atomic JSON store), `src/features/data/studio.functions.ts`, `src/routes/_authenticated/users.tsx`.
- Route gating in `_authenticated` switches from a client-only Zustand check to session hydration; `ssr: false` stays, so the shell layout is untouched.
- Env: `STUDIO_DATA_DIR` (default `/data`), `STUDIO_ADMIN_EMAIL`, `STUDIO_ADMIN_PASSWORD`, `SESSION_SECRET` (optional).
- Trade-off worth knowing: a JSON file on a volume is right for a single studio server and a handful of concurrent users. If you later want many concurrent writers or full history, the same server-function boundary can be repointed at Postgres without touching any UI code.
