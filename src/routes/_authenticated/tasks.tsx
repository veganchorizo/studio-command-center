import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — The Studio OS" },
      { name: "description", content: "Studio-wide task board across rooms and roles." },
      { property: "og:title", content: "Tasks — The Studio OS" },
      { property: "og:description", content: "Studio-wide task board across rooms and roles." },
    ],
  }),
  component: () => (
    <StubModule
      title="Tasks"
      code="TSK / MODULE"
      summary="Studio-wide task board across rooms and roles."
      planned={["Kanban board by status", "Assignment by role and room", "Due dates and priority flags", "Recurring opening and closing checklists"]}
    />
  ),
});
