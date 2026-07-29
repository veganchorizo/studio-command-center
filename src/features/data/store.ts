import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Conversation,
  Equipment,
  Invoice,
  MaintenanceReminder,
  Note,
  Session,
  Task,
} from "./types";
import type {
  Artist,
  AssistantThread,
  AudioArchive,
  VideoArchive,
  Campaign,
  Client,
  Expense,
  InventoryItem,
  KnowledgeDoc,
  MaintenanceTicket,
  PatchPoint,
  Project,
  StudioSettings,
  TrainingModule,
} from "./entities";
import {
  seedConversations,
  seedEquipment,
  seedInvoices,
  seedNotes,
  seedReminders,
  seedSessions,
  seedTasks,
} from "./seed";
import {
  DEFAULT_SETTINGS,
  seedArtists,
  seedAudioArchives,
  seedVideoArchives,
  seedCampaigns,
  seedClients,
  seedExpenses,
  seedInventory,
  seedKnowledge,
  seedMaintenanceTickets,
  seedPatchPoints,
  seedProjects,
  seedThreads,
  seedTraining,
} from "./seed-entities";

/**
 * The local studio database.
 *
 * This is the ONLY module that knows the data is local and persisted. Feature
 * modules talk to it through the async source functions in each feature's
 * `data.ts`, so swapping in a self-hosted API later is a per-feature change.
 */

export type StudioData = {
  sessions: Session[];
  equipment: Equipment[];
  tasks: Task[];
  notes: Note[];
  invoices: Invoice[];
  conversations: Conversation[];
  reminders: MaintenanceReminder[];
  artists: Artist[];
  projects: Project[];
  clients: Client[];
  tickets: MaintenanceTicket[];
  inventory: InventoryItem[];
  patchPoints: PatchPoint[];
  expenses: Expense[];
  campaigns: Campaign[];
  knowledge: KnowledgeDoc[];
  training: TrainingModule[];
  threads: AssistantThread[];
  audioArchives: AudioArchive[];
  videoArchives: VideoArchive[];
  settings: StudioSettings;
};

/** Every keyed list in the database — the generic collection layer works over these. */
export type CollectionName = {
  [K in keyof StudioData]: StudioData[K] extends Array<{ id: string }> ? K : never;
}[keyof StudioData];

export type Row = { id: string } & Record<string, unknown>;

export function buildSeed(): StudioData {
  const equipment = seedEquipment();
  return {
    sessions: seedSessions(),
    equipment,
    tasks: seedTasks(),
    notes: seedNotes(),
    invoices: seedInvoices(),
    conversations: seedConversations(),
    reminders: seedReminders(equipment),
    artists: seedArtists(),
    projects: seedProjects(),
    clients: seedClients(),
    tickets: seedMaintenanceTickets(equipment),
    inventory: seedInventory(),
    patchPoints: seedPatchPoints(),
    expenses: seedExpenses(),
    campaigns: seedCampaigns(),
    knowledge: seedKnowledge(),
    training: seedTraining(),
    threads: seedThreads(),
    audioArchives: seedAudioArchives(),
    videoArchives: seedVideoArchives(),
    settings: { ...DEFAULT_SETTINGS },
  };
}

type StudioDb = StudioData & {
  hydrated: boolean;
  upsertSession: (s: Session) => void;
  removeSession: (id: string) => void;
  upsertEquipment: (e: Equipment) => void;
  removeEquipment: (id: string) => void;
  toggleTask: (id: string) => void;
  /** Generic collection mutations used by every milestone-2 module. */
  upsert: <K extends CollectionName>(collection: K, row: StudioData[K][number]) => void;
  remove: (collection: CollectionName, id: string) => void;
  patchSettings: (patch: Partial<StudioSettings>) => void;
  resetToSeed: () => void;
  importData: (data: Partial<StudioData>) => void;
};

const STORAGE_KEY = "studio-os/db/v2";

export const useStudioDb = create<StudioDb>()(
  persist(
    (set) => ({
      ...buildSeed(),
      hydrated: false,
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
      upsert: (collection, row) =>
        set((st) => {
          const list = st[collection] as Array<{ id: string }>;
          const next = list.some((x) => x.id === row.id)
            ? list.map((x) => (x.id === row.id ? row : x))
            : [row, ...list];
          return { [collection]: next } as unknown as Partial<StudioDb>;
        }),
      remove: (collection, id) =>
        set((st) => {
          const list = st[collection] as Array<{ id: string }>;
          return { [collection]: list.filter((x) => x.id !== id) } as unknown as Partial<StudioDb>;
        }),
      patchSettings: (patch) => set((st) => ({ settings: { ...st.settings, ...patch } })),
      resetToSeed: () => set({ ...buildSeed() }),
      importData: (data) => set({ ...data } as Partial<StudioDb>),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const { hydrated: _h, upsert: _u, remove: _r, ...rest } = s as unknown as Record<string, unknown>;
        const data: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rest)) {
          if (Array.isArray(v) || (k === "settings" && v && typeof v === "object")) data[k] = v;
        }
        return data as unknown as StudioDb;
      },
      merge: (persisted, current) => {
        const seedState = current;
        const stored = (persisted ?? {}) as Partial<StudioData>;
        const merged: Record<string, unknown> = { ...seedState };
        for (const key of Object.keys(seedState) as Array<keyof StudioDb>) {
          const value = stored[key as keyof StudioData];
          if (Array.isArray(value)) merged[key as string] = value;
        }
        if (stored.settings) merged.settings = { ...DEFAULT_SETTINGS, ...stored.settings };
        return merged as StudioDb;
      },
      onRehydrateStorage: () => () => {
        useStudioDb.setState({ hydrated: true });
      },
    },
  ),
);

if (typeof window !== "undefined") {
  useStudioDb.setState({ hydrated: true });
}

export const db = () => useStudioDb.getState();

export function exportData(): StudioData {
  const s = db();
  const seedKeys = Object.keys(buildSeed()) as Array<keyof StudioData>;
  const out: Record<string, unknown> = {};
  for (const key of seedKeys) out[key] = s[key];
  return out as StudioData;
}

/** Simulated latency so loading states are real. */
export const tick = <T,>(value: T, ms = 60): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
