import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/artists")({
  head: () => ({
    meta: [
      { title: "Artists — The Studio OS" },
      { name: "description", content: "Artist roster, contact sheets and per-artist session history." },
      { property: "og:title", content: "Artists — The Studio OS" },
      { property: "og:description", content: "Artist roster, contact sheets and per-artist session history." },
    ],
  }),
  component: () => (
    <StubModule
      title="Artists"
      code="ART / MODULE"
      summary="Artist roster, contact sheets and per-artist session history."
      planned={["Roster with contact and label details", "Session history and credits per artist", "Preferred mics, chains and monitoring notes", "Linked projects and deliverables"]}
    />
  ),
});
