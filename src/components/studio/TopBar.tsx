import { useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Search, Command as CommandIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAuth } from "@/features/auth/store";
import { NAV_MODULES } from "@/lib/nav";
import { useUi } from "@/lib/ui-store";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const setPaletteOpen = useUi((s) => s.setPaletteOpen);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const current = NAV_MODULES.find((m) => pathname.startsWith(m.to));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const now = new Date();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    clearAuthCache();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-rail px-3">
      <div className="readout hidden shrink-0 items-center gap-2 text-[0.65rem] uppercase tracking-widest text-muted-foreground md:flex">
        <span className="text-primary">{current?.code ?? "OS"}</span>
        <span className="text-border-strong">/</span>
        <span>{current?.label ?? "Studio OS"}</span>
      </div>

      <button
        onClick={() => setPaletteOpen(true)}
        className="flex min-w-0 flex-1 items-center gap-2 border border-border bg-panel px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-border-strong"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="truncate">Search sessions, gear, clients, documents…</span>
        <span className="readout ml-auto hidden shrink-0 items-center gap-0.5 text-[0.6rem] text-muted-foreground/70 sm:flex">
          <CommandIcon className="size-3" />K
        </span>
      </button>

      <input ref={searchRef} className="sr-only" onFocus={() => setPaletteOpen(true)} aria-hidden tabIndex={-1} />

      <div className="readout hidden shrink-0 text-[0.65rem] uppercase tracking-widest text-muted-foreground lg:block">
        {now.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" })}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex shrink-0 items-center gap-2 border border-border bg-panel px-2 py-1 transition-colors hover:border-border-strong">
          <span className="readout flex size-5 items-center justify-center bg-primary text-[0.6rem] font-semibold text-primary-foreground">
            {user?.initials}
          </span>
          <span className="hidden text-xs text-foreground sm:block">{user?.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="label-console">{user?.role}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs" onSelect={() => navigate({ to: "/settings" })}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onSelect={handleSignOut}>
            <LogOut className="mr-2 size-3.5" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
