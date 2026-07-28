import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Field, PageHeader, Panel, StatusPin } from "@/components/studio/Panel";
import { SessionFormDialog } from "@/features/sessions/components/SessionFormDialog";
import { deleteSession, getSession, sessionKeys } from "@/features/sessions/data";
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
import { STATUS_TONE } from "@/features/sessions/status";

export const Route = createFileRoute("/_authenticated/sessions/$sessionId")({
  head: ({ params }) => ({
    meta: [
      { title: `Session ${params.sessionId} — The Studio OS` },
      { name: "description", content: "Full session recall sheet: gear, patching, cue mixes, notes and deliverables." },
      { property: "og:title", content: `Session ${params.sessionId} — The Studio OS` },
      {
        property: "og:description",
        content: "Full session recall sheet: gear, patching, cue mixes, notes and deliverables.",
      },
    ],
  }),
  component: SessionDetail,
});

function SessionDetail() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const canEdit = atLeast(useAuth((s) => s.user), "assistant");

  const { data: session, isLoading } = useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => getSession(sessionId),
  });

  const remove = useMutation({
    mutationFn: () => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      toast.success("Session deleted");
      navigate({ to: "/sessions" });
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!session)
    return (
      <Panel>
        <EmptyState title="Session not found" hint="It may have been deleted from the log." />
        <div className="flex justify-center">
          <Button asChild variant="ghost" size="sm">
            <Link to="/sessions">Back to sessions</Link>
          </Button>
        </div>
      </Panel>
    );

  return (
    <div className="space-y-4">
      <PageHeader
        title={session.title}
        code={`SES / ${session.id}`}
        subtitle={`${session.date} · ${session.startTime}–${session.endTime} · ${session.room}`}
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to="/sessions">
                <ArrowLeft className="mr-1.5 size-3.5" /> Log
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
        <Panel title="Overview" code="SES/HEAD" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Artist">{session.artist}</Field>
            <Field label="Project">{session.project}</Field>
            <Field label="Engineer">{session.engineer}</Field>
            <Field label="Assistant">{session.assistant}</Field>
            <Field label="Room">{session.room}</Field>
            <Field label="Date">{session.date}</Field>
            <Field label="Call time">
              {session.startTime}–{session.endTime}
            </Field>
            <Field label="Status">
              <StatusPin tone={STATUS_TONE[session.status]} label={session.status} pulse={session.status === "tracking"} />
            </Field>
          </div>
        </Panel>

        <Panel title="Songs" code="SES/TRK">
          <ChipList items={session.songs} empty="No songs logged." />
        </Panel>

        <Panel title="Microphones" code="SES/MIC">
          <ChipList items={session.microphones} empty="No mics logged." />
        </Panel>

        <Panel title="Outboard" code="SES/OUT">
          <ChipList items={session.outboard} empty="No outboard logged." />
        </Panel>

        <Panel title="Deliverables" code="SES/DEL">
          <ChipList items={session.deliverables} empty="Nothing delivered yet." />
        </Panel>

        <Panel title="Patching" code="SES/PAT">
          <Pre text={session.patching} />
        </Panel>

        <Panel title="Cue mixes" code="SES/CUE">
          <Pre text={session.cueMixes} />
        </Panel>

        <Panel title="Problems encountered" code="SES/ERR">
          <Pre text={session.problems} />
        </Panel>

        <Panel title="Session notes" code="SES/NOT" className="lg:col-span-2">
          <Pre text={session.notes} />
        </Panel>

        <Panel title="Mix revisions" code="SES/REV">
          {session.mixRevisions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No revisions yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {session.mixRevisions.map((r) => (
                <li key={r.label} className="py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="readout text-xs text-primary">{r.label}</span>
                    <span className="readout text-[0.6rem] text-muted-foreground">{r.date}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.note}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {editing && <SessionFormDialog open={editing} onOpenChange={setEditing} initial={session} />}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              {session.title} will be removed from the log. This cannot be undone.
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

function ChipList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">{empty}</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <li key={i} className="readout border border-border bg-panel-raised px-2 py-1 text-[0.65rem] text-foreground">
          {i}
        </li>
      ))}
    </ul>
  );
}

function Pre({ text }: { text: string }) {
  if (!text) return <p className="text-xs text-muted-foreground">—</p>;
  return <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">{text}</p>;
}
