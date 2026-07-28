import { createFileRoute } from "@tanstack/react-router";
import { StubModule } from "@/components/studio/StubModule";

export const Route = createFileRoute("/_authenticated/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing — The Studio OS" },
      { name: "description", content: "Release calendar, content pipeline and outreach." },
      { property: "og:title", content: "Marketing — The Studio OS" },
      { property: "og:description", content: "Release calendar, content pipeline and outreach." },
    ],
  }),
  component: () => (
    <StubModule
      title="Marketing"
      code="MKT / MODULE"
      summary="Release calendar, content pipeline and outreach."
      planned={["Content calendar by release", "Asset library for socials", "Outreach lists and campaign status", "Post-session content prompts"]}
    />
  ),
});
