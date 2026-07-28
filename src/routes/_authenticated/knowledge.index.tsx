import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader, Panel } from "@/components/studio/Panel";
import { useAuth, atLeast } from "@/features/auth/store";
import { useStudioDb } from "@/features/data/store";

const TITLE = "Knowledge Base — The Studio OS";
const DESC = "Local studio documentation: signal flow, procedures, gear notes and troubleshooting.";
const FOLDERS = ["Signal Flow", "Gear Notes", "Procedures", "House Style", "Troubleshooting"] as const;

export const Route = createFileRoute("/_authenticated/knowledge/")({
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
  component: KnowledgeIndex,
});

function KnowledgeIndex() {
  const docs = useStudioDb((s) => s.knowledge);
  const upsert = useStudioDb((s) => s.upsert);
  const user = useAuth((s) => s.user);
  const canWrite = atLeast(user, "assistant");
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("all");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return docs.filter((d) => {
      if (folder !== "all" && d.folder !== folder) return false;
      if (!needle) return true;
      return `${d.title} ${d.tags.join(" ")} ${d.body}`.toLowerCase().includes(needle);
    });
  }, [docs, q, folder]);

  function createDoc() {
    const id = `KB-${Math.floor(Math.random() * 9000 + 1000)}`;
    upsert("knowledge", {
      id,
      title: "Untitled document",
      folder: "Procedures",
      tags: [],
      author: user?.name ?? "Studio",
      updated: new Date().toISOString().slice(0, 10),
      body: "",
    });
    toast.success("Document created");
    navigate({ to: "/knowledge/$docId", params: { docId: id } });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Knowledge Base"
        code="KB / LIBRARY"
        subtitle="The studio's written memory. Searched by the assistant when it answers."
        actions={
          canWrite ? (
            <Button size="sm" className="h-8" onClick={createDoc}>
              <Plus className="size-3.5" /> New document
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the library…"
            className="h-8 pl-7 text-xs"
          />
        </div>
        <Select value={folder} onValueChange={setFolder}>
          <SelectTrigger className="h-8 w-[190px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All folders</SelectItem>
            {FOLDERS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <Panel title="Library" code="KB">
          <EmptyState title="No documents match" hint="Try a different search or folder." />
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((d) => (
            <Link key={d.id} to="/knowledge/$docId" params={{ docId: d.id }} className="block">
              <Panel title={d.folder} code={d.id} className="h-full transition-colors hover:border-primary">
                <h3 className="mb-1 text-sm font-medium text-foreground">{d.title}</h3>
                <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{d.body}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {d.tags.map((t) => (
                    <span key={t} className="readout border border-border px-1 text-[0.55rem] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
