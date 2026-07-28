import { createFileRoute } from "@tanstack/react-router";
import { CollectionModule } from "@/components/studio/CollectionModule";

const TITLE = "Clients — The Studio OS";
const DESC = "Client records, contact history and lifetime value across the studio.";

export const Route = createFileRoute("/_authenticated/clients")({
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
  component: ClientsPage,
});

const TONES: Record<string, { tone: "live" | "ok" | "fault" | "idle" | "info"; label: string }> = {
  prospect: { tone: "info", label: "prospect" },
  active: { tone: "live", label: "active" },
  retained: { tone: "ok", label: "retained" },
  dormant: { tone: "idle", label: "dormant" },
};

function ClientsPage() {
  return (
    <CollectionModule
      collection="clients"
      title="Clients"
      code="CLI / CRM"
      subtitle="Who books the rooms, what they are worth and when you last spoke."
      idPrefix="CLI"
      writeRole="engineer"
      tone={(row) => TONES[String(row.tier)] ?? { tone: "idle", label: String(row.tier) }}
      fields={[
        { key: "company", label: "Company", required: true },
        { key: "name", label: "Contact" },
        { key: "tier", label: "Tier", kind: "select", filter: true, options: ["prospect", "active", "retained", "dormant"] },
        { key: "email", label: "Email", mono: true },
        { key: "phone", label: "Phone", mono: true, table: false },
        { key: "lifetimeValue", label: "Lifetime value", kind: "number", format: (v) => `£${Number(v ?? 0).toLocaleString()}` },
        { key: "lastContact", label: "Last contact", kind: "date" },
        { key: "notes", label: "Notes", kind: "textarea" },
      ]}
      sort={(a, b) => Number(b.lifetimeValue ?? 0) - Number(a.lifetimeValue ?? 0)}
    />
  );
}
