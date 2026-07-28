import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StatusPin } from "@/components/studio/Panel";
import { useStudioDb } from "@/features/data/store";
import { cn } from "@/lib/utils";

const TITLE = "Calendar — The Studio OS";
const DESC = "Month view of bookings, session dates and maintenance due dates.";

export const Route = createFileRoute("/_authenticated/calendar")({
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
  component: CalendarPage,
});

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function CalendarPage() {
  const sessions = useStudioDb((s) => s.sessions);
  const tickets = useStudioDb((s) => s.tickets);
  const navigate = useNavigate();

  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(isoOf(now));

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, { sessions: typeof sessions; tickets: typeof tickets }>();
    const get = (k: string) => {
      if (!map.has(k)) map.set(k, { sessions: [], tickets: [] });
      return map.get(k)!;
    };
    for (const s of sessions) get(s.date).sessions.push(s);
    for (const t of tickets) if (t.status !== "done") get(t.due).tickets.push(t);
    return map;
  }, [sessions, tickets]);

  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const day = byDay.get(selected);
  const todayIso = isoOf(now);

  const step = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendar"
        code="CAL / SCHEDULE"
        subtitle="Sessions and maintenance due dates in one grid."
        actions={
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="size-8" aria-label="Previous month" onClick={() => step(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="readout min-w-[140px] text-center text-xs text-foreground">{monthLabel}</span>
            <Button size="icon" variant="ghost" className="size-8" aria-label="Next month" onClick={() => step(1)}>
              <ChevronRight className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="ml-2 h-8"
              onClick={() => {
                setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                setSelected(todayIso);
              }}
            >
              Today
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <Panel title={monthLabel} code="CAL" bodyClassName="p-0">
          <div className="grid grid-cols-7 border-b border-border">
            {DAY_LABELS.map((d) => (
              <div key={d} className="label-console px-2 py-1.5 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((d) => {
              const key = isoOf(d);
              const entry = byDay.get(key);
              const outside = d.getMonth() !== cursor.getMonth();
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={cn(
                    "min-h-[74px] border-b border-r border-border/60 p-1.5 text-left align-top transition-colors hover:bg-muted/40",
                    outside && "opacity-35",
                    selected === key && "bg-muted/60",
                    key === todayIso && "ring-1 ring-inset ring-primary",
                  )}
                >
                  <div className="readout mb-1 text-[0.6rem] text-muted-foreground">{d.getDate()}</div>
                  <div className="space-y-0.5">
                    {entry?.sessions.slice(0, 2).map((s) => (
                      <div key={s.id} className="truncate bg-primary/15 px-1 text-[0.6rem] text-foreground">
                        {s.room.replace("Studio ", "")} · {s.artist}
                      </div>
                    ))}
                    {entry && entry.sessions.length > 2 && (
                      <div className="text-[0.55rem] text-muted-foreground">
                        +{entry.sessions.length - 2} more
                      </div>
                    )}
                    {entry?.tickets.length ? (
                      <div className="truncate text-[0.55rem] text-status-fault">
                        {entry.tickets.length} service due
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title={selected} code="DAY" bodyClassName="p-0">
          {!day || (day.sessions.length === 0 && day.tickets.length === 0) ? (
            <p className="p-4 text-xs text-muted-foreground">Nothing booked on this date.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {day.sessions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/sessions/$sessionId", params: { sessionId: s.id } })}
                    className="w-full px-3 py-2 text-left hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-foreground">{s.title}</span>
                      <span className="readout shrink-0 text-[0.6rem] text-muted-foreground">
                        {s.startTime}–{s.endTime}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusPin tone={s.status === "scheduled" ? "info" : "live"} label={s.status} />
                      <span className="readout text-[0.6rem] text-muted-foreground">{s.room}</span>
                    </div>
                  </button>
                </li>
              ))}
              {day.tickets.map((t) => (
                <li key={t.id} className="px-3 py-2">
                  <div className="truncate text-xs text-foreground">{t.equipment}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusPin tone="fault" label="service due" />
                    <span className="readout text-[0.6rem] text-muted-foreground">{t.fault}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
