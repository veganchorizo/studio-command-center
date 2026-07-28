import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — The Studio OS" },
      { name: "description", content: "Consumables, cables, tape stock and spare parts." },
      { property: "og:title", content: "Inventory — The Studio OS" },
      { property: "og:description", content: "Consumables, cables, tape stock and spare parts." },
    ],
  }),
  component: () => (
    <StubModule
      title="Inventory"
      code="INV / MODULE"
      summary="Consumables, cables, tape stock and spare parts."
      planned={["Stock levels with reorder thresholds", "Cable and adapter counts by type", "Tape and media stock tracking", "Checkout log for loaned gear"]}
    />
  ),
});
