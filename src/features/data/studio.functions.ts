import { createServerFn } from "@tanstack/react-start";
import {
  COLLECTION_WRITE_ROLE,
  SETTINGS_WRITE_ROLE,
  type CollectionName,
  type StudioData,
} from "./build-seed";

export type StudioSnapshot = { rev: number; pristine: boolean; data: StudioData };

export const loadStudioFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<StudioSnapshot> => {
    const { requireUser } = await import("@/features/auth/session.server");
    await requireUser();
    const { loadStudioFile } = await import("./studio.server");
    const file = await loadStudioFile();
    return { rev: file.rev, pristine: file.pristine, data: file.data };
  },
);

/** Cheap poll so other machines notice a change without refetching everything. */
export const studioRevFn = createServerFn({ method: "GET" }).handler(async (): Promise<number> => {
  const { requireUser } = await import("@/features/auth/session.server");
  await requireUser();
  const { studioRev } = await import("./studio.server");
  return studioRev();
});

type MutationInput =
  | { kind: "upsert"; collection: CollectionName; row: { id: string } & Record<string, unknown> }
  | { kind: "remove"; collection: CollectionName; id: string }
  | { kind: "patchSettings"; patch: Record<string, unknown> };

export const applyMutationFn = createServerFn({ method: "POST" })
  .inputValidator((input: MutationInput) => {
    if (!input || typeof input !== "object") throw new Error("Bad mutation.");
    if (input.kind === "patchSettings") {
      if (!input.patch || typeof input.patch !== "object") throw new Error("Bad settings patch.");
      return input;
    }
    if (!(input.collection in COLLECTION_WRITE_ROLE)) throw new Error("Unknown collection.");
    if (input.kind === "upsert") {
      if (!input.row || typeof input.row.id !== "string") throw new Error("Row needs an id.");
      return input;
    }
    if (input.kind === "remove") {
      if (typeof input.id !== "string") throw new Error("Missing id.");
      return input;
    }
    throw new Error("Unknown mutation.");
  })
  .handler(async ({ data }): Promise<number> => {
    const { requireRole } = await import("@/features/auth/session.server");
    const role =
      data.kind === "patchSettings"
        ? SETTINGS_WRITE_ROLE
        : COLLECTION_WRITE_ROLE[data.collection];
    await requireRole(role);
    const { applyStudioMutation } = await import("./studio.server");
    return applyStudioMutation(data);
  });

/** Wholesale replace — Import JSON, Reset to seed, and the one-time local import. */
export const replaceStudioFn = createServerFn({ method: "POST" })
  .inputValidator((input: { data: StudioData }) => {
    if (!input?.data || typeof input.data !== "object") throw new Error("Nothing to import.");
    return input;
  })
  .handler(async ({ data }): Promise<number> => {
    const { requireRole } = await import("@/features/auth/session.server");
    await requireRole("owner");
    const { replaceStudio } = await import("./studio.server");
    return replaceStudio(data.data);
  });
