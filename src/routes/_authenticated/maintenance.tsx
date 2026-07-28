import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — The Studio OS" },
      { name: "description", content: "Service schedules, repair tickets and calibration logs." },
      { property: "og:title", content: "Maintenance — The Studio OS" },
      { property: "og:description", content: "Service schedules, repair tickets and calibration logs." },
    ],
  }),
  component: () => (
    <StubModule
      title="Maintenance"
      code="MNT / MODULE"
      summary="Service schedules, repair tickets and calibration logs."
      planned={["Recurring service schedules per unit", "Repair tickets with parts and cost", "Tube and capsule replacement history", "Calibration records for tape and converters"]}
    />
  ),
});
