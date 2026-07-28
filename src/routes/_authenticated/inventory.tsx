import { createFileRoute } from "@tanstack/react-router";
import { CollectionModule } from "@/components/studio/CollectionModule";

const TITLE = "Inventory — The Studio OS";
const DESC = "Consumables, cables, media and spares with low-stock thresholds.";

export const Route = createFileRoute("/_authenticated/inventory")({
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
  component: InventoryPage,
});

function InventoryPage() {
  return (
    <CollectionModule
      collection="inventory"
      title="Inventory"
      code="INV / STOCK"
      subtitle="Everything consumable. Anything at or below its minimum flags red."
      idPrefix="INV"
      tone={(row) =>
        Number(row.quantity) <= Number(row.minimum)
          ? { tone: "fault", label: "low" }
          : Number(row.quantity) <= Number(row.minimum) * 1.5
            ? { tone: "live", label: "watch" }
            : { tone: "ok", label: "stocked" }
      }
      fields={[
        { key: "name", label: "Item", required: true },
        { key: "category", label: "Category", kind: "select", filter: true, options: ["Cables", "Media", "Consumables", "Spares", "Hardware", "Accessories"] },
        { key: "quantity", label: "Qty", kind: "number" },
        { key: "minimum", label: "Min", kind: "number" },
        { key: "location", label: "Location", kind: "select", filter: true, options: ["Store room", "Studio A rack", "Machine room", "Loft"] },
        { key: "supplier", label: "Supplier", table: false },
        { key: "unitCost", label: "Unit cost", kind: "number", format: (v) => `£${Number(v ?? 0).toLocaleString()}` },
        { key: "notes", label: "Notes", kind: "textarea" },
      ]}
      sort={(a, b) =>
        Number(a.quantity) - Number(a.minimum) - (Number(b.quantity) - Number(b.minimum))
      }
    />
  );
}
