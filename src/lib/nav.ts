import {
  Boxes,
  Bot,
  CalendarDays,
  CircleDollarSign,
  Cable,
  Disc3,
  Gauge,
  GraduationCap,
  KanbanSquare,
  Library,
  Mic2,
  Megaphone,
  Settings,
  SlidersHorizontal,
  Users,
  Wrench,
  FolderOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/features/auth/store";

export type NavModule = {
  to: string;
  label: string;
  icon: LucideIcon;
  code: string;
  /** Roles allowed to see the module. Omitted = everyone. */
  roles?: Role[];
  group: "operations" | "assets" | "intelligence" | "business" | "system";
  built?: boolean;
  /** Single-key shortcut, pressed after `g`. */
  key?: string;
};

export const NAV_MODULES: NavModule[] = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge, code: "DSH", group: "operations", built: true, key: "d" },
  { to: "/sessions", label: "Sessions", icon: Disc3, code: "SES", group: "operations", built: true, key: "s" },
  { to: "/artists", label: "Artists", icon: Mic2, code: "ART", group: "operations" },
  { to: "/projects", label: "Projects", icon: FolderOpen, code: "PRJ", group: "operations" },
  { to: "/equipment", label: "Equipment", icon: SlidersHorizontal, code: "EQP", group: "assets", built: true, key: "e" },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, code: "MNT", group: "assets" },
  { to: "/patchbay", label: "Patchbay", icon: Cable, code: "PTC", group: "assets" },
  { to: "/inventory", label: "Inventory", icon: Boxes, code: "INV", group: "assets" },
  { to: "/clients", label: "Clients", icon: Users, code: "CLI", group: "business", roles: ["owner", "engineer"] },
  { to: "/tasks", label: "Tasks", icon: KanbanSquare, code: "TSK", group: "operations" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, code: "CAL", group: "operations" },
  { to: "/knowledge", label: "Knowledge Base", icon: Library, code: "KB", group: "intelligence" },
  { to: "/assistant", label: "AI Assistant", icon: Bot, code: "AI", group: "intelligence", key: "a" },
  { to: "/marketing", label: "Marketing", icon: Megaphone, code: "MKT", group: "business", roles: ["owner", "engineer"] },
  { to: "/finance", label: "Finance", icon: CircleDollarSign, code: "FIN", group: "business", roles: ["owner"] },
  { to: "/training", label: "Intern Training", icon: GraduationCap, code: "TRN", group: "intelligence" },
  { to: "/settings", label: "Settings", icon: Settings, code: "SYS", group: "system", roles: ["owner", "engineer"] },
];

export const GROUP_LABELS: Record<NavModule["group"], string> = {
  operations: "Operations",
  assets: "Assets",
  intelligence: "Intelligence",
  business: "Business",
  system: "System",
};

export function visibleModules(role: Role | undefined) {
  if (!role) return [];
  return NAV_MODULES.filter((m) => !m.roles || m.roles.includes(role));
}
