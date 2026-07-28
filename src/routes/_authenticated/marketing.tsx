import { createFileRoute } from "@tanstack/react-router";
import { CollectionModule } from "@/components/studio/CollectionModule";

const TITLE = "Marketing — The Studio OS";
const DESC = "Campaign planning across channels, with budgets and linked releases.";

export const Route = createFileRoute("/_authenticated/marketing")({
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
  component: MarketingPage,
});

const TONES: Record<string, { tone: "live" | "ok" | "fault" | "idle" | "info"; label: string }> = {
  draft: { tone: "idle", label: "draft" },
  scheduled: { tone: "info", label: "scheduled" },
  running: { tone: "live", label: "running" },
  complete: { tone: "ok", label: "complete" },
};

function MarketingPage() {
  return (
    <CollectionModule
      collection="campaigns"
      title="Campaigns"
      code="MKT / CAMPAIGNS"
      subtitle="What is going out, where, when and what it costs."
      idPrefix="MKT"
      writeRole="engineer"
      tone={(row) => TONES[String(row.status)] ?? { tone: "idle", label: String(row.status) }}
      fields={[
        { key: "name", label: "Campaign", required: true },
        { key: "channel", label: "Channel", kind: "select", filter: true, options: ["Instagram", "Newsletter", "YouTube", "Local Press", "Partnership", "Website"] },
        { key: "status", label: "Status", kind: "select", filter: true, options: ["draft", "scheduled", "running", "complete"] },
        { key: "start", label: "Start", kind: "date" },
        { key: "end", label: "End", kind: "date" },
        { key: "budget", label: "Budget", kind: "number", format: (v) => `£${Number(v ?? 0).toLocaleString()}` },
        { key: "linkedProject", label: "Linked project", table: false },
        { key: "notes", label: "Notes", kind: "textarea" },
      ]}
      sort={(a, b) => String(b.start).localeCompare(String(a.start))}
    />
  );
}
