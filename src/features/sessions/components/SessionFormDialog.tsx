import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROOMS } from "@/features/data/seed";
import { sessionSchema, type Session } from "@/features/data/types";
import { newSessionId, saveSession, sessionKeys } from "../data";

const STATUSES = ["scheduled", "tracking", "mixing", "delivered"] as const;

const blank = (): Session => ({
  id: newSessionId(),
  title: "",
  artist: "",
  engineer: "",
  assistant: "",
  date: new Date().toISOString().slice(0, 10),
  startTime: "10:00",
  endTime: "18:00",
  room: "Studio A",
  project: "",
  status: "scheduled",
  songs: [],
  microphones: [],
  outboard: [],
  patching: "",
  cueMixes: "",
  notes: "",
  problems: "",
  mixRevisions: [],
  deliverables: [],
});

const csv = (v: string) =>
  v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function SessionFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Session;
}) {
  const [draft, setDraft] = useState<Session>(initial ?? blank());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: saveSession,
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(s.id) });
      toast.success(initial ? "Session updated" : "Session created");
      onOpenChange(false);
    },
  });

  const set = <K extends keyof Session>(key: K, value: Session[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = sessionSchema.safeParse(draft);
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
          <DialogTitle className="text-base">{initial ? "Edit session" : "New session"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Title" error={errors.title}>
              <Input value={draft.title} onChange={(e) => set("title", e.target.value)} />
            </FormField>
            <FormField label="Artist" error={errors.artist}>
              <Input value={draft.artist} onChange={(e) => set("artist", e.target.value)} />
            </FormField>
            <FormField label="Engineer" error={errors.engineer}>
              <Input value={draft.engineer} onChange={(e) => set("engineer", e.target.value)} />
            </FormField>
            <FormField label="Assistant">
              <Input value={draft.assistant ?? ""} onChange={(e) => set("assistant", e.target.value)} />
            </FormField>
            <FormField label="Date" error={errors.date}>
              <Input type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Start">
                <Input type="time" value={draft.startTime} onChange={(e) => set("startTime", e.target.value)} />
              </FormField>
              <FormField label="End">
                <Input type="time" value={draft.endTime} onChange={(e) => set("endTime", e.target.value)} />
              </FormField>
            </div>
            <FormField label="Room">
              <Select value={draft.room} onValueChange={(v) => set("room", v as Session["room"])}>
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
            <FormField label="Status">
              <Select value={draft.status} onValueChange={(v) => set("status", v as Session["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Project">
              <Input value={draft.project ?? ""} onChange={(e) => set("project", e.target.value)} />
            </FormField>
          </div>

          <FormField label="Songs (comma separated)">
            <Input value={draft.songs.join(", ")} onChange={(e) => set("songs", csv(e.target.value))} />
          </FormField>
          <FormField label="Microphones (comma separated)">
            <Input value={draft.microphones.join(", ")} onChange={(e) => set("microphones", csv(e.target.value))} />
          </FormField>
          <FormField label="Outboard (comma separated)">
            <Input value={draft.outboard.join(", ")} onChange={(e) => set("outboard", csv(e.target.value))} />
          </FormField>
          <FormField label="Patching">
            <Textarea rows={2} value={draft.patching} onChange={(e) => set("patching", e.target.value)} />
          </FormField>
          <FormField label="Cue mixes">
            <Textarea rows={2} value={draft.cueMixes} onChange={(e) => set("cueMixes", e.target.value)} />
          </FormField>
          <FormField label="Session notes">
            <Textarea rows={3} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
          </FormField>
          <FormField label="Problems encountered">
            <Textarea rows={2} value={draft.problems} onChange={(e) => set("problems", e.target.value)} />
          </FormField>
          <FormField label="Deliverables (comma separated)">
            <Input value={draft.deliverables.join(", ")} onChange={(e) => set("deliverables", csv(e.target.value))} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="label-console">{label}</Label>
      {children}
      {error && <p className="text-[0.65rem] text-destructive">{error}</p>}
    </div>
  );
}
