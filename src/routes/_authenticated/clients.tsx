import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/clients")({
  head: () => ({
    meta: [
      { title: "Clients — The Studio OS" },
      { name: "description", content: "CRM for labels, managers and returning clients." },
      { property: "og:title", content: "Clients — The Studio OS" },
      { property: "og:description", content: "CRM for labels, managers and returning clients." },
    ],
  }),
  component: () => (
    <StubModule
      title="Clients"
      code="CLI / MODULE"
      summary="CRM for labels, managers and returning clients."
      planned={["Client records with billing contacts", "Booking history and lifetime value", "Follow-up pipeline and reminders", "Rate cards per client"]}
    />
  ),
});
