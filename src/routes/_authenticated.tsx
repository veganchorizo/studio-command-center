import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/studio/AppSidebar";
import { CommandPalette } from "@/components/studio/CommandPalette";
import { TopBar } from "@/components/studio/TopBar";
import { useAuth } from "@/features/auth/store";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ location }) => {
    if (!useAuth.getState().user) {
      throw redirect({ to: "/", search: { redirect: location.href } });
    }
  },
  component: StudioShell,
});

function StudioShell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <Toaster position="bottom-right" />
    </div>
  );
}
