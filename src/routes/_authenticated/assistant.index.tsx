import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStudioDb } from "@/features/data/store";
import { newThread } from "@/features/assistant/threads";

export const Route = createFileRoute("/_authenticated/assistant/")({
  head: () => ({
    meta: [
      { title: "AI Assistant — The Studio OS" },
      {
        name: "description",
        content: "Local assistant grounded in your studio's sessions, gear and documentation.",
      },
      { property: "og:title", content: "AI Assistant — The Studio OS" },
      {
        property: "og:description",
        content: "Local assistant grounded in your studio's sessions, gear and documentation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantIndex,
});

function AssistantIndex() {
  const navigate = useNavigate();
  const threads = useStudioDb((s) => s.threads);
  const hydrated = useStudioDb((s) => s.hydrated);
  const upsert = useStudioDb((s) => s.upsert);
  const model = useStudioDb((s) => s.settings.ollamaModel);

  useEffect(() => {
    if (!hydrated) return;
    const latest = [...threads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (latest) {
      navigate({ to: "/assistant/$threadId", params: { threadId: latest.id }, replace: true });
      return;
    }
    const created = newThread(model);
    upsert("threads", created);
    navigate({ to: "/assistant/$threadId", params: { threadId: created.id }, replace: true });
  }, [hydrated, threads, model, upsert, navigate]);

  return <p className="p-4 text-xs text-muted-foreground">Opening assistant…</p>;
}
