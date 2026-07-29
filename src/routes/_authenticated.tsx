import { useEffect } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/studio/AppSidebar";
import { CommandPalette } from "@/components/studio/CommandPalette";
import { TopBar } from "@/components/studio/TopBar";
import { bootstrapAuth } from "@/features/auth/store";
import { useStudioDb } from "@/features/data/store";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const user = await bootstrapAuth();
    if (!user) throw redirect({ to: "/", search: { redirect: location.href } });
    return { user };
  },
  // Studio records come from the server, so the shell can't render until they land.
  loader: () => useStudioDb.getState().hydrate(),
  component: StudioShell,
});

function StudioShell() {
  const refresh = useStudioDb((s) => s.refresh);
  const error = useStudioDb((s) => s.error);

  // Pick up edits made by other machines sharing this server.
  useEffect(() => {
    const id = window.setInterval(() => void refresh(), 8000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <LocalImportBanner />
        {error && (
          <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-1.5 text-[0.65rem] text-destructive">
            Studio server unreachable — {error}. Changes may not be saved.
          </div>
        )}
        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <Toaster position="bottom-right" />
    </div>
  );
}
