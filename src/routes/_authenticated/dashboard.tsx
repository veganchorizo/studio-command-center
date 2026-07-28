import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, ArrowUpRight, CircleDollarSign, Clock, Wrench } from "lucide-react";
import { PageHeader, Panel, StatusPin } from "@/components/studio/Panel";
import { useStudioDb } from "@/features/data/store";
import { useAuth } from "@/features/auth/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Center — The Studio OS" },
      { name: "description", content: "Today's sessions, maintenance, tasks and studio status at a glance." },
      { property: "og:title", content: "Command Center — The Studio OS" },
      { property: "og:description", content: "Today's sessions, maintenance, tasks and studio status at a glance." },
    ],
  }),
  component: Dashboard,
});

const isoToday = () => new Date().toISOString().slice(0, 10);

function Dashboard() {
  const user = useAuth((s) => s.user);
  const { sessions, equipment, tasks, notes, invoices, conversations, reminders, toggleTask } = useStudioDb();
  const today = isoToday();

  const todays = useMemo(() => sessions.filter((s) => s.date === today), [sessions, today]);
  const upcoming = useMemo(
    () => sessions.filter((s) => s.date > today).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 6),
    [sessions, today],
  );
  const service = equipment.filter((e) => e.status === "needs-service" || e.status === "in-repair").slice(0, 6);
  const openTasks = tasks.filter((t) => !t.done).slice(0, 6);
  const openInvoices = invoices.filter((i) => !i.paid);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${user?.name}`}
        code="DSH / COMMAND CENTER"
        subtitle={`${todays.length} session${todays.length === 1 ? "" : "s"} on the books today · ${service.length} units flagged · ${openTasks.length} open tasks`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sessions today" value={todays.length} tone={todays.length ? "live" : "idle"} />
        <Stat label="Gear flagged" value={service.length} tone={service.length ? "fault" : "ok"} />
        <Stat label="Open tasks" value={openTasks.length} tone="info" />
        <Stat
          label="Unpaid invoices"
          value={openInvoices.length}
          tone={openInvoices.length ? "live" : "ok"}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel
          title="Today's sessions"
          code="SES/TODAY"
          className="lg:col-span-2"
          actions={<ModuleLink to="/sessions" />}
        >
          {todays.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No sessions booked. The rooms are dark today.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {todays.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/sessions/$sessionId"
                    params={{ sessionId: s.id }}
                    className="flex items-center gap-3 py-2 transition-colors hover:bg-panel-raised"
                  >
                    <span className="readout w-24 shrink-0 text-xs text-primary">
                      {s.startTime}–{s.endTime}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{s.title}</span>
                    <span className="readout hidden shrink-0 text-[0.65rem] text-muted-foreground sm:block">
                      {s.room}
                    </span>
                    <StatusPin tone={s.status === "tracking" ? "live" : "info"} label={s.status} pulse={s.status === "tracking"} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Upcoming" code="SES/NEXT" actions={<ModuleLink to="/sessions" />}>
          <ul className="divide-y divide-border">
            {upcoming.map((s) => (
              <li key={s.id}>
                <Link
                  to="/sessions/$sessionId"
                  params={{ sessionId: s.id }}
                  className="flex items-center gap-2 py-2 transition-colors hover:bg-panel-raised"
                >
                  <span className="readout w-20 shrink-0 text-[0.65rem] text-muted-foreground">{s.date}</span>
                  <span className="min-w-0 flex-1 truncate text-xs">{s.artist}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Equipment needing service" code="EQP/FLAG" actions={<ModuleLink to="/equipment" />}>
          {service.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Everything is operational.</p>
          ) : (
            <ul className="divide-y divide-border">
              {service.map((e) => (
                <li key={e.id}>
                  <Link
                    to="/equipment/$equipmentId"
                    params={{ equipmentId: e.id }}
                    className="flex items-center gap-2 py-2 transition-colors hover:bg-panel-raised"
                  >
                    <AlertTriangle className="size-3 shrink-0 text-status-fault" />
                    <span className="min-w-0 flex-1 truncate text-xs">
                      {e.manufacturer} {e.model}
                    </span>
                    <span className="readout shrink-0 text-[0.6rem] text-muted-foreground">{e.location}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Maintenance reminders" code="MNT/DUE" actions={<ModuleLink to="/maintenance" />}>
          <ul className="divide-y divide-border">
            {reminders.slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center gap-2 py-2">
                <Wrench className="size-3 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-xs">{r.equipment}</span>
                <span
                  className={cn(
                    "readout shrink-0 text-[0.6rem]",
                    r.due < isoToday() ? "text-status-fault" : "text-muted-foreground",
                  )}
                >
                  {r.due}
                </span>
              </li>
            ))}
            {reminders.length === 0 && (
              <li className="py-6 text-center text-xs text-muted-foreground">Nothing scheduled.</li>
            )}
          </ul>
        </Panel>

        <Panel title="Studio tasks" code="TSK/OPEN" actions={<ModuleLink to="/tasks" />}>
          <ul className="divide-y divide-border">
            {openTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTask(t.id)}
                  className="size-3 shrink-0 accent-[var(--primary)]"
                  aria-label={`Mark ${t.title} done`}
                />
                <span className="min-w-0 flex-1 truncate text-xs">{t.title}</span>
                {t.priority === "high" && <StatusPin tone="fault" label="hi" />}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Unread notes" code="NOT/NEW" className="lg:col-span-2">
          <ul className="divide-y divide-border">
            {notes.slice(0, 5).map((n) => (
              <li key={n.id} className="py-2">
                <p className="text-xs text-foreground">{n.body}</p>
                <p className="readout mt-1 text-[0.6rem] text-muted-foreground">
                  {n.author} · {n.context} · {n.createdAt}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent AI conversations" code="AI/HIST" actions={<ModuleLink to="/assistant" />}>
          <ul className="divide-y divide-border">
            {conversations.map((c) => (
              <li key={c.id} className="py-2">
                <p className="truncate text-xs text-foreground">{c.title}</p>
                <p className="readout mt-0.5 text-[0.6rem] text-muted-foreground">
                  {c.agent} · {c.updatedAt}
                  {c.pinned && " · pinned"}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Open invoices" code="FIN/AR" actions={<ModuleLink to="/finance" />}>
          <ul className="divide-y divide-border">
            {openInvoices.map((i) => (
              <li key={i.id} className="flex items-center gap-2 py-2">
                <CircleDollarSign className="size-3 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-xs">{i.client}</span>
                <span className="readout shrink-0 text-xs text-foreground">
                  {i.amount.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                </span>
                <span
                  className={cn(
                    "readout w-20 shrink-0 text-right text-[0.6rem]",
                    i.due < isoToday() ? "text-status-fault" : "text-muted-foreground",
                  )}
                >
                  {i.due}
                </span>
              </li>
            ))}
            {openInvoices.length === 0 && (
              <li className="py-6 text-center text-xs text-muted-foreground">All settled.</li>
            )}
          </ul>
        </Panel>

        <Panel title="Knowledge activity" code="KB/IDX" actions={<ModuleLink to="/knowledge" />}>
          <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            Ingestion pipeline lands in a later pass.
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ModuleLink({ to }: { to: string }) {
  return (
    <Link to={to} className="text-muted-foreground transition-colors hover:text-primary" aria-label="Open module">
      <ArrowUpRight className="size-3.5" />
    </Link>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "live" | "ok" | "fault" | "info" | "idle" }) {
  const toneClass = {
    live: "text-status-live",
    ok: "text-status-ok",
    fault: "text-status-fault",
    info: "text-status-info",
    idle: "text-muted-foreground",
  }[tone];
  return (
    <div className="border border-border bg-panel px-3 py-2.5">
      <div className="label-console">{label}</div>
      <div className={cn("readout mt-1.5 text-2xl font-semibold", toneClass)}>{String(value).padStart(2, "0")}</div>
    </div>
  );
}
