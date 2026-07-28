import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Send, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageHeader, Panel } from "@/components/studio/Panel";
import { useStudioDb } from "@/features/data/store";
import { buildSystemPrompt, retrieve, type Snippet } from "@/features/assistant/retrieval";
import { connectionHint, streamChat, type OllamaMessage } from "@/features/assistant/ollama";
import { message as makeMessage, newThread, titleFrom } from "@/features/assistant/threads";
import type { AssistantThread } from "@/features/data/entities";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/assistant/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversation — AI Assistant — The Studio OS" },
      {
        name: "description",
        content: "A grounded conversation with the studio's local assistant, citing session and gear records.",
      },
      { property: "og:title", content: "Conversation — AI Assistant — The Studio OS" },
      {
        property: "og:description",
        content: "A grounded conversation with the studio's local assistant, citing session and gear records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantThreadPage,
});

const SUGGESTIONS = [
  "Which mic did we use on the last vocal session?",
  "What's broken in Studio A right now?",
  "Summarise the patching notes for recent mix sessions.",
];

function AssistantThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();

  const threads = useStudioDb((s) => s.threads);
  const upsert = useStudioDb((s) => s.upsert);
  const remove = useStudioDb((s) => s.remove);
  const settings = useStudioDb((s) => s.settings);

  const thread = threads.find((t) => t.id === threadId);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingSources, setPendingSources] = useState<Snippet[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const ordered = useMemo(
    () => [...threads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [threads],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages.length, draft]);

  function createThread() {
    const created = newThread(settings.ollamaModel);
    upsert("threads", created);
    navigate({ to: "/assistant/$threadId", params: { threadId: created.id } });
  }

  function persist(next: AssistantThread) {
    upsert("threads", { ...next, updatedAt: new Date().toISOString() });
  }

  async function send(text: string) {
    if (!thread || !text.trim() || streaming) return;
    const userMsg = makeMessage("user", text.trim());
    const base: AssistantThread = {
      ...thread,
      title: thread.messages.length === 0 ? titleFrom(text) : thread.title,
      model: settings.ollamaModel,
      messages: [...thread.messages, userMsg],
    };
    persist(base);
    setInput("");
    setDraft("");
    setStreaming(true);

    const snippets = retrieve(text, settings.retrievalDepth);
    setPendingSources(snippets);

    const history: OllamaMessage[] = [
      { role: "system", content: buildSystemPrompt(snippets, settings.studioName) },
      ...base.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    const controller = new AbortController();
    abortRef.current = controller;
    let acc = "";

    try {
      await streamChat({
        baseUrl: settings.ollamaUrl,
        model: settings.ollamaModel,
        messages: history,
        signal: controller.signal,
        onToken: (chunk) => {
          acc += chunk;
          setDraft(acc);
        },
      });
      persist({
        ...base,
        messages: [...base.messages, makeMessage("assistant", acc, snippets.map((s) => s.source))],
      });
    } catch (err) {
      if (controller.signal.aborted) {
        if (acc) {
          persist({
            ...base,
            messages: [...base.messages, makeMessage("assistant", `${acc}\n\n_(stopped)_`, snippets.map((s) => s.source))],
          });
        }
      } else {
        const hint = connectionHint(settings.ollamaUrl);
        toast.error("Assistant offline", { description: hint });
        persist({
          ...base,
          messages: [
            ...base.messages,
            makeMessage(
              "assistant",
              `${hint}\n\nRetrieval still ran locally — these records matched your question:\n\n${
                snippets.length
                  ? snippets.map((s, i) => `[${i + 1}] ${s.source}`).join("\n")
                  : "No matching records."
              }\n\n(${err instanceof Error ? err.message : "network error"})`,
              snippets.map((s) => s.source),
            ),
          ],
        });
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      setDraft("");
      setPendingSources([]);
      inputRef.current?.focus();
    }
  }

  if (!thread) {
    return (
      <Panel title="Assistant" code="AI">
        <EmptyState title="Conversation not found" hint="Start a new one to continue." />
        <div className="flex justify-center">
          <Button size="sm" className="h-8" onClick={createThread}>
            <Plus className="size-3.5" /> New conversation
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Assistant"
        code="AI / LOCAL"
        subtitle={`Runs against Ollama at ${settings.ollamaUrl} · model ${settings.ollamaModel} · grounded in local records`}
        actions={
          <Button size="sm" className="h-8" onClick={createThread}>
            <Plus className="size-3.5" /> New
          </Button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
        <Panel title="Conversations" code="THREADS" bodyClassName="p-0">
          <ul className="max-h-[60vh] divide-y divide-border/60 overflow-y-auto">
            {ordered.map((t) => (
              <li key={t.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/assistant/$threadId", params: { threadId: t.id } })}
                  className={cn(
                    "min-w-0 flex-1 px-3 py-2 text-left text-xs hover:bg-muted/40",
                    t.id === threadId && "bg-muted/60 text-foreground",
                  )}
                >
                  <span className="block truncate">{t.title}</span>
                  <span className="readout text-[0.55rem] text-muted-foreground">{t.updatedAt.slice(0, 10)}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${t.title}`}
                  className="px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    remove("threads", t.id);
                    if (t.id === threadId) navigate({ to: "/assistant" });
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={thread.title} code={thread.id} bodyClassName="flex flex-col p-0">
          <div ref={scrollRef} className="max-h-[58vh] min-h-[320px] flex-1 space-y-3 overflow-y-auto p-3">
            {thread.messages.length === 0 && !draft && (
              <div className="space-y-3 py-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Ask about sessions, gear, faults or procedures. Answers are drawn from this machine only.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="border border-border px-2 py-1 text-[0.65rem] text-muted-foreground hover:border-primary hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {thread.messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] border px-3 py-2",
                    m.role === "user"
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border bg-muted/30 text-foreground",
                  )}
                >
                  <div className="label-console mb-1 text-[0.55rem] text-muted-foreground">
                    {m.role === "user" ? "You" : "Assistant"}
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed">{m.content}</p>
                  {m.sources?.length ? (
                    <ul className="mt-2 space-y-0.5 border-t border-border/60 pt-1.5">
                      {m.sources.map((s, i) => (
                        <li key={`${m.id}-${i}`} className="readout text-[0.55rem] text-muted-foreground">
                          [{i + 1}] {s}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}

            {(draft || streaming) && (
              <div className="flex justify-start">
                <div className="max-w-[85%] border border-border bg-muted/30 px-3 py-2">
                  <div className="label-console mb-1 text-[0.55rem] text-muted-foreground">
                    Assistant{" "}
                    <span className="text-primary">
                      {draft ? "writing…" : `retrieving ${pendingSources.length} records…`}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed">{draft || "▍"}</p>
                </div>
              </div>
            )}
          </div>

          <form
            className="flex items-end gap-2 border-t border-border p-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <Textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask the studio…"
              className="min-h-[46px] flex-1 resize-none text-xs"
            />
            {streaming ? (
              <Button type="button" size="sm" variant="secondary" className="h-8" onClick={() => abortRef.current?.abort()}>
                <Square className="size-3.5" /> Stop
              </Button>
            ) : (
              <Button type="submit" size="sm" className="h-8" disabled={!input.trim()}>
                <Send className="size-3.5" /> Send
              </Button>
            )}
          </form>
        </Panel>
      </div>
    </div>
  );
}
