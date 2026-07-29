import { create } from "zustand";
import { toast } from "sonner";
import type { Equipment, Session } from "./types";
import type { StudioSettings } from "./entities";
import { buildSeed, type CollectionName, type StudioData } from "./build-seed";
import {
  applyMutationFn,
  loadStudioFn,
  replaceStudioFn,
  studioRevFn,
} from "./studio.functions";

export { buildSeed };
export type { CollectionName, StudioData };
export type Row = { id: string } & Record<string, unknown>;

/**
 * The studio database.
 *
 * State is authoritative on the server (`/data/studio.json` in the container),
 * so every machine signed into the same Studio OS sees the same records. This
 * store keeps a local mirror for instant UI, pushes each change to the server,
 * and reconciles on failure.
 */

type StudioDb = StudioData & {
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  /** True while the server document is still the untouched seed. */
  pristine: boolean;
  rev: number;
  hydrate: (force?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  upsertSession: (s: Session) => void;
  removeSession: (id: string) => void;
  upsertEquipment: (e: Equipment) => void;
  removeEquipment: (id: string) => void;
  toggleTask: (id: string) => void;
  /** Generic collection mutations used by every module. */
  upsert: <K extends CollectionName>(collection: K, row: StudioData[K][number]) => void;
  remove: (collection: CollectionName, id: string) => void;
  patchSettings: (patch: Partial<StudioSettings>) => void;
  resetToSeed: () => Promise<void>;
  importData: (data: Partial<StudioData>) => Promise<void>;
};

// Writes are serialised so rapid edits land on the server in order.
let queue: Promise<unknown> = Promise.resolve();

function enqueue(work: () => Promise<number>) {
  queue = queue
    .then(work)
    .then((rev) => {
      useStudioDb.setState({ rev, pristine: false });
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "The studio server rejected that change.";
      toast.error("Change not saved", { description: message });
      // Pull the authoritative state back so the UI stops lying.
      void useStudioDb.getState().hydrate(true);
    });
  return queue;
}

export const useStudioDb = create<StudioDb>()((set, get) => ({
  ...buildSeed(),
  hydrated: false,
  loading: false,
  error: null,
  pristine: false,
  rev: 0,

  hydrate: async (force = false) => {
    if (get().loading) return;
    if (get().hydrated && !force) return;
    set({ loading: true });
    try {
      const snapshot = await loadStudioFn();
      set({
        ...snapshot.data,
        rev: snapshot.rev,
        pristine: snapshot.pristine,
        hydrated: true,
        loading: false,
        error: null,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Could not reach the studio server.",
      });
    }
  },

  refresh: async () => {
    try {
      const rev = await studioRevFn();
      if (rev !== get().rev) await get().hydrate(true);
    } catch {
      // Offline blip — the next tick tries again.
    }
  },

  upsertSession: (s) => get().upsert("sessions", s),
  removeSession: (id) => get().remove("sessions", id),
  upsertEquipment: (e) => get().upsert("equipment", e),
  removeEquipment: (id) => get().remove("equipment", id),

  toggleTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    get().upsert("tasks", { ...task, done: !task.done });
  },

  upsert: (collection, row) => {
    set((st) => {
      const list = st[collection] as Array<{ id: string }>;
      const next = list.some((x) => x.id === row.id)
        ? list.map((x) => (x.id === row.id ? row : x))
        : [row, ...list];
      return { [collection]: next } as unknown as Partial<StudioDb>;
    });
    void enqueue(() =>
      applyMutationFn({ data: { kind: "upsert", collection, row: row as Row } }),
    );
  },

  remove: (collection, id) => {
    set((st) => {
      const list = st[collection] as Array<{ id: string }>;
      return { [collection]: list.filter((x) => x.id !== id) } as unknown as Partial<StudioDb>;
    });
    void enqueue(() => applyMutationFn({ data: { kind: "remove", collection, id } }));
  },

  patchSettings: (patch) => {
    set((st) => ({ settings: { ...st.settings, ...patch } }));
    void enqueue(() =>
      applyMutationFn({ data: { kind: "patchSettings", patch: patch as Record<string, unknown> } }),
    );
  },

  resetToSeed: async () => {
    const seed = buildSeed();
    set({ ...seed });
    const rev = await replaceStudioFn({ data: { data: seed } });
    set({ rev, pristine: false });
  },

  importData: async (data) => {
    const merged = { ...buildSeed(), ...get(), ...data } as StudioData;
    const clean = pickData(merged);
    set({ ...clean });
    const rev = await replaceStudioFn({ data: { data: clean } });
    set({ rev, pristine: false });
  },
}));

/** Strip store methods/flags, leaving only the persisted document. */
function pickData(source: Record<string, unknown>): StudioData {
  const keys = Object.keys(buildSeed()) as Array<keyof StudioData>;
  const out: Record<string, unknown> = {};
  for (const key of keys) out[key] = source[key as string];
  return out as StudioData;
}

export const db = () => useStudioDb.getState();

export function exportData(): StudioData {
  return pickData(db() as unknown as Record<string, unknown>);
}

/** Simulated latency so loading states are real. */
export const tick = <T,>(value: T, ms = 60): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
