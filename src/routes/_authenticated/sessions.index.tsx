import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader, Panel, StatusPin } from "@/components/studio/Panel";
import { SessionFormDialog } from "@/features/sessions/components/SessionFormDialog";
import { listSessions, sessionKeys, type SessionFilters } from "@/features/sessions/data";
import { ENGINEERS, ROOMS } from "@/features/data/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { atLeast, useAuth } from "@/features/auth/store";
import { STATUS_TONE } from "@/features/sessions/status";

export const Route = createFileRoute("/_authenticated/sessions/")({
  head: () => ({
    meta: [
      { title: "Sessions — The Studio OS" },
      { name: "description", content: "Every recording session, searchable by artist, engineer, room and date." },
      { property: "og:title", content: "Sessions — The Studio OS" },
      {
        property: "og:description",
        content: "Every recording session, searchable by artist, engineer, room and date.",
      },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const [filters, setFilters] = useState<SessionFilters>({ q: "", room: "all", status: "all", engineer: "all" });
  const [creating, setCreating] = useState(false);
  const canEdit = atLeast(useAuth((s) => s.user), "assistant");

  const { data, isLoading } = useQuery({
    queryKey: sessionKeys.list(filters),
    queryFn: () => listSessions(filters),
  });

  const set = (patch: Partial<SessionFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sessions"
        code="SES / LOG"
        subtitle={`${data?.length ?? 0} matching sessions`}
        actions={
          canEdit && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="mr-1.5 size-3.5" /> New session
            </Button>
          )
        }
      />

      <Panel title="Filters" code="SES/FLT" bodyClassName="p-2">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <Input
            placeholder="Search title, artist, song…"
            value={filters.q ?? ""}
            onChange={(e) => set({ q: e.target.value })}
            className="lg:col-span-2"
          />
          <FilterSelect value={filters.room!} onChange={(v) => set({ room: v })} label="Room" options={ROOMS} />
          <FilterSelect
            value={filters.status!}
            onChange={(v) => set({ status: v })}
            label="Status"
            options={["scheduled", "tracking", "mixing", "delivered"]}
          />
          <FilterSelect
            value={filters.engineer!}
            onChange={(v) => set({ engineer: v })}
            label="Engineer"
            options={ENGINEERS}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={filters.from ?? ""} onChange={(e) => set({ from: e.target.value })} />
            <Input type="date" value={filters.to ?? ""} onChange={(e) => set({ to: e.target.value })} />
          </div>
        </div>
      </Panel>

      <Panel title="Session log" code="SES/IDX" bodyClassName="p-0">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Date", "ID", "Session", "Artist", "Room", "Engineer", "Status"].map((h) => (
                    <th key={h} className="label-console px-3 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 transition-colors hover:bg-panel-raised">
                    <td className="readout whitespace-nowrap px-3 py-1.5 text-xs text-muted-foreground">{s.date}</td>
                    <td className="readout whitespace-nowrap px-3 py-1.5 text-xs text-muted-foreground/70">{s.id}</td>
                    <td className="max-w-[260px] px-3 py-1.5">
                      <Link
                        to="/sessions/$sessionId"
                        params={{ sessionId: s.id }}
                        className="block truncate text-xs text-foreground hover:text-primary"
                      >
                        {s.title}
                      </Link>
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-1.5 text-xs text-muted-foreground">{s.artist}</td>
                    <td className="readout whitespace-nowrap px-3 py-1.5 text-[0.65rem] text-muted-foreground">
                      {s.room}
                    </td>
                    <td className="readout whitespace-nowrap px-3 py-1.5 text-[0.65rem] text-muted-foreground">
                      {s.engineer}
                    </td>
                    <td className="px-3 py-1.5">
                      <StatusPin tone={STATUS_TONE[s.status]} label={s.status} pulse={s.status === "tracking"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-10 text-center text-xs text-muted-foreground">No sessions match those filters.</p>
        )}
      </Panel>

      {creating && <SessionFormDialog open={creating} onOpenChange={setCreating} />}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label.toLowerCase() === "status" ? "statuses" : `${label.toLowerCase()}s`}</SelectItem>
        {options.filter(Boolean).map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
