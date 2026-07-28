import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, PageHeader, Panel } from "@/components/studio/Panel";
import { useAuth, atLeast, DEMO_ACCOUNTS } from "@/features/auth/store";
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
              Ollama must allow this origin: run <span className="readout">OLLAMA_ORIGINS=&quot;*&quot; ollama serve</span> on the
              studio machine.
            </p>
          </div>
        </Panel>

        <Panel title="Roster" code="ACCESS">
          <ul className="divide-y divide-border/60">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-foreground">{a.name}</span>
                <span className="readout text-[0.6rem] text-muted-foreground">
                  {a.email} · {a.role}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Data" code="STORAGE">
          <div className="space-y-3">
            <Field label="Signed in as">{user ? `${user.name} · ${user.role}` : "—"}</Field>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" className="h-8" onClick={download}>
                <Download className="size-3.5" /> Export JSON
              </Button>
              <Button size="sm" variant="secondary" className="h-8" disabled={!canWrite} onClick={() => fileRef.current?.click()}>
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
                disabled={!canWrite}
                onClick={() => {
                  resetToSeed();
                  toast.success("Database reset to seed data");
                }}
              >
                <RotateCcw className="size-3.5" /> Reset to seed
              </Button>
            </div>
            <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
              Records persist in this browser under <span className="readout">studio-os/db/v1</span>. Export regularly — clearing
              site data wipes the studio.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
