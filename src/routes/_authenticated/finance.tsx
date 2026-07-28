import { createFileRoute } from "@tanstack/react-router";
import { CollectionModule } from "@/components/studio/CollectionModule";
import { PageHeader, Panel } from "@/components/studio/Panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ARTISTS } from "@/features/data/seed";
import { useStudioDb } from "@/features/data/store";

const TITLE = "Finance — The Studio OS";
const DESC = "Invoices, expenses and monthly revenue for the studio.";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FinancePage,
});

const money = (n: number) => `£${Math.round(n).toLocaleString()}`;

function Ledger() {
  const invoices = useStudioDb((s) => s.invoices);
  const expenses = useStudioDb((s) => s.expenses);
  const today = new Date().toISOString().slice(0, 10);

  const billed = invoices.reduce((sum, i) => sum + i.amount, 0);
  const outstanding = invoices.filter((i) => !i.paid).reduce((sum, i) => sum + i.amount, 0);
  const overdue = invoices.filter((i) => !i.paid && i.due < today).reduce((s, i) => s + i.amount, 0);
  const spend = expenses.reduce((sum, e) => sum + e.amount, 0);

  const months = new Map<string, { in: number; out: number }>();
  for (const i of invoices) {
    const k = i.issued.slice(0, 7);
    const row = months.get(k) ?? { in: 0, out: 0 };
    row.in += i.amount;
    months.set(k, row);
  }
  for (const e of expenses) {
    const k = e.date.slice(0, 7);
    const row = months.get(k) ?? { in: 0, out: 0 };
    row.out += e.amount;
    months.set(k, row);
  }
  const series = [...months.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-8);
  const peak = Math.max(1, ...series.map(([, v]) => Math.max(v.in, v.out)));

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ["Billed", money(billed), "text-foreground"],
          ["Outstanding", money(outstanding), "text-foreground"],
          ["Overdue", money(overdue), "text-primary"],
          ["Expenses", money(spend), "text-foreground"],
        ].map(([label, value, tone]) => (
          <Panel key={label} title={label} code="FIN">
            <div className={`readout text-2xl ${tone}`}>{value}</div>
          </Panel>
        ))}
      </div>
      <Panel title="In / out by month" code="FIN">
        <div className="flex h-32 items-end gap-3">
          {series.map(([month, v]) => (
            <div key={month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end justify-center gap-0.5">
                <div
                  className="w-1/2 bg-status-ok/70"
                  style={{ height: `${(v.in / peak) * 100}%` }}
                  title={`In ${money(v.in)}`}
                />
                <div
                  className="w-1/2 bg-primary/70"
                  style={{ height: `${(v.out / peak) * 100}%` }}
                  title={`Out ${money(v.out)}`}
                />
              </div>
              <span className="readout text-[0.55rem] text-muted-foreground">{month.slice(2)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function FinancePage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Finance"
        code="FIN / LEDGER"
        subtitle="What the studio has billed, what it is owed and what it spends."
      />
      <Ledger />
      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-3">
          <CollectionModule
            hideHeader
            collection="invoices"
            title="Invoices"
            code="FIN / AR"
            subtitle=""
            idPrefix="INV"
            writeRole="owner"
            tone={(row) =>
              row.paid
                ? { tone: "ok", label: "paid" }
                : String(row.due) < new Date().toISOString().slice(0, 10)
                  ? { tone: "fault", label: "overdue" }
                  : { tone: "live", label: "open" }
            }
            fields={[
              { key: "client", label: "Client", required: true, kind: "select", filter: true, options: ARTISTS },
              { key: "amount", label: "Amount", kind: "number", format: (v) => money(Number(v ?? 0)) },
              { key: "issued", label: "Issued", kind: "date" },
              { key: "due", label: "Due", kind: "date" },
              { key: "paid", label: "Paid", kind: "boolean" },
            ]}
            sort={(a, b) => String(b.issued).localeCompare(String(a.issued))}
          />
        </TabsContent>
        <TabsContent value="expenses" className="mt-3">
          <CollectionModule
            hideHeader
            collection="expenses"
            title="Expenses"
            code="FIN / AP"
            subtitle=""
            idPrefix="EXP"
            writeRole="owner"
            tone={(row) => (row.paid ? { tone: "ok", label: "paid" } : { tone: "live", label: "due" })}
            fields={[
              { key: "vendor", label: "Vendor", required: true },
              { key: "category", label: "Category", kind: "select", filter: true, options: ["Gear", "Rent", "Utilities", "Payroll", "Supplies", "Software", "Other"] },
              { key: "amount", label: "Amount", kind: "number", format: (v) => money(Number(v ?? 0)) },
              { key: "date", label: "Date", kind: "date" },
              { key: "paid", label: "Paid", kind: "boolean" },
              { key: "notes", label: "Notes", kind: "textarea" },
            ]}
            sort={(a, b) => String(b.date).localeCompare(String(a.date))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
