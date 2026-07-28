import { createFileRoute } from "@tanstack/react-router";
import { CollectionModule } from "@/components/studio/CollectionModule";
import { ARTISTS } from "@/features/data/seed";

const TITLE = "Projects — The Studio OS";
const DESC = "Project pipeline from planning through delivery, linked to artists and sessions.";

export const Route = createFileRoute("/_authenticated/projects")({
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
  component: ProjectsPage,
});

const TONES: Record<string, { tone: "live" | "ok" | "fault" | "idle" | "info"; label: string }> = {
  planning: { tone: "idle", label: "planning" },
  tracking: { tone: "live", label: "tracking" },
  mixing: { tone: "info", label: "mixing" },
  mastering: { tone: "info", label: "mastering" },
  delivered: { tone: "ok", label: "delivered" },
};

function ProjectsPage() {
  return (
    <CollectionModule
      collection="projects"
      title="Projects"
      code="PRJ / PIPELINE"
      subtitle="Every record in flight, with its artist, budget and target date."
      idPrefix="PRJ"
      tone={(row) => TONES[String(row.status)] ?? { tone: "idle", label: String(row.status) }}
      fields={[
        { key: "title", label: "Title", required: true },
        { key: "artist", label: "Artist", kind: "select", filter: true, options: ARTISTS },
        { key: "type", label: "Type", kind: "select", filter: true, options: ["Album", "EP", "Single", "Score", "Live", "Reissue"] },
        { key: "status", label: "Status", kind: "select", filter: true, options: ["planning", "tracking", "mixing", "mastering", "delivered"] },
        { key: "startDate", label: "Start", kind: "date" },
        { key: "targetDate", label: "Target", kind: "date" },
        { key: "budget", label: "Budget", kind: "number", format: (v) => `£${Number(v ?? 0).toLocaleString()}` },
        { key: "deliverables", label: "Deliverables", kind: "tags", table: false },
        { key: "notes", label: "Notes", kind: "textarea" },
      ]}
      sort={(a, b) => String(b.targetDate).localeCompare(String(a.targetDate))}
    />
  );
}
