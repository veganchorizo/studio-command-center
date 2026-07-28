import type { SessionStatus } from "@/features/data/types";

export const STATUS_TONE: Record<SessionStatus, "live" | "info" | "ok" | "idle"> = {
  tracking: "live",
  scheduled: "info",
  mixing: "info",
  delivered: "ok",
};
