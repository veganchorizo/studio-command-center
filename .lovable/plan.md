## Archive Module (ARC)

A new "Archive" section for logging Audio sessions and Video shows. Starts empty; you populate it manually or via CSV import.

### Layout

One page at `/archive` with two tabs:

- **Audio Sessions** — Title, Artist, Primary Drive, Archive Drive, Date, Format, Notes
- **Video Shows** — Title, Media Type, Show Date, Primary Drive, Archive Drive, Notes

Media Type options come from your CSV (Video - Show, Misc. Video, Video - Sessions LIVE, Video - Project, Video - Concert, Video - Concert Stream, Video - Blue Rock aLIVE!, Video - Studio Session, DVD Project, Motion File, Pictures, Misc).

### Table behaviour

- Keyword search across every field
- Click any column header to sort ascending / descending (toggle, with an arrow indicator)
- Dropdown filters for media type and drives
- Click a row to open the detail sheet; edit and delete from there or via the row pencil

### CSV import / export

A toolbar above each tab with three actions:

- **Download template** — empty CSV with just the header row for that tab
- **Import CSV** — file picker, parses rows, shows a confirm dialog with row count and any skipped/invalid lines, then appends to the current tab. Matches your existing export headers, so your two uploaded files import as-is.
- **Export CSV** — downloads the current (filtered) tab as CSV

Import is additive by default, with a checkbox to replace the tab's contents instead.

### Wiring

- New sidebar entry under a new "Archive" group (or in Assets — say if you prefer that), code `ARC`
- Included in the command palette and global search
- Two new collections in the local store (`audioArchives`, `videoArchives`), persisted to localStorage like everything else, and included in the Settings JSON export/import

### Technical notes

- Reuses `CollectionModule` with `hideHeader` for each tab; sortable headers get added to `CollectionModule` as an opt-in prop so other modules are unaffected
- CSV parse/serialize helpers in `src/lib/csv.ts` (quoted-field aware, no new dependency)
- New entity types + empty seeds in `src/features/data/entities.ts` / `seed-entities.ts`; store version bumped so existing saved data merges cleanly
- Route `src/routes/_authenticated/archive.tsx` with its own head metadata
