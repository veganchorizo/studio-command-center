import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — The Studio OS" },
      { name: "description", content: "Studio configuration, rooms, roles and preferences." },
      { property: "og:title", content: "Settings — The Studio OS" },
      { property: "og:description", content: "Studio configuration, rooms, roles and preferences." },
    ],
  }),
  component: () => (
    <StubModule
      title="Settings"
      code="SYS / MODULE"
      summary="Studio configuration, rooms, roles and preferences."
      planned={["Room and rate configuration", "User roster and role assignment", "Keyboard shortcut map", "Backup and export of the local database"]}
    />
  ),
});
