import { createFileRoute } from "@tanstack/react-router";
import { CollectionModule } from "@/components/studio/CollectionModule";

const meta = (title: string, description: string) => ({
  meta: [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});

export const Route = createFileRoute("/_authenticated/artists")({
  head: () =>
    meta("Artists — The Studio OS", "Artist roster, contact sheets and per-artist session history."),
  component: ArtistsPage,
});

function ArtistsPage() {
  return (
    <CollectionModule
      collection="artists"
      title="Artists"
      code="ART / ROSTER"
      subtitle="Roster, contact details and the chains each artist asks for."
      idPrefix="ART"
      fields={[
        { key: "name", label: "Name", required: true },
        { key: "genre", label: "Genre", kind: "select", filter: true, options: ["Indie Rock", "Folk", "Soul", "Post-Punk", "Ambient", "Jazz", "Electronic", "Americana"] },
        { key: "label", label: "Label", kind: "select", filter: true, options: ["Foundry Records", "Independent", "Tidewater Music", "Copper Hill", "Salt & Static", "Northfield"] },
        { key: "contact", label: "Contact" },
        { key: "email", label: "Email", mono: true },
        { key: "phone", label: "Phone", mono: true, table: false },
        { key: "preferredMic", label: "Preferred mic", table: false },
        { key: "preferredChain", label: "Preferred chain", table: false, wide: true },
        { key: "notes", label: "Notes", kind: "textarea" },
      ]}
      sort={(a, b) => String(a.name).localeCompare(String(b.name))}
    />
  );
}
