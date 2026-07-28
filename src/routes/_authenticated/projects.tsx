import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — The Studio OS" },
      { name: "description", content: "Albums, EPs and singles tracked from tracking through delivery." },
      { property: "og:title", content: "Projects — The Studio OS" },
      { property: "og:description", content: "Albums, EPs and singles tracked from tracking through delivery." },
    ],
  }),
  component: () => (
    <StubModule
      title="Projects"
      code="PRJ / MODULE"
      summary="Albums, EPs and singles tracked from tracking through delivery."
      planned={["Project timeline across sessions", "Song status board: tracked, mixed, mastered", "Budget vs. booked hours", "Delivery checklist and asset manifest"]}
    />
  ),
});
