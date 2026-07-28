import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/patchbay")({
  head: () => ({
    meta: [
      { title: "Patchbay — The Studio OS" },
      { name: "description", content: "Normalled routing maps for every bay in the building." },
      { property: "og:title", content: "Patchbay — The Studio OS" },
      { property: "og:description", content: "Normalled routing maps for every bay in the building." },
    ],
  }),
  component: () => (
    <StubModule
      title="Patchbay"
      code="PTC / MODULE"
      summary="Normalled routing maps for every bay in the building."
      planned={["Point-by-point bay maps per room", "Normalled and half-normalled indicators", "Saved patch presets per session type", "Printable recall sheets"]}
    />
  ),
});
