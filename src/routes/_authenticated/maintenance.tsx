import { createFileRoute } from "@tanstack/react-router";
import { CollectionModule } from "@/components/studio/CollectionModule";
import { Panel } from "@/components/studio/Panel";
import { ENGINEERS } from "@/features/data/seed";
import { useStudioDb } from "@/features/data/store";

const TITLE = "Maintenance — The Studio OS";
const DESC = "Bench queue for faulty gear, service history and upcoming due dates.";

export const Route = createFileRoute("/_authenticated/maintenance")({
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
  component: MaintenancePage,
});

const TONES: Record<string, { tone: "live" | "ok" | "fault" | "idle" | "info"; label: string }> = {
  open: { tone: "fault", label: "open" },
  "in-progress": { tone: "live", label: "in progress" },
  "waiting-parts": { tone: "info", label: "waiting parts" },
  done: { tone: "ok", label: "done" },
};

function Summary() {
  const tickets = useStudioDb((s) => s.tickets);
  const reminders = useStudioDb((s) => s.reminders);
  const today = new Date().toISOString().slice(0, 10);
  const open = tickets.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.due < today);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Panel title="Queue" code="MNT">
        <div className="readout text-2xl text-foreground">{open.length}</div>
        <p className="text-xs text-muted-foreground">tickets not yet closed</p>
      </Panel>
      <Panel title="Overdue" code="MNT">
        <div className="readout text-2xl text-primary">{overdue.length}</div>
        <p className="text-xs text-muted-foreground">past their due date</p>
      </Panel>
      <Panel title="Next service due" code="MNT" bodyClassName="p-0">
        <ul className="divide-y divide-border/60">
          {reminders.slice(0, 3).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
              <span className="truncate text-foreground">{r.equipment}</span>
              <span className="readout shrink-0 text-[0.65rem] text-muted-foreground">{r.due}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function MaintenancePage() {
  const equipment = useStudioDb((s) => s.equipment);
  const equipmentNames = equipment.map((e) => `${e.manufacturer} ${e.model}`);

  return (
    <CollectionModule
      collection="tickets"
      title="Maintenance tickets"
      code="MNT / BENCH"
      subtitle="Faults, who owns them and when they close."
      idPrefix="MTK"
      summary={<Summary />}
      tone={(row) => TONES[String(row.status)] ?? { tone: "idle", label: String(row.status) }}
      fields={[
        { key: "equipment", label: "Equipment", kind: "select", required: true, filter: true, options: equipmentNames },
        { key: "fault", label: "Fault", required: true },
        { key: "status", label: "Status", kind: "select", filter: true, options: ["open", "in-progress", "waiting-parts", "done"] },
        { key: "priority", label: "Priority", kind: "select", filter: true, options: ["low", "normal", "high"] },
        { key: "opened", label: "Opened", kind: "date" },
        { key: "due", label: "Due", kind: "date" },
        { key: "assignee", label: "Assignee", kind: "select", filter: true, options: ENGINEERS },
        { key: "resolution", label: "Resolution", kind: "textarea" },
      ]}
      sort={(a, b) => String(a.due).localeCompare(String(b.due))}
    />
  );
}
