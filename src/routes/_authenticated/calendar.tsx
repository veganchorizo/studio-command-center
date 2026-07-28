import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — The Studio OS" },
      { name: "description", content: "Room-by-room booking grid." },
      { property: "og:title", content: "Calendar — The Studio OS" },
      { property: "og:description", content: "Room-by-room booking grid." },
    ],
  }),
  component: () => (
    <StubModule
      title="Calendar"
      code="CAL / MODULE"
      summary="Room-by-room booking grid."
      planned={["Week and month room grid", "Drag-to-book with conflict detection", "Engineer availability overlay", "Hold vs. confirmed booking states"]}
    />
  ),
});
