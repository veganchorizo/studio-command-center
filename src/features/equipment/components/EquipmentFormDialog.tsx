import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROOMS } from "@/features/data/seed";
import { equipmentSchema, type Equipment } from "@/features/data/types";
import { equipmentKeys, newEquipmentId, saveEquipment } from "../data";

export const CATEGORIES = [
  "Microphone",
  "Preamp",
  "Compressor",
  "EQ",
  "Console",
  "Monitor",
  "Converter",
  "Instrument",
  "Amplifier",
  "Utility",
] as const;

export const EQUIPMENT_STATUSES = ["operational", "needs-service", "in-repair", "retired"] as const;

const blank = (): Equipment => ({
  id: newEquipmentId(),
  manufacturer: "",
  model: "",
  category: "Microphone",
  serial: "",
  purchaseDate: "",
  warrantyUntil: "",
  purchasePrice: 0,
  location: "Studio A",
  rack: "",
  status: "operational",
  notes: "",
  knownIssues: "",
  favoriteUses: [],
  maintenanceHistory: [],
});

const csv = (v: string) =>
  v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function EquipmentFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Equipment;
}) {
  const [draft, setDraft] = useState<Equipment>(initial ?? blank());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: saveEquipment,
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.detail(item.id) });
      toast.success(initial ? "Unit updated" : "Unit added to inventory");
      onOpenChange(false);
    },
  });

  const set = <K extends keyof Equipment>(key: K, value: Equipment[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = equipmentSchema.safeParse(draft);
    if (!parsed.success) {
      const flat: Record<string, string> = {};
      for (const issue of (parsed.error as z.ZodError).issues) flat[String(issue.path[0])] = issue.message;
      setErrors(flat);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{initial ? "Edit unit" : "New unit"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Manufacturer" error={errors.manufacturer}>
              <Input value={draft.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} />
            </FormField>
            <FormField label="Model" error={errors.model}>
              <Input value={draft.model} onChange={(e) => set("model", e.target.value)} />
            </FormField>
            <FormField label="Category">
              <Select value={draft.category} onValueChange={(v) => set("category", v as Equipment["category"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Serial number">
              <Input value={draft.serial} onChange={(e) => set("serial", e.target.value)} />
            </FormField>
            <FormField label="Location">
              <Select value={draft.location} onValueChange={(v) => set("location", v as Equipment["location"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOMS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Rack / position">
              <Input value={draft.rack} onChange={(e) => set("rack", e.target.value)} />
            </FormField>
            <FormField label="Status">
              <Select value={draft.status} onValueChange={(v) => set("status", v as Equipment["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Purchase price (USD)">
              <Input
                type="number"
                min={0}
                value={draft.purchasePrice}
                onChange={(e) => set("purchasePrice", Number(e.target.value) || 0)}
              />
            </FormField>
            <FormField label="Purchase date">
              <Input type="date" value={draft.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
            </FormField>
            <FormField label="Warranty until">
              <Input type="date" value={draft.warrantyUntil} onChange={(e) => set("warrantyUntil", e.target.value)} />
            </FormField>
            <FormField label="Next service due">
              <Input
                type="date"
                value={draft.nextServiceDue ?? ""}
                onChange={(e) => set("nextServiceDue", e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Favorite uses (comma separated)">
            <Input value={draft.favoriteUses.join(", ")} onChange={(e) => set("favoriteUses", csv(e.target.value))} />
          </FormField>
          <FormField label="Known issues">
            <Textarea rows={2} value={draft.knownIssues} onChange={(e) => set("knownIssues", e.target.value)} />
          </FormField>
          <FormField label="Notes">
            <Textarea rows={3} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="label-console">{label}</Label>
      {children}
      {error && <p className="text-[0.65rem] text-destructive">{error}</p>}
    </div>
  );
}
