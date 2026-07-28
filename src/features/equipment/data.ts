import { db, tick, useStudioDb } from "../data/store";
import type { Equipment } from "../data/types";

/** Data source for the Equipment module. Swap this file for HTTP calls later. */

export type EquipmentFilters = {
  q?: string;
  category?: string;
  location?: string;
  status?: string;
};

export async function listEquipment(filters: EquipmentFilters = {}): Promise<Equipment[]> {
  const q = filters.q?.trim().toLowerCase();
  const rows = db().equipment.filter((e) => {
    if (filters.category && filters.category !== "all" && e.category !== filters.category) return false;
    if (filters.location && filters.location !== "all" && e.location !== filters.location) return false;
    if (filters.status && filters.status !== "all" && e.status !== filters.status) return false;
    if (q) {
      const hay = [e.manufacturer, e.model, e.serial, e.rack, e.location, e.id, ...e.favoriteUses]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  return tick(rows);
}

export async function getEquipment(id: string): Promise<Equipment | undefined> {
  return tick(db().equipment.find((e) => e.id === id));
}

export async function saveEquipment(item: Equipment): Promise<Equipment> {
  useStudioDb.getState().upsertEquipment(item);
  return tick(item, 60);
}

export async function deleteEquipment(id: string): Promise<void> {
  useStudioDb.getState().removeEquipment(id);
  return tick(undefined, 60);
}

/** Sessions that used this piece of gear, matched by manufacturer + model. */
export async function relatedSessions(item: Equipment) {
  const needle = `${item.manufacturer} ${item.model}`.toLowerCase();
  return tick(
    db()
      .sessions.filter((s) =>
        [...s.microphones, ...s.outboard].some(
          (g) => needle.includes(g.toLowerCase().split(" (")[0]) || g.toLowerCase().includes(item.model.toLowerCase()),
        ),
      )
      .slice(0, 8),
  );
}

export function newEquipmentId() {
  return `EQ-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export const equipmentKeys = {
  all: ["equipment"] as const,
  list: (f: EquipmentFilters) => ["equipment", "list", f] as const,
  detail: (id: string) => ["equipment", "detail", id] as const,
};
