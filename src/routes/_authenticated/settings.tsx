import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, RotateCcw, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, PageHeader, Panel } from "@/components/studio/Panel";
import { useAuth, atLeast } from "@/features/auth/store";
import { changeOwnPasswordFn } from "@/features/auth/auth.functions";
import { exportData, useStudioDb } from "@/features/data/store";
import { listModels } from "@/features/assistant/ollama";

const TITLE = "Settings — The Studio OS";
const DESC = "Studio identity, local Ollama connection, roster and data export for The Studio OS.";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useStudioDb((s) => s.settings);
  const patchSettings = useStudioDb((s) => s.patchSettings);
  const resetToSeed = useStudioDb((s) => s.resetToSeed);
  const importData = useStudioDb((s) => s.importData);
  const user = useAuth((s) => s.user);
  const canWrite = atLeast(user, "engineer");
  const isOwner = atLeast(user, "owner");
  const fileRef = useRef<HTMLInputElement>(null);
  const [probe, setProbe] = useState<string | null>(null);
  const [probing, setProbing] = useState(false);

  async function testConnection() {
    setProbing(true);
    setProbe(null);
    try {
      const models = await listModels(settings.ollamaUrl);
      setProbe(models.length ? `Connected · ${models.length} model(s): ${models.join(", ")}` : "Connected · no models pulled yet");
      toast.success("Ollama reachable");
    } catch (err) {
      setProbe(`Unreachable — ${err instanceof Error ? err.message : "network error"}`);
      toast.error("Could not reach Ollama", {
        description: 'Run OLLAMA_ORIGINS="*" ollama serve on this machine.',
      });
    } finally {
      setProbing(false);
    }
  }

  function download() {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studio-os-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }

  async function onFile(file: File) {
    try {
      importData(JSON.parse(await file.text()));
      toast.success("Data imported");
    } catch {
      toast.error("That file isn't a valid Studio OS backup");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        code="SYS / CONFIG"
        subtitle="Everything here is stored in this browser. Nothing leaves the machine."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Studio" code="IDENTITY">
          <div className="space-y-3">
            <div>
              <label className="label-console mb-1 block" htmlFor="set-name">Studio name</label>
              <Input
                id="set-name"
                className="h-8 text-xs"
                disabled={!canWrite}
                value={settings.studioName}
                onChange={(e) => patchSettings({ studioName: e.target.value })}
              />
            </div>
            <div>
              <label className="label-console mb-1 block" htmlFor="set-loc">Location</label>
              <Input
                id="set-loc"
                className="h-8 text-xs"
                disabled={!canWrite}
                value={settings.location}
                onChange={(e) => patchSettings({ location: e.target.value })}
              />
            </div>
            <div>
              <label className="label-console mb-1 block" htmlFor="set-rate">Hourly rate</label>
              <Input
                id="set-rate"
                type="number"
                className="h-8 text-xs"
                disabled={!canWrite}
                value={settings.hourlyRate}
                onChange={(e) => patchSettings({ hourlyRate: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Local AI" code="OLLAMA">
          <div className="space-y-3">
            <div>
              <label className="label-console mb-1 block" htmlFor="set-url">Ollama URL</label>
              <Input
                id="set-url"
                className="h-8 text-xs"
                disabled={!canWrite}
                value={settings.ollamaUrl}
                onChange={(e) => patchSettings({ ollamaUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="label-console mb-1 block" htmlFor="set-model">Model</label>
              <Input
                id="set-model"
                className="h-8 text-xs"
                disabled={!canWrite}
                value={settings.ollamaModel}
                onChange={(e) => patchSettings({ ollamaModel: e.target.value })}
              />
            </div>
            <div>
              <label className="label-console mb-1 block" htmlFor="set-depth">Records per answer</label>
              <Input
                id="set-depth"
                type="number"
                min={1}
                max={12}
                className="h-8 text-xs"
                disabled={!canWrite}
                value={settings.retrievalDepth}
                onChange={(e) => patchSettings({ retrievalDepth: Math.max(1, Math.min(12, Number(e.target.value) || 6)) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" className="h-8" onClick={() => void testConnection()} disabled={probing}>
                {probing ? "Testing…" : "Test connection"}
              </Button>
              {probe && <span className="readout text-[0.6rem] text-muted-foreground">{probe}</span>}
            </div>
            <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
              <span className="readout">/api/ollama</span> proxies through this server to the daemon set by the{" "}
              <span className="readout">OLLAMA_URL</span> environment variable — no CORS setup needed. To hit Ollama
              directly from the browser instead, enter a full URL and run{" "}
              <span className="readout">OLLAMA_ORIGINS=&quot;*&quot; ollama serve</span>.
            </p>

          </div>
        </Panel>

        <Panel title="Accounts" code="ACCESS">
          <div className="space-y-3">
            <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
              Accounts and roles live on the studio server and are shared by every machine. Owners
              manage the roster from the Users module.
            </p>
            {atLeast(user, "owner") && (
              <Button asChild size="sm" variant="secondary" className="h-8">
                <Link to="/users">
                  <Users className="size-3.5" /> Manage users
                </Link>
              </Button>
            )}
            <ChangePassphrase />
          </div>
        </Panel>

        <Panel title="Data" code="STORAGE">
          <div className="space-y-3">
            <Field label="Signed in as">{user ? `${user.name} · ${user.role}` : "—"}</Field>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" className="h-8" onClick={download}>
                <Download className="size-3.5" /> Export JSON
              </Button>
              <Button size="sm" variant="secondary" className="h-8" disabled={!isOwner} onClick={() => fileRef.current?.click()}>
                <Upload className="size-3.5" /> Import
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                  e.target.value = "";
                }}
              />
              <Button
                size="sm"
                variant="destructive"
                className="h-8"
                disabled={!isOwner}
                onClick={() => {
                  void resetToSeed()
                    .then(() => toast.success("Database reset to seed data"))
                    .catch((err: unknown) =>
                      toast.error("Reset failed", {
                        description: err instanceof Error ? err.message : "Server rejected it.",
                      }),
                    );
                }}
              >
                <RotateCcw className="size-3.5" /> Reset to seed
              </Button>
            </div>
            <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
              Records live on the studio server in{" "}
              <span className="readout">/data/studio.json</span> inside the mounted volume, shared
              by everyone signed in. Import and reset overwrite that shared database for all users.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ChangePassphrase() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await changeOwnPasswordFn({ data: { current, next } });
      setCurrent("");
      setNext("");
      toast.success("Passphrase updated");
    } catch (err) {
      toast.error("Could not update passphrase", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 border-t border-border/60 pt-3">
      <div className="label-console">Change my passphrase</div>
      <Input
        type="password"
        className="h-8 text-xs"
        placeholder="Current passphrase"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <Input
        type="password"
        className="h-8 text-xs"
        placeholder="New passphrase (min 8 characters)"
        autoComplete="new-password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      <Button type="submit" size="sm" variant="secondary" className="h-8" disabled={busy || !current || next.length < 8}>
        {busy ? "Saving…" : "Update passphrase"}
      </Button>
    </form>
  );
}
