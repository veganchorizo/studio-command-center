import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollectionModule, type FieldDef } from "@/components/studio/CollectionModule";
import { PageHeader } from "@/components/studio/Panel";
import { useStudioDb, type CollectionName } from "@/features/data/store";
import { downloadCsv, mapCsvRows, parseCsv, toCsv } from "@/lib/csv";

const TITLE = "Archive — The Studio OS";
const DESC = "Log every audio session and video show with its primary and archive drive.";

export const Route = createFileRoute("/_authenticated/archive")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ArchivePage,
});

const MEDIA_TYPES = [
  "Video - Show",
  "Video - Sessions LIVE",
  "Video - Studio Session",
  "Video - Session",
  "Video - Concert",
  "Video - Concert Stream",
  "Video - Blue Rock aLIVE!",
  "Video - Project",
  "Video - Tech Night",
  "DVD Project",
  "Motion File",
  "Motion Folder",
  "Misc. Video",
  "Misc. MOV",
  "Misc. JPG",
  "Pictures",
  "Pictures - Studio Session",
  "Audio Backup",
  "Misc",
] as const;

const AUDIO_FIELDS: FieldDef[] = [
  { key: "title", label: "Folder or file title", required: true, wide: true },
  { key: "artist", label: "Artist" },
  { key: "date", label: "Date", kind: "date" },
  { key: "format", label: "Format" },
  { key: "primaryDrive", label: "Primary drive", mono: true },
  { key: "archiveDrive", label: "Archive drive", mono: true },
  { key: "notes", label: "Notes", kind: "textarea", table: false },
];

const VIDEO_FIELDS: FieldDef[] = [
  { key: "title", label: "Folder or file title", required: true, wide: true },
  { key: "mediaType", label: "Media type", kind: "select", filter: true, options: MEDIA_TYPES },
  { key: "showDate", label: "Show date" },
  { key: "primaryDrive", label: "Primary drive", mono: true },
  { key: "archiveDrive", label: "Archive drive", mono: true },
  { key: "notes", label: "Notes", kind: "textarea", table: false },
];

const AUDIO_HEADERS = ["FOLDER or FILE TITLE", "ARTIST", "DATE", "FORMAT", "PRIMARY DRIVE", "ARCHIVE DRIVE", "NOTES"];
const AUDIO_KEYS = ["title", "artist", "date", "format", "primaryDrive", "archiveDrive", "notes"];
const AUDIO_ALIASES: Record<string, string[]> = {
  title: ["FOLDER or FILE TITLE", "TITLE", "NAME"],
  artist: ["ARTIST"],
  date: ["DATE", "SESSION DATE"],
  format: ["FORMAT", "MEDIA TYPE"],
  primaryDrive: ["PRIMARY DRIVE"],
  archiveDrive: ["ARCHIVE DRIVE"],
  notes: ["NOTES"],
};

const VIDEO_HEADERS = ["FOLDER or FILE TITLE", "MEDIA TYPE", "SHOW DATE", "PRIMARY DRIVE", "ARCHIVE DRIVE", "NOTES"];
const VIDEO_KEYS = ["title", "mediaType", "showDate", "primaryDrive", "archiveDrive", "notes"];
const VIDEO_ALIASES: Record<string, string[]> = {
  title: ["FOLDER or FILE TITLE", "TITLE", "NAME"],
  mediaType: ["MEDIA TYPE", "TYPE"],
  showDate: ["SHOW DATE", "DATE"],
  primaryDrive: ["PRIMARY DRIVE"],
  archiveDrive: ["ARCHIVE DRIVE"],
  notes: ["NOTES"],
};

function ArchivePage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Archive"
        code="ARC / MEDIA"
        subtitle="Audio sessions and video shows, with the drives they live on. Import or export the whole catalog as CSV."
      />
      <Tabs defaultValue="audio">
        <TabsList>
          <TabsTrigger value="audio">Audio sessions</TabsTrigger>
          <TabsTrigger value="video">Video shows</TabsTrigger>
        </TabsList>

        <TabsContent value="audio" className="mt-4">
          <CollectionModule
            collection="audioArchives"
            title="Audio sessions"
            code="ARC / AUDIO"
            subtitle=""
            idPrefix="ARA"
            hideHeader
            sortable
            fields={AUDIO_FIELDS}
            toolbar={
              <CsvTools
                collection="audioArchives"
                filename="blue-rock-audio-archives"
                headers={AUDIO_HEADERS}
                keys={AUDIO_KEYS}
                aliases={AUDIO_ALIASES}
                idPrefix="ARA"
              />
            }
          />
        </TabsContent>

        <TabsContent value="video" className="mt-4">
          <CollectionModule
            collection="videoArchives"
            title="Video shows"
            code="ARC / VIDEO"
            subtitle=""
            idPrefix="ARV"
            hideHeader
            sortable
            fields={VIDEO_FIELDS}
            toolbar={
              <CsvTools
                collection="videoArchives"
                filename="blue-rock-video-archives"
                headers={VIDEO_HEADERS}
                keys={VIDEO_KEYS}
                aliases={VIDEO_ALIASES}
                idPrefix="ARV"
              />
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CsvTools({
  collection,
  filename,
  headers,
  keys,
  aliases,
  idPrefix,
}: {
  collection: CollectionName;
  filename: string;
  headers: string[];
  keys: string[];
  aliases: Record<string, string[]>;
  idPrefix: string;
}) {
  const rows = useStudioDb((s) => s[collection]) as unknown as Array<Record<string, unknown>>;
  const importData = useStudioDb((s) => s.importData);
  const [replace, setReplace] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    try {
      const parsed = parseCsv(await file.text());
      const { records, skipped, matchedColumns } = mapCsvRows(parsed, aliases, "title");
      if (!matchedColumns) {
        toast.error("No matching columns", { description: "Download the template to see the expected headers." });
        return;
      }
      if (!records.length) {
        toast.error("Nothing to import", { description: "No rows had a title." });
        return;
      }
      const next = records.map((r, i) => {
        const row: Record<string, unknown> = { id: `${idPrefix}-${Date.now().toString(36)}-${i}` };
        for (const k of keys) row[k] = r[k] ?? "";
        return row;
      });
      importData({ [collection]: replace ? next : [...next, ...rows] } as never);
      toast.success(`${next.length} row${next.length === 1 ? "" : "s"} imported`, {
        description: skipped ? `${skipped} row${skipped === 1 ? "" : "s"} skipped (no title).` : undefined,
      });
    } catch {
      toast.error("Could not read that file");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />
      <label className="flex cursor-pointer items-center gap-1.5 pr-1 text-[0.7rem] text-muted-foreground">
        <Checkbox checked={replace} onCheckedChange={(v) => setReplace(!!v)} />
        Replace
      </label>
      <Button size="sm" variant="secondary" className="h-8" onClick={() => input.current?.click()}>
        <Upload className="size-3.5" /> Import CSV
      </Button>
      <Button
        size="sm"
        variant="secondary"
        className="h-8"
        onClick={() => downloadCsv(`${filename}.csv`, toCsv(headers, rows, keys))}
      >
        <Download className="size-3.5" /> Export
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8"
        onClick={() => downloadCsv(`${filename}-template.csv`, toCsv(headers, [], keys))}
      >
        <FileDown className="size-3.5" /> Template
      </Button>
    </div>
  );
}
