/**
 * Tiny atomic JSON file store for the self-hosted Studio OS container.
 *
 * Server-only. Every write goes to a temp file and is renamed into place, so a
 * crash (or two people saving at once) can never leave a half-written file.
 * Writes to the same path are serialised through an in-process promise chain.
 */
import { mkdir, readFile, rename, writeFile, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";

let resolvedDir: string | null = null;

/**
 * Where persistent state lives. `/data` inside the Docker image (a named
 * volume); falls back to a project-local folder when that isn't writable, so
 * `bun run dev` works without root.
 */
export async function dataDir(): Promise<string> {
  if (resolvedDir) return resolvedDir;
  const preferred = process.env.STUDIO_DATA_DIR ?? "/data";
  try {
    await mkdir(preferred, { recursive: true });
    // Probe writability — a mounted-but-read-only volume passes mkdir.
    await writeFile(join(preferred, ".writable"), "ok");
    resolvedDir = preferred;
  } catch {
    const fallback = join(process.cwd(), ".studio-data");
    await mkdir(fallback, { recursive: true });
    resolvedDir = fallback;
  }
  return resolvedDir;
}

const chains = new Map<string, Promise<unknown>>();

/** Serialise all work touching one file path. */
function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = chains.get(key) ?? Promise.resolve();
  const next = previous.then(fn, fn);
  chains.set(
    key,
    next.catch(() => undefined),
  );
  return next;
}

export async function readJson<T>(file: string): Promise<T | null> {
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJson(file: string, value: unknown, keepBackup = false): Promise<void> {
  await withLock(file, async () => {
    await mkdir(dirname(file), { recursive: true });
    if (keepBackup) {
      // Rolling one-deep backup, best effort.
      await copyFile(file, `${file}.bak`).catch(() => undefined);
    }
    const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
    await rename(tmp, file);
  });
}

/** Read → transform → atomically write, with no interleaved writers. */
export async function mutateJson<T>(
  file: string,
  seed: () => T | Promise<T>,
  fn: (current: T) => T | Promise<T>,
  keepBackup = false,
): Promise<T> {
  return withLock(file, async () => {
    const current = (await readJson<T>(file)) ?? (await seed());
    const next = await fn(current);
    await mkdir(dirname(file), { recursive: true });
    if (keepBackup) await copyFile(file, `${file}.bak`).catch(() => undefined);
    const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
    await rename(tmp, file);
    return next;
  });
}
