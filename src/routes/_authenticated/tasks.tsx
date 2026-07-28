import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader, Panel, StatusPin } from "@/components/studio/Panel";
import { ENGINEERS } from "@/features/data/seed";
import { useStudioDb } from "@/features/data/store";
import type { Task } from "@/features/data/types";
import { cn } from "@/lib/utils";

const TITLE = "Tasks — The Studio OS";
const DESC = "Studio task board with priorities, owners and due dates.";

export const Route = createFileRoute("/_authenticated/tasks")({
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
  component: TasksPage,
});

const PRIORITIES = ["high", "normal", "low"] as const;
const PRIORITY_TONE: Record<string, "live" | "ok" | "fault" | "idle" | "info"> = {
  high: "fault",
  normal: "live",
  low: "idle",
};

function TasksPage() {
  const tasks = useStudioDb((s) => s.tasks);
  const upsert = useStudioDb((s) => s.upsert);
  const remove = useStudioDb((s) => s.remove);
  const toggleTask = useStudioDb((s) => s.toggleTask);

  const [q, setQ] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [show, setShow] = useState<"open" | "done" | "all">("open");
  const [draft, setDraft] = useState("");
  const [draftAssignee, setDraftAssignee] = useState(ENGINEERS[0]);
  const [draftPriority, setDraftPriority] = useState<Task["priority"]>("normal");
  const [draftDue, setDraftDue] = useState(new Date().toISOString().slice(0, 10));

  const today = new Date().toISOString().slice(0, 10);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (show === "open" && t.done) return false;
      if (show === "done" && !t.done) return false;
      if (assignee !== "all" && t.assignee !== assignee) return false;
      if (needle && !`${t.title} ${t.assignee} ${t.id}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [tasks, q, assignee, show]);

  function addTask() {
    const title = draft.trim();
    if (!title) {
      toast.error("Give the task a title");
      return;
    }
    upsert("tasks", {
      id: `TSK-${Math.floor(Math.random() * 9000 + 1000)}`,
      title,
      priority: draftPriority,
      due: draftDue,
      assignee: draftAssignee,
      done: false,
    });
    setDraft("");
    toast.success("Task added");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tasks"
        code="TSK / BOARD"
        subtitle="Everything the studio owes itself, grouped by priority."
      />

      <Panel title="New task" code="TSK">
        <div className="flex flex-wrap gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="What needs doing?"
            className="h-8 min-w-[220px] flex-1 text-xs"
          />
          <Select value={draftAssignee} onValueChange={setDraftAssignee}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENGINEERS.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={draftPriority} onValueChange={(v) => setDraftPriority(v as Task["priority"])}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={draftDue}
            onChange={(e) => setDraftDue(e.target.value)}
            className="h-8 w-[150px] text-xs"
          />
          <Button size="sm" className="h-8" onClick={addTask}>
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks…"
          className="h-8 min-w-[180px] flex-1 text-xs"
        />
        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            {ENGINEERS.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={show} onValueChange={(v) => setShow(v as typeof show)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {PRIORITIES.map((priority) => {
          const column = visible.filter((t) => t.priority === priority);
          return (
            <Panel
              key={priority}
              title={`${priority} priority`}
              code={`${column.length}`}
              bodyClassName="p-0"
            >
              {column.length === 0 ? (
                <EmptyState title="Nothing here" />
              ) : (
                <ul className="divide-y divide-border/60">
                  {column.map((t) => (
                    <li key={t.id} className="flex items-start gap-2 px-3 py-2">
                      <Checkbox
                        checked={t.done}
                        onCheckedChange={() => toggleTask(t.id)}
                        aria-label="Toggle task"
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs text-foreground", t.done && "line-through opacity-50")}>
                          {t.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <StatusPin
                            tone={t.done ? "ok" : t.due < today ? "fault" : PRIORITY_TONE[t.priority]}
                            label={t.done ? "done" : t.due < today ? `overdue ${t.due}` : t.due}
                          />
                          <span className="readout text-[0.6rem] text-muted-foreground">{t.assignee}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          remove("tasks", t.id);
                          toast.success("Task removed");
                        }}
                        className="text-[0.65rem] text-muted-foreground hover:text-destructive"
                      >
                        del
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
