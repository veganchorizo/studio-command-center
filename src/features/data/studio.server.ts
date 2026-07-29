/**
 * Shared studio document, stored on the container's data volume.
 *
 * Every write is atomic and serialised, and bumps `rev` so browsers on other
 * machines can notice a change with a cheap poll.
 */
import { join } from "node:path";
import { dataDir, mutateJson, readJson } from "@/lib/json-file.server";
import { buildSeed, type CollectionName, type StudioData } from "./build-seed";

type StudioFile = {
  version: 2;
  rev: number;
  updatedAt: string;
  /** True while the document is still the untouched seed — powers the one-time import offer. */
  pristine: boolean;
  data: StudioData;
};

async function studioPath() {
  return join(await dataDir(), "studio.json");
}

function seedFile(): StudioFile {
  return {
    version: 2,
    rev: 1,
    updatedAt: new Date().toISOString(),
    pristine: true,
    data: buildSeed(),
  };
}

/** Fill in any collection added by a newer app version. */
function normalise(file: StudioFile): StudioFile {
  const seed = buildSeed();
  const data = { ...seed, ...file.data } as StudioData;
  for (const key of Object.keys(seed) as Array<keyof StudioData>) {
    const value = file.data?.[key];
    if (Array.isArray(seed[key]) && !Array.isArray(value)) {
      (data as Record<string, unknown>)[key] = seed[key];
    }
  }
  data.settings = { ...seed.settings, ...(file.data?.settings ?? {}) };
  return { ...file, data };
}

export async function loadStudioFile(): Promise<StudioFile> {
  const path = await studioPath();
  const existing = await readJson<StudioFile>(path);
  if (existing?.data) return normalise(existing);
  return mutateJson<StudioFile>(path, seedFile, (current) => current);
}

export async function studioRev(): Promise<number> {
  const path = await studioPath();
  const existing = await readJson<StudioFile>(path);
  return existing?.rev ?? (await loadStudioFile()).rev;
}

function bump(file: StudioFile, data: StudioData, pristine = false): StudioFile {
  return {
    version: 2,
    rev: file.rev + 1,
    updatedAt: new Date().toISOString(),
    pristine,
    data,
  };
}

export type Mutation =
  | { kind: "upsert"; collection: CollectionName; row: { id: string } & Record<string, unknown> }
  | { kind: "remove"; collection: CollectionName; id: string }
  | { kind: "patchSettings"; patch: Record<string, unknown> };

export async function applyStudioMutation(mutation: Mutation): Promise<number> {
  const path = await studioPath();
  const next = await mutateJson<StudioFile>(
    path,
    seedFile,
    (raw) => {
      const current = normalise(raw);
      const data = { ...current.data };

      if (mutation.kind === "patchSettings") {
        data.settings = { ...data.settings, ...mutation.patch } as StudioData["settings"];
      } else if (mutation.kind === "upsert") {
        const list = (data[mutation.collection] ?? []) as Array<{ id: string }>;
        (data as Record<string, unknown>)[mutation.collection] = list.some(
          (x) => x.id === mutation.row.id,
        )
          ? list.map((x) => (x.id === mutation.row.id ? mutation.row : x))
          : [mutation.row, ...list];
      } else {
        const list = (data[mutation.collection] ?? []) as Array<{ id: string }>;
        (data as Record<string, unknown>)[mutation.collection] = list.filter(
          (x) => x.id !== mutation.id,
        );
      }

      return bump(current, data);
    },
    true,
  );
  return next.rev;
}

export async function replaceStudio(data: StudioData): Promise<number> {
  const path = await studioPath();
  const next = await mutateJson<StudioFile>(
    path,
    seedFile,
    (raw) => bump(normalise(raw), normalise({ ...raw, data }).data),
    true,
  );
  return next.rev;
}
