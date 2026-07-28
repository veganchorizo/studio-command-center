import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel } from "@/components/studio/Panel";
import { useAuth, atLeast } from "@/features/auth/store";
import { useStudioDb } from "@/features/data/store";
import type { PatchPoint } from "@/features/data/entities";
import { cn } from "@/lib/utils";

const TITLE = "Patchbay — The Studio OS";
const DESC = "Bay-by-bay patch point map with normals, sources and destinations.";

export const Route = createFileRoute("/_authenticated/patchbay")({
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
  component: PatchbayPage,
});

const NORMAL_STYLE: Record<PatchPoint["normalled"], string> = {
  full: "border-status-ok/60",
  half: "border-primary/60",
  none: "border-border",
};

function PatchbayPage() {
  const points = useStudioDb((s) => s.patchPoints);
  const upsert = useStudioDb((s) => s.upsert);
  const user = useAuth((s) => s.user);
  const canWrite = atLeast(user, "assistant");

  const bays = useMemo(() => [...new Set(points.map((p) => p.bay))], [points]);
  const [bay, setBay] = useState<string>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<PatchPoint | null>(null);

  const shown = bays.filter((b) => bay === "all" || b === bay);
  const needle = q.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Patchbay"
        code="PTC / MAP"
        subtitle="Top row feeds, bottom row destinations. Green is fully normalled, amber is half."
        actions={
          <Button size="sm" variant="secondary" className="h-8" onClick={() => window.print()}>
            Print map
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find a point, source or destination…"
          className="h-8 min-w-[220px] flex-1 text-xs"
        />
        <Select value={bay} onValueChange={setBay}>
          <SelectTrigger className="h-8 w-[220px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All bays</SelectItem>
            {bays.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {shown.map((b) => {
        const bayPoints = points.filter((p) => p.bay === b);
        return (
          <Panel key={b} title={b} code="PTC" bodyClassName="overflow-x-auto p-3">
            {(["top", "bottom"] as const).map((row) => (
              <div key={row} className="mb-3 last:mb-0">
                <div className="label-console mb-1">{row} row</div>
                <div className="flex gap-1">
                  {bayPoints
                    .filter((p) => p.row === row)
                    .sort((a, b2) => a.position - b2.position)
                    .map((p) => {
                      const text = `${p.label} ${p.source} ${p.destination}`.toLowerCase();
                      const dim = needle.length > 0 && !text.includes(needle);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => canWrite && setEditing(p)}
                          className={cn(
                            "w-[86px] shrink-0 border bg-background px-1.5 py-1 text-left transition-colors hover:border-primary",
                            NORMAL_STYLE[p.normalled],
                            dim && "opacity-25",
                          )}
                        >
                          <div className="readout text-[0.6rem] text-primary">{p.label}</div>
                          <div className="truncate text-[0.6rem] text-muted-foreground">
                            {p.source || p.destination || "—"}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </Panel>
        );
      })}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md border-border bg-panel">
          <DialogHeader>
            <DialogTitle className="text-base">Patch point {editing?.label}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="label-console mb-1 block" htmlFor="pp-label">Label</label>
                <Input
                  id="pp-label"
                  className="h-8 text-xs"
                  value={editing.label}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                />
              </div>
              <div>
                <label className="label-console mb-1 block" htmlFor="pp-source">Source</label>
                <Input
                  id="pp-source"
                  className="h-8 text-xs"
                  value={editing.source}
                  onChange={(e) => setEditing({ ...editing, source: e.target.value })}
                />
              </div>
              <div>
                <label className="label-console mb-1 block" htmlFor="pp-dest">Destination</label>
                <Input
                  id="pp-dest"
                  className="h-8 text-xs"
                  value={editing.destination}
                  onChange={(e) => setEditing({ ...editing, destination: e.target.value })}
                />
              </div>
              <div>
                <label className="label-console mb-1 block" htmlFor="pp-norm">Normalling</label>
                <Select
                  value={editing.normalled}
                  onValueChange={(v) => setEditing({ ...editing, normalled: v as PatchPoint["normalled"] })}
                >
                  <SelectTrigger id="pp-norm" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full normal</SelectItem>
                    <SelectItem value="half">Half normal</SelectItem>
                    <SelectItem value="none">Not normalled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="label-console mb-1 block" htmlFor="pp-notes">Notes</label>
                <Textarea
                  id="pp-notes"
                  rows={3}
                  className="text-xs"
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!editing) return;
                upsert("patchPoints", editing);
                setEditing(null);
                toast.success("Patch point updated");
              }}
            >
              Save point
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
