import { create } from "zustand";
import type {
  Conversation,
  Equipment,
  Invoice,
  MaintenanceReminder,
  Note,
  Session,
  Task,
} from "./types";
import {
  seedConversations,
  seedEquipment,
  seedInvoices,
  seedNotes,
  seedReminders,
  seedSessions,
  seedTasks,
} from "./seed";

/**
 * In-memory studio database.
 *
 * This is the ONLY module that knows the data is local. Feature modules talk
 * to it through the async source functions in each feature's `data.ts`, so
 * swapping in a self-hosted API later is a per-feature change.
 */
type StudioDb = {
  sessions: Session[];
  equipment: Equipment[];
  tasks: Task[];
  notes: Note[];
  invoices: Invoice[];
  conversations: Conversation[];
  reminders: MaintenanceReminder[];
  upsertSession: (s: Session) => void;
  removeSession: (id: string) => void;
  upsertEquipment: (e: Equipment) => void;
  removeEquipment: (id: string) => void;
  toggleTask: (id: string) => void;
};

const equipment = seedEquipment();

export const useStudioDb = create<StudioDb>((set) => ({
  sessions: seedSessions(),
  equipment,
  tasks: seedTasks(),
  notes: seedNotes(),
  invoices: seedInvoices(),
  conversations: seedConversations(),
  reminders: seedReminders(equipment),
  upsertSession: (s) =>
    set((st) => ({
      sessions: st.sessions.some((x) => x.id === s.id)
        ? st.sessions.map((x) => (x.id === s.id ? s : x))
        : [s, ...st.sessions],
    })),
  removeSession: (id) => set((st) => ({ sessions: st.sessions.filter((x) => x.id !== id) })),
  upsertEquipment: (e) =>
    set((st) => ({
      equipment: st.equipment.some((x) => x.id === e.id)
        ? st.equipment.map((x) => (x.id === e.id ? e : x))
        : [e, ...st.equipment],
    })),
  removeEquipment: (id) => set((st) => ({ equipment: st.equipment.filter((x) => x.id !== id) })),
  toggleTask: (id) =>
    set((st) => ({ tasks: st.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
}));

export const db = () => useStudioDb.getState();

/** Simulated latency so loading states are real. */
export const tick = <T,>(value: T, ms = 90): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
