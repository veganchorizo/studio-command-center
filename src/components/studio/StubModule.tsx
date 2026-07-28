import { Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { PageHeader, Panel } from "./Panel";

export function StubModule({
  title,
  code,
  summary,
  planned,
}: {
  title: string;
  code: string;
  summary: string;
  planned: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={title} code={code} subtitle={summary} />
      <Panel title="Module not wired yet" code={code}>
        <div className="flex gap-3">
          <Construction className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This module is routed and reserved. It ships in a later pass, on the same local data layer as the rest
              of the system — nothing here will call out to the network.
            </p>
            <div>
              <div className="label-console mb-2">Planned scope</div>
              <ul className="space-y-1">
                {planned.map((p) => (
                  <li key={p} className="flex gap-2 text-xs text-foreground">
                    <span className="text-primary">—</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/dashboard" className="inline-block text-xs text-primary underline-offset-4 hover:underline">
              Back to the command center
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}
