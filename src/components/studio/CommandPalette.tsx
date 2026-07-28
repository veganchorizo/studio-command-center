import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/features/auth/store";
import { useStudioDb } from "@/features/data/store";
import { visibleModules } from "@/lib/nav";
import { useUi } from "@/lib/ui-store";

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPaletteOpen);
  const role = useAuth((s) => s.user?.role);
  const sessions = useStudioDb((s) => s.sessions);
  const equipment = useStudioDb((s) => s.equipment);
  const navigate = useNavigate();
  const modules = visibleModules(role);
  const pendingG = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (pendingG.current) {
        pendingG.current = false;
        const target = modules.find((m) => m.key === e.key.toLowerCase());
        if (target) {
          e.preventDefault();
          navigate({ to: target.to });
        }
        return;
      }
      if (e.key.toLowerCase() === "g") {
        pendingG.current = true;
        window.setTimeout(() => (pendingG.current = false), 1200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modules, navigate, open, setOpen]);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a module, session, or piece of gear…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>Nothing matched.</CommandEmpty>

        <CommandGroup heading="Modules">
          {modules.map((m) => (
            <CommandItem key={m.to} value={`${m.label} ${m.code}`} onSelect={() => go(m.to)}>
              <m.icon className="mr-2 size-3.5" />
              <span>{m.label}</span>
              <span className="readout ml-auto text-[0.6rem] text-muted-foreground">
                {m.key ? `g ${m.key}` : m.code}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Sessions">
          {sessions.slice(0, 40).map((s) => (
            <CommandItem
              key={s.id}
              value={`${s.title} ${s.artist} ${s.id} ${s.project}`}
              onSelect={() => go(`/sessions/${s.id}`)}
            >
              <span className="truncate">{s.title}</span>
              <span className="readout ml-auto text-[0.6rem] text-muted-foreground">{s.date}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Equipment">
          {equipment.slice(0, 60).map((e) => (
            <CommandItem
              key={e.id}
              value={`${e.manufacturer} ${e.model} ${e.serial}`}
              onSelect={() => go(`/equipment/${e.id}`)}
            >
              <span className="truncate">
                {e.manufacturer} {e.model}
              </span>
              <span className="readout ml-auto text-[0.6rem] text-muted-foreground">{e.location}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
