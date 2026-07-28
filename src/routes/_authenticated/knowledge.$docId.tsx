import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, Field, PageHeader, Panel } from "@/components/studio/Panel";
import { useAuth, atLeast } from "@/features/auth/store";
import { useStudioDb } from "@/features/data/store";
import type { KnowledgeDoc } from "@/features/data/entities";

const FOLDERS: KnowledgeDoc["folder"][] = [
  "Signal Flow",
  "Gear Notes",
  "Procedures",
  "House Style",
  "Troubleshooting",
];

export const Route = createFileRoute("/_authenticated/knowledge/$docId")({
  head: () => ({
    meta: [
      { title: "Document — Knowledge Base — The Studio OS" },
      { name: "description", content: "A single studio knowledge base document with its tags and revision date." },
      { property: "og:title", content: "Document — Knowledge Base — The Studio OS" },
      { property: "og:description", content: "A single studio knowledge base document with its tags and revision date." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocPage,
});

function DocPage() {
  const { docId } = Route.useParams();
  const doc = useStudioDb((s) => s.knowledge.find((d) => d.id === docId));
  const upsert = useStudioDb((s) => s.upsert);
  const remove = useStudioDb((s) => s.remove);
  const user = useAuth((s) => s.user);
  const canWrite = atLeast(user, "assistant");
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<KnowledgeDoc | null>(null);

  if (!doc) {
    return (
      <Panel title="Not found" code="KB">
        <EmptyState title="That document no longer exists" hint="It may have been deleted." />
        <div className="flex justify-center">
          <Link to="/knowledge" className="text-xs text-primary underline-offset-4 hover:underline">
            Back to the library
          </Link>
        </div>
      </Panel>
    );
  }

  const active = editing && draft ? draft : doc;

  function save() {
    if (!draft) return;
    upsert("knowledge", { ...draft, updated: new Date().toISOString().slice(0, 10) });
    setEditing(false);
    toast.success("Document saved");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={active.title}
        code={`KB / ${doc.id}`}
        subtitle={`${doc.folder} · updated ${doc.updated} · ${doc.author}`}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-8" onClick={() => navigate({ to: "/knowledge" })}>
              <ArrowLeft className="size-3.5" /> Library
            </Button>
            {canWrite &&
              (editing ? (
                <>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-8" onClick={save}>
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setDraft({ ...doc });
                      setEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8"
                    onClick={() => {
                      remove("knowledge", doc.id);
                      toast.success("Document deleted");
                      navigate({ to: "/knowledge" });
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              ))}
          </div>
        }
      />

      <Panel title="Document" code={doc.folder}>
        {editing && draft ? (
          <div className="space-y-3">
            <div>
              <label className="label-console mb-1 block" htmlFor="kb-title">Title</label>
              <Input
                id="kb-title"
                className="h-8 text-xs"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label-console mb-1 block" htmlFor="kb-folder">Folder</label>
                <Select
                  value={draft.folder}
                  onValueChange={(v) => setDraft({ ...draft, folder: v as KnowledgeDoc["folder"] })}
                >
                  <SelectTrigger id="kb-folder" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLDERS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="label-console mb-1 block" htmlFor="kb-tags">Tags</label>
                <Input
                  id="kb-tags"
                  className="h-8 text-xs"
                  value={draft.tags.join(", ")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label className="label-console mb-1 block" htmlFor="kb-body">Body</label>
              <Textarea
                id="kb-body"
                rows={16}
                className="text-xs leading-relaxed"
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{doc.body || "—"}</p>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
              <Field label="Tags">{doc.tags.join(", ") || "—"}</Field>
              <Field label="Author">{doc.author}</Field>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
