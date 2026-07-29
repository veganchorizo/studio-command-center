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
  beforeLoad: () => {
    if (typeof window !== "undefined" && useAuth.getState().user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: SignIn,
});

function SignIn() {
  const signIn = useAuth((s) => s.signIn);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@studio.local");
  const [password, setPassword] = useState("studio");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = signIn(email, password);
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

          <Button type="submit" className="w-full">
            Enter the studio
          </Button>
        </form>

        <div className="mt-4 border border-border bg-rail p-3">
          <div className="label-console mb-2 flex items-center gap-1.5">
            <ShieldCheck className="size-3" /> Local roster
          </div>
          <ul className="space-y-1">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword("studio");
                  }}
                  className="readout text-[0.65rem] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {a.email}
                </button>
                <span className="readout text-[0.6rem] uppercase tracking-widest text-muted-foreground/60">
                  {a.role}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[0.65rem] text-muted-foreground/70">Passphrase for every seeded account: studio</p>
        </div>
      </div>
    </main>
  );
}
