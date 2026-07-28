import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { PageHeader, Panel, StatusPin } from "@/components/studio/Panel";
import { EquipmentFormDialog, CATEGORIES, EQUIPMENT_STATUSES } from "@/features/equipment/components/EquipmentFormDialog";
import { EQUIPMENT_TONE } from "@/features/equipment/status";
import { equipmentKeys, listEquipment, type EquipmentFilters } from "@/features/equipment/data";
import { ROOMS } from "@/features/data/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { atLeast, useAuth } from "@/features/auth/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/equipment/")({
  head: () => ({
    meta: [
      { title: "Equipment — The Studio OS" },
      { name: "description", content: "Full gear inventory with location, rack position, status and service history." },
      { property: "og:title", content: "Equipment — The Studio OS" },
      {
        property: "og:description",
        content: "Full gear inventory with location, rack position, status and service history.",
      },
    ],
  }),
  component: EquipmentPage,
});

function EquipmentPage() {
  const [filters, setFilters] = useState<EquipmentFilters>({ q: "", category: "all", location: "all", status: "all" });
  const [view, setView] = useState<"table" | "grid">("table");
  const [creating, setCreating] = useState(false);
  const canEdit = atLeast(useAuth((s) => s.user), "assistant");

  const { data, isLoading } = useQuery({
    queryKey: equipmentKeys.list(filters),
    queryFn: () => listEquipment(filters),
  });

  const set = (patch: Partial<EquipmentFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Equipment"
        code="EQP / INVENTORY"
        subtitle={`${data?.length ?? 0} units listed`}
        actions={
          <>
            <div className="flex border border-border">
              <ViewToggle active={view === "table"} onClick={() => setView("table")} label="Table view">
                <List className="size-3.5" />
              </ViewToggle>
              <ViewToggle active={view === "grid"} onClick={() => setView("grid")} label="Grid view">
                <LayoutGrid className="size-3.5" />
              </ViewToggle>
            </div>
            {canEdit && (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="mr-1.5 size-3.5" /> New unit
              </Button>
            )}
          </>
        }
      />

      <Panel title="Filters" code="EQP/FLT" bodyClassName="p-2">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search make, model, serial…"
            value={filters.q ?? ""}
            onChange={(e) => set({ q: e.target.value })}
          />
          <FilterSelect value={filters.category!} onChange={(v) => set({ category: v })} label="Category" options={CATEGORIES} />
          <FilterSelect value={filters.location!} onChange={(v) => set({ location: v })} label="Location" options={ROOMS} />
          <FilterSelect value={filters.status!} onChange={(v) => set({ status: v })} label="Status" options={EQUIPMENT_STATUSES} />
        </div>
      </Panel>

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : !data || data.length === 0 ? (
        <Panel>
          <p className="py-10 text-center text-xs text-muted-foreground">No gear matches those filters.</p>
        </Panel>
      ) : view === "table" ? (
        <Panel title="Inventory" code="EQP/IDX" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["ID", "Manufacturer", "Model", "Category", "Location", "Rack", "Next service", "Status"].map((h) => (
                    <th key={h} className="label-console px-3 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((e) => (
                  <tr key={e.id} className="border-b border-border/60 transition-colors hover:bg-panel-raised">
                    <td className="readout px-3 py-1.5 text-[0.65rem] text-muted-foreground/70">{e.id}</td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">{e.manufacturer}</td>
                    <td className="px-3 py-1.5">
                      <Link
                        to="/equipment/$equipmentId"
                        params={{ equipmentId: e.id }}
                        className="text-xs text-foreground hover:text-primary"
                      >
                        {e.model}
                      </Link>
                    </td>
                    <td className="readout px-3 py-1.5 text-[0.65rem] text-muted-foreground">{e.category}</td>
                    <td className="readout px-3 py-1.5 text-[0.65rem] text-muted-foreground">{e.location}</td>
                    <td className="readout px-3 py-1.5 text-[0.65rem] text-muted-foreground">{e.rack || "—"}</td>
                    <td className="readout px-3 py-1.5 text-[0.65rem] text-muted-foreground">{e.nextServiceDue ?? "—"}</td>
                    <td className="px-3 py-1.5">
                      <StatusPin tone={EQUIPMENT_TONE[e.status]} label={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((e) => (
            <Link key={e.id} to="/equipment/$equipmentId" params={{ equipmentId: e.id }} className="group">
              <Panel
                title={e.model}
                code={e.id}
                className="h-full transition-colors group-hover:border-primary/50"
              >
                <p className="text-xs text-muted-foreground">{e.manufacturer}</p>
                <p className="readout mt-2 text-[0.65rem] text-muted-foreground">
                  {e.category} · {e.location}
                  {e.rack ? ` · ${e.rack}` : ""}
                </p>
                <div className="mt-3">
                  <StatusPin tone={EQUIPMENT_TONE[e.status]} label={e.status} />
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      )}

      {creating && <EquipmentFormDialog open={creating} onOpenChange={setCreating} />}
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "px-2 py-1.5 transition-colors",
        active ? "bg-panel-raised text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

const PLURAL: Record<string, string> = { Status: "statuses", Category: "categories", Room: "rooms", Location: "locations", Engineer: "engineers" };

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
        <SelectItem value="all">All {PLURAL[label] ?? `${label.toLowerCase()}s`}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
