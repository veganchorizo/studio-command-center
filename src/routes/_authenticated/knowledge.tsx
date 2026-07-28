import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Base — The Studio OS" },
      { name: "description", content: "Indexed manuals, chains and house documentation." },
      { property: "og:title", content: "Knowledge Base — The Studio OS" },
      { property: "og:description", content: "Indexed manuals, chains and house documentation." },
    ],
  }),
  component: () => (
    <StubModule
      title="Knowledge Base"
      code="KB / MODULE"
      summary="Indexed manuals, chains and house documentation."
      planned={["Manual and datasheet library", "House signal chain recipes", "Troubleshooting runbooks", "Chunked index for assistant retrieval"]}
    />
  ),
});
