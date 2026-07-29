import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { atLeast, useAuth } from "@/features/auth/store";
import { buildSeed, useStudioDb, type StudioData } from "@/features/data/store";

/** Keys used by the pre-server browser-local database. */
const LEGACY_KEYS = ["studio-os/db/v2", "studio-os/db/v1"];
const DISMISS_KEY = "studio-os/local-import-dismissed";

function readLegacy(): Partial<StudioData> | null {
  for (const key of LEGACY_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { state?: Partial<StudioData> };
      const state = parsed?.state ?? (parsed as Partial<StudioData>);
      if (state && typeof state === "object" && Array.isArray(state.sessions)) return state;
    } catch {
      // Corrupt entry — ignore and try the next key.
    }
  }
  return null;
}

/**
 * One-time offer to push a browser-local database (from before records moved
 * server-side) up to the shared studio server.
 */
export function LocalImportBanner() {
  const user = useAuth((s) => s.user);
  const pristine = useStudioDb((s) => s.pristine);
  const hydrated = useStudioDb((s) => s.hydrated);
  const importData = useStudioDb((s) => s.importData);
  const [legacy, setLegacy] = useState<Partial<StudioData> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated || !pristine || !atLeast(user, "owner")) return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;
    setLegacy(readLegacy());
  }, [hydrated, pristine, user]);

  if (!legacy) return null;

  const count = Object.values(legacy).reduce(
    (n, v) => n + (Array.isArray(v) ? v.length : 0),
    0,
  );

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setLegacy(null);
  }

  async function push() {
    setBusy(true);
    try {
      await importData({ ...buildSeed(), ...legacy });
      window.localStorage.setItem(DISMISS_KEY, "1");
      setLegacy(null);
      toast.success("Local records uploaded to the studio server");
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-primary/40 bg-primary/10 px-4 py-2 text-[0.7rem]">
      <span className="text-foreground">
        Found {count} record{count === 1 ? "" : "s"} saved in this browser from before the studio
        server. Upload them so every machine sees them?
      </span>
      <div className="ml-auto flex gap-2">
        <Button size="sm" variant="ghost" className="h-7" onClick={dismiss}>
          Not now
        </Button>
        <Button size="sm" className="h-7" disabled={busy} onClick={() => void push()}>
          {busy ? "Uploading…" : "Upload to server"}
        </Button>
      </div>
    </div>
  );
}
