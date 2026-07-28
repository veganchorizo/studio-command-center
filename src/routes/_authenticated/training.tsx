import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/training")({
  head: () => ({
    meta: [
      { title: "Intern Training — The Studio OS" },
      { name: "description", content: "Structured curriculum and sign-off for assistants." },
      { property: "og:title", content: "Intern Training — The Studio OS" },
      { property: "og:description", content: "Structured curriculum and sign-off for assistants." },
    ],
  }),
  component: () => (
    <StubModule
      title="Intern Training"
      code="TRN / MODULE"
      summary="Structured curriculum and sign-off for assistants."
      planned={["Curriculum modules with progress", "Practical sign-off checklists", "Quiz bank on house procedure", "Mentor review and notes"]}
    />
  ),
});
