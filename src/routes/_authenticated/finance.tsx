import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "Finance — The Studio OS" },
      { name: "description", content: "Invoicing, rates and studio profitability." },
      { property: "og:title", content: "Finance — The Studio OS" },
      { property: "og:description", content: "Invoicing, rates and studio profitability." },
    ],
  }),
  component: () => (
    <StubModule
      title="Finance"
      code="FIN / MODULE"
      summary="Invoicing, rates and studio profitability."
      planned={["Invoice register with aging", "Room and engineer rate cards", "Revenue by room, client and month", "Expense and gear depreciation tracking"]}
    />
  ),
});
