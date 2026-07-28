import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronsLeft, ChevronsRight, Radio } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { GROUP_LABELS, visibleModules, type NavModule } from "@/lib/nav";
import { useUi } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const user = useAuth((s) => s.user);
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const toggle = useUi((s) => s.toggleSidebar);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const modules = visibleModules(user?.role);
  const groups = Array.from(new Set(modules.map((m) => m.group)));

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-150",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <Radio className="size-4 shrink-0 text-primary" />
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-[0.8rem] font-semibold tracking-tight text-sidebar-foreground">
              THE STUDIO OS
            </div>
            <div className="readout text-[0.55rem] tracking-widest text-muted-foreground">LOCAL / OFFLINE</div>
          </div>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto py-2">
        {groups.map((group) => (
          <div key={group} className="mb-1">
            {!collapsed && <div className="label-console px-3 py-1.5">{GROUP_LABELS[group]}</div>}
            {modules
              .filter((m) => m.group === group)
              .map((m) => (
                <NavRow key={m.to} module={m} active={pathname.startsWith(m.to)} collapsed={collapsed} />
              ))}
          </div>
        ))}
      </nav>

      <button
        onClick={toggle}
        className="flex h-9 shrink-0 items-center justify-center gap-2 border-t border-border text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        {!collapsed && <span className="label-console">Collapse</span>}
      </button>
    </aside>
  );
}

function NavRow({ module, active, collapsed }: { module: NavModule; active: boolean; collapsed: boolean }) {
  const Icon = module.icon;
  return (
    <Link
      to={module.to}
      title={collapsed ? module.label : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 px-3 py-1.5 text-[0.8rem] transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-0 h-full w-[2px]",
          active ? "bg-primary" : "bg-transparent",
        )}
      />
      <Icon className="size-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate">{module.label}</span>
          {!module.built && (
            <span className="readout ml-auto text-[0.55rem] tracking-wider text-muted-foreground/50">WIP</span>
          )}
        </>
      )}
    </Link>
  );
}
