import { db, tick, useStudioDb } from "../data/store";
import type { Session } from "../data/types";

/** Data source for the Sessions module. Swap this file for HTTP calls later. */

export type SessionFilters = {
  q?: string;
  room?: string;
  status?: string;
  engineer?: string;
  from?: string;
  to?: string;
};

export async function listSessions(filters: SessionFilters = {}): Promise<Session[]> {
  const q = filters.q?.trim().toLowerCase();
  const rows = db().sessions.filter((s) => {
    if (filters.room && filters.room !== "all" && s.room !== filters.room) return false;
    if (filters.status && filters.status !== "all" && s.status !== filters.status) return false;
    if (filters.engineer && filters.engineer !== "all" && s.engineer !== filters.engineer) return false;
    if (filters.from && s.date < filters.from) return false;
    if (filters.to && s.date > filters.to) return false;
    if (q) {
      const hay = [s.title, s.artist, s.engineer, s.project, s.room, s.id, ...s.songs]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  return tick(rows);
}

export async function getSession(id: string): Promise<Session | undefined> {
  return tick(db().sessions.find((s) => s.id === id));
}

export async function saveSession(session: Session): Promise<Session> {
  useStudioDb.getState().upsertSession(session);
  return tick(session, 60);
}

export async function deleteSession(id: string): Promise<void> {
  useStudioDb.getState().removeSession(id);
  return tick(undefined, 60);
}

export function newSessionId() {
  return `SES-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export const sessionKeys = {
  all: ["sessions"] as const,
  list: (f: SessionFilters) => ["sessions", "list", f] as const,
  detail: (id: string) => ["sessions", "detail", id] as const,
};
