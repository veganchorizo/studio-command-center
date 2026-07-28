import { createFileRoute } from "@tanstack/react-router";
import { CollectionModule } from "@/components/studio/CollectionModule";
import { ENGINEERS } from "@/features/data/seed";

const TITLE = "Intern Training — The Studio OS";
const DESC = "Curriculum tracks, lesson checklists and per-trainee sign-off.";

export const Route = createFileRoute("/_authenticated/training")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrainingPage,
});

function TrainingPage() {
  return (
    <CollectionModule
      collection="training"
      title="Training modules"
      code="TRN / CURRICULUM"
      subtitle="What each trainee has covered, and who signed it off."
      idPrefix="TRN"
      writeRole="engineer"
      tone={(row) =>
        row.completed
          ? row.signedOffBy
            ? { tone: "ok", label: "signed off" }
            : { tone: "live", label: "awaiting sign-off" }
          : { tone: "idle", label: "in progress" }
      }
      fields={[
        { key: "title", label: "Module", required: true },
        { key: "track", label: "Track", kind: "select", filter: true, options: ["Setup", "Tracking", "Mixing", "Maintenance", "Studio Etiquette"] },
        { key: "level", label: "Level", kind: "select", filter: true, options: ["1", "2", "3"] },
        { key: "trainee", label: "Trainee", kind: "select", filter: true, options: ["C. Ellis", "M. Adeyemi", "P. Nowak"] },
        { key: "completed", label: "Completed", kind: "boolean" },
        { key: "signedOffBy", label: "Signed off by", kind: "select", options: ["", ...ENGINEERS] },
        { key: "lessons", label: "Lessons", kind: "tags", table: false },
        { key: "notes", label: "Notes", kind: "textarea" },
      ]}
      sort={(a, b) => String(a.track).localeCompare(String(b.track))}
    />
  );
}
