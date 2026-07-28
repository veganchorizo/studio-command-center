import type { EquipmentStatus } from "@/features/data/types";

export const EQUIPMENT_TONE: Record<EquipmentStatus, "ok" | "live" | "fault" | "idle"> = {
  operational: "ok",
  "needs-service": "live",
  "in-repair": "fault",
  retired: "idle",
};
