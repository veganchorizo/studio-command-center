import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Field, PageHeader, Panel, StatusPin } from "@/components/studio/Panel";
import { EquipmentFormDialog } from "@/features/equipment/components/EquipmentFormDialog";
import { EQUIPMENT_TONE } from "@/features/equipment/status";
import { deleteEquipment, equipmentKeys, getEquipment, relatedSessions } from "@/features/equipment/data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { atLeast, useAuth } from "@/features/auth/store";

export const Route = createFileRoute("/_authenticated/equipment/$equipmentId")({
  head: ({ params }) => ({
    meta: [
      { title: `Unit ${params.equipmentId} — The Studio OS` },
      { name: "description", content: "Gear record: specs, location, service history and sessions that used it." },
      { property: "og:title", content: `Unit ${params.equipmentId} — The Studio OS` },
      {
        property: "og:description",
        content: "Gear record: specs, location, service history and sessions that used it.",
      },
    ],
  }),
  component: EquipmentDetail,
});

function EquipmentDetail() {
  const { equipmentId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const canEdit = atLeast(useAuth((s) => s.user), "assistant");

  const { data: item, isLoading } = useQuery({
    queryKey: equipmentKeys.detail(equipmentId),
    queryFn: () => getEquipment(equipmentId),
  });

  const { data: sessions } = useQuery({
    queryKey: ["equipment", "sessions", equipmentId],
    queryFn: () => relatedSessions(item!),
    enabled: !!item,
  });

  const remove = useMutation({
    mutationFn: () => deleteEquipment(equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
      toast.success("Unit removed from inventory");
      navigate({ to: "/equipment" });
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!item)
    return (
      <Panel>
        <EmptyState title="Unit not found" hint="It may have been removed from inventory." />
        <div className="flex justify-center">
          <Button asChild variant="ghost" size="sm">
            <Link to="/equipment">Back to inventory</Link>
          </Button>
        </div>
      </Panel>
    );

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${item.manufacturer} ${item.model}`}
        code={`EQP / ${item.id}`}
        subtitle={`${item.category} · ${item.location}${item.rack ? ` · ${item.rack}` : ""}`}
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to="/equipment">
                <ArrowLeft className="mr-1.5 size-3.5" /> Inventory
              </Link>
            </Button>
            {canEdit && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                  <Pencil className="mr-1.5 size-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Specification" code="EQP/SPEC" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Serial">{item.serial}</Field>
            <Field label="Category">{item.category}</Field>
            <Field label="Location">{item.location}</Field>
            <Field label="Rack">{item.rack}</Field>
            <Field label="Purchased">{item.purchaseDate}</Field>
            <Field label="Warranty until">{item.warrantyUntil}</Field>
            <Field label="Price">
              {item.purchasePrice
                ? item.purchasePrice.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })
                : ""}
            </Field>
            <Field label="Status">
              <StatusPin tone={EQUIPMENT_TONE[item.status]} label={item.status} />
            </Field>
          </div>
        </Panel>

        <Panel title="Next service" code="EQP/DUE">
          <p className="readout text-2xl text-primary">{item.nextServiceDue ?? "—"}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {item.knownIssues || "No known issues logged."}
          </p>
        </Panel>

        <Panel title="Favorite uses" code="EQP/USE">
          {item.favoriteUses.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing logged yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {item.favoriteUses.map((u) => (
                <li
                  key={u}
                  className="readout border border-border bg-panel-raised px-2 py-1 text-[0.65rem] text-foreground"
                >
                  {u}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Notes" code="EQP/NOT">
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">{item.notes || "—"}</p>
        </Panel>

        <Panel title="Maintenance history" code="EQP/LOG">
          {item.maintenanceHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground">No service recorded.</p>
          ) : (
            <ul className="divide-y divide-border">
              {item.maintenanceHistory.map((m, i) => (
                <li key={`${m.date}-${i}`} className="py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-foreground">{m.type}</span>
                    <span className="readout text-[0.6rem] text-muted-foreground">{m.date}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.note} — {m.performedBy}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Sessions using this unit" code="EQP/SES" className="lg:col-span-2">
          {!sessions || sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No linked sessions found.</p>
          ) : (
            <ul className="divide-y divide-border">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/sessions/$sessionId"
                    params={{ sessionId: s.id }}
                    className="flex items-center gap-3 py-2 transition-colors hover:bg-panel-raised"
                  >
                    <span className="readout w-20 shrink-0 text-[0.65rem] text-muted-foreground">{s.date}</span>
                    <span className="min-w-0 flex-1 truncate text-xs">{s.title}</span>
                    <span className="readout hidden shrink-0 text-[0.6rem] text-muted-foreground sm:block">
                      {s.room}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {editing && <EquipmentFormDialog open={editing} onOpenChange={setEditing} initial={item} />}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this unit?</AlertDialogTitle>
            <AlertDialogDescription>
              {item.manufacturer} {item.model} will be deleted from inventory. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
