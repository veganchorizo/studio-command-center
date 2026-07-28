import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Panel({
  title,
  code,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  code?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("flex flex-col border border-border bg-panel", className)}>
      {(title || actions) && (
        <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
          <div className="flex items-baseline gap-2 overflow-hidden">
            <h2 className="label-console truncate text-foreground">{title}</h2>
            {code && <span className="readout text-[0.6rem] text-muted-foreground/60">{code}</span>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className={cn("min-h-0 flex-1 p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

const PIN_TONE: Record<string, string> = {
  live: "bg-status-live",
  ok: "bg-status-ok",
  fault: "bg-status-fault",
  idle: "bg-status-idle",
  info: "bg-status-info",
};

export function StatusPin({
  tone = "idle",
  label,
  pulse,
}: {
  tone?: keyof typeof PIN_TONE;
  label: string;
  pulse?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={cn("size-1.5 rounded-full", PIN_TONE[tone], pulse && "animate-pulse")} />
      <span className="readout text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</span>
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="label-console mb-1">{label}</div>
      <div className="text-sm text-foreground">{children || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
      <p className="text-sm text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  code,
  subtitle,
  actions,
}: {
  title: string;
  code: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
      <div>
        <div className="label-console mb-1.5">{code}</div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
