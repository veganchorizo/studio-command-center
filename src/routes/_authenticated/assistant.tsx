import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — The Studio OS" },
      { name: "description", content: "Retrieval-grounded assistant over studio history." },
      { property: "og:title", content: "AI Assistant — The Studio OS" },
      { property: "og:description", content: "Retrieval-grounded assistant over studio history." },
    ],
  }),
  component: () => (
    <StubModule
      title="AI Assistant"
      code="AI / MODULE"
      summary="Retrieval-grounded assistant over studio history."
      planned={["Chat grounded in sessions, gear and manuals", "Cited answers with source records", "Agent presets: recall, tech, business", "Conversation history and pinning"]}
    />
  ),
});
