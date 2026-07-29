import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Radio, ShieldCheck } from "lucide-react";
import { bootstrapAuth, useAuth } from "@/features/auth/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — The Studio OS" },
      {
        name: "description",
        content:
          "Local sign-in for The Studio OS, the offline-first operating system for professional recording studios.",
      },
      { property: "og:title", content: "Sign in — The Studio OS" },
      {
        property: "og:description",
        content: "Local sign-in for The Studio OS, the offline-first recording studio operating system.",
      },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const user = await bootstrapAuth();
    if (user) throw redirect({ to: "/dashboard" });
  },
  component: SignIn,
});

function SignIn() {
  const signIn = useAuth((s) => s.signIn);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const result = await signIn(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <Radio className="size-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">THE STUDIO OS</h1>
            <p className="readout text-[0.6rem] tracking-widest text-muted-foreground">
              {"\n"}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 border border-border bg-panel p-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="label-console">
              Account
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              className="readout bg-void text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="label-console">
              Passphrase
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              className="readout bg-void text-xs"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Checking credentials…" : "Enter the studio"}
          </Button>
        </form>

        <div className="mt-4 border border-border bg-rail p-3">
          <div className="label-console mb-2 flex items-center gap-1.5">
            <ShieldCheck className="size-3" /> Accounts live on this server
          </div>
          <p className="text-[0.65rem] leading-relaxed text-muted-foreground/70">
            {"\n"}
          </p>
        </div>
      </div>
    </main>
  );
}
