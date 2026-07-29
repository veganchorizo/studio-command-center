import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, Field, PageHeader, Panel, StatusPin } from "@/components/studio/Panel";
import { useAuth, atLeast, type Role } from "@/features/auth/store";
import { useStudioDb, type CollectionName } from "@/features/data/store";
import { cn } from "@/lib/utils";

export type FieldKind = "text" | "textarea" | "number" | "date" | "select" | "tags" | "boolean";

export type FieldDef = {
  key: string;
  label: string;
  kind?: FieldKind;
  options?: readonly string[];
  required?: boolean;
  /** Render a filter dropdown for this field above the table. */
  filter?: boolean;
  /** Show this field as a table column. */
  table?: boolean;
  /** Full-width in the edit form. */
  wide?: boolean;
  mono?: boolean;
  placeholder?: string;
  format?: (value: unknown, row: Record<string, unknown>) => ReactNode;
};

export type CollectionModuleProps = {
  collection: CollectionName;
  title: string;
  code: string;
  subtitle: string;
  idPrefix: string;
  fields: FieldDef[];
  /** Fields searched by the keyword box; defaults to every text-ish field. */
  searchKeys?: string[];
  /** Role required to create, edit and delete. */
  writeRole?: Role;
  /** Optional tone for the leading status pin. */
  tone?: (row: Record<string, unknown>) => { tone: "live" | "ok" | "fault" | "idle" | "info"; label: string };
  /** Extra content in the detail sheet. */
  detail?: (row: Record<string, unknown>) => ReactNode;
  /** Extra content above the table (summary strips, charts). */
  summary?: ReactNode;
  /** Skip the page header when the module is embedded in a larger page. */
  hideHeader?: boolean;
  /** Allow clicking table headers to sort ascending / descending. */
  sortable?: boolean;
  /** Extra actions rendered in the table toolbar (import/export etc.). */
  toolbar?: ReactNode;
  defaults?: Record<string, unknown>;
  sort?: (a: Record<string, unknown>, b: Record<string, unknown>) => number;
};

const blankFor = (f: FieldDef): unknown => {
  switch (f.kind) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "tags":
      return [];
    case "select":
      return f.options?.[0] ?? "";
    default:
      return "";
  }
};

function newId(prefix: string) {
  return `${prefix}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export function displayValue(f: FieldDef, value: unknown, row: Record<string, unknown>): ReactNode {
  if (f.format) return f.format(value, row);
  if (f.kind === "boolean") return value ? "Yes" : "No";
  if (f.kind === "tags") return Array.isArray(value) && value.length ? value.join(", ") : "—";
  if (f.kind === "number") return typeof value === "number" ? value.toLocaleString() : "—";
  const s = value === undefined || value === null ? "" : String(value);
  return s.length ? s : "—";
}

export function CollectionModule(props: CollectionModuleProps) {
  const {
    collection,
    title,
    code,
    subtitle,
    idPrefix,
    fields,
    searchKeys,
    writeRole = "assistant",
    tone,
    hideHeader,
    detail,
    summary,
    defaults,
    sort,
    sortable,
    toolbar,
  } = props;

  const rows = useStudioDb((s) => s[collection]) as unknown as Array<Record<string, unknown>>;
  const upsert = useStudioDb((s) => s.upsert);
  const remove = useStudioDb((s) => s.remove);
  const user = useAuth((s) => s.user);
  const canWrite = atLeast(user, writeRole);

  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [detailRow, setDetailRow] = useState<Record<string, unknown> | null>(null);
  const [sortBy, setSortBy] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const filterFields = fields.filter((f) => f.filter && f.options?.length);
  const tableFields = fields.filter((f) => f.table !== false).slice(0, 7);
  const keys = searchKeys ?? fields.filter((f) => f.kind !== "boolean").map((f) => f.key);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = rows.filter((row) => {
      for (const [key, value] of Object.entries(filters)) {
        if (value && value !== "all" && String(row[key] ?? "") !== value) return false;
      }
      if (!needle) return true;
      const hay = [String(row.id ?? ""), ...keys.map((k) => String(row[k] ?? ""))].join(" ").toLowerCase();
      return hay.includes(needle);
    });
    if (sortBy) {
      const dir = sortBy.dir === "asc" ? 1 : -1;
      return [...out].sort((a, b) => {
        const av = a[sortBy.key];
        const bv = b[sortBy.key];
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true }) * dir;
      });
    }
    return sort ? [...out].sort(sort) : out;
  }, [rows, filters, q, keys, sort, sortBy]);

  function toggleSort(key: string) {
    setSortBy((s) =>
      !s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null,
    );
  }

  function openNew() {
    const blank: Record<string, unknown> = { id: newId(idPrefix) };
    for (const f of fields) blank[f.key] = blankFor(f);
    setEditing({ ...blank, ...defaults });
  }

  function save(row: Record<string, unknown>) {
    const missing = fields.find((f) => f.required && !String(row[f.key] ?? "").trim());
    if (missing) {
      toast.error(`${missing.label} is required`);
      return;
    }
    upsert(collection, row as never);
    setEditing(null);
    setDetailRow((d) => (d && d.id === row.id ? row : d));
    toast.success(`${title.replace(/s$/, "")} saved`, { description: String(row.id) });
  }

  function destroy(row: Record<string, unknown>) {
    remove(collection, String(row.id));
    setDetailRow(null);
    toast.success("Record deleted", { description: String(row.id) });
  }

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <PageHeader
          title={title}
          code={code}
          subtitle={subtitle}
          actions={
            canWrite ? (
              <Button size="sm" onClick={openNew} className="h-8">
                <Plus className="size-3.5" /> New
              </Button>
            ) : null
          }
        />
      )}
      {hideHeader && canWrite && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openNew} className="h-8">
            <Plus className="size-3.5" /> New
          </Button>
        </div>
      )}

      {summary}


      <Panel
        title={`${visible.length} record${visible.length === 1 ? "" : "s"}`}
        code={code.split(" ")[0]}
        bodyClassName="p-0"
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="h-8 pl-7 text-xs"
            />
          </div>
          {filterFields.map((f) => (
            <Select
              key={f.key}
              value={filters[f.key] ?? "all"}
              onValueChange={(v) => setFilters((s) => ({ ...s, [f.key]: v }))}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All — {f.label.toLowerCase()}</SelectItem>
                {f.options!.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {toolbar}
        </div>

        {visible.length === 0 ? (
          <EmptyState title="No records match" hint="Adjust the filters or add a new record." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="label-console px-3 py-2">
                    {sortable ? <SortHeader label="ID" active={sortBy?.key === "id" ? sortBy.dir : null} onClick={() => toggleSort("id")} /> : "ID"}
                  </th>
                  {tone && <th className="label-console px-3 py-2">State</th>}
                  {tableFields.map((f) => (
                    <th key={f.key} className="label-console px-3 py-2 whitespace-nowrap">
                      {sortable ? (
                        <SortHeader
                          label={f.label}
                          active={sortBy?.key === f.key ? sortBy.dir : null}
                          onClick={() => toggleSort(f.key)}
                        />
                      ) : (
                        f.label
                      )}
                    </th>
                  ))}
                  <th className="w-16 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const pin = tone?.(row);
                  return (
                    <tr
                      key={String(row.id)}
                      onClick={() => setDetailRow(row)}
                      className="cursor-pointer border-b border-border/60 hover:bg-muted/40"
                    >
                      <td className="readout px-3 py-2 text-[0.65rem] text-muted-foreground">{String(row.id)}</td>
                      {pin && (
                        <td className="px-3 py-2">
                          <StatusPin tone={pin.tone} label={pin.label} />
                        </td>
                      )}
                      {tableFields.map((f) => (
                        <td
                          key={f.key}
                          className={cn(
                            "max-w-[260px] truncate px-3 py-2 text-foreground",
                            f.mono || f.kind === "number" ? "readout text-[0.7rem]" : "",
                          )}
                        >
                          {displayValue(f, row[f.key], row)}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right">
                        {canWrite && (
                          <button
                            type="button"
                            aria-label="Edit record"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing({ ...row });
                            }}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Sheet open={!!detailRow} onOpenChange={(o) => !o && setDetailRow(null)}>
        <SheetContent className="w-full overflow-y-auto border-border bg-panel sm:max-w-xl">
          {detailRow && (
            <>
              <SheetHeader>
                <div className="label-console">{String(detailRow.id)}</div>
                <SheetTitle className="text-left text-lg">
                  {String(detailRow[fields[0].key] ?? detailRow.id)}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {fields.map((f) => (
                  <div key={f.key} className={f.wide || f.kind === "textarea" ? "col-span-2" : ""}>
                    <Field label={f.label}>
                      {f.kind === "textarea" ? (
                        <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                          {String(detailRow[f.key] ?? "") || "—"}
                        </p>
                      ) : (
                        displayValue(f, detailRow[f.key], detailRow)
                      )}
                    </Field>
                  </div>
                ))}
              </div>
              {detail && <div className="mt-6 space-y-4">{detail(detailRow)}</div>}
              {canWrite && (
                <div className="mt-6 flex gap-2 border-t border-border pt-4">
                  <Button size="sm" variant="secondary" onClick={() => setEditing({ ...detailRow })}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => destroy(detailRow)}>
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <RecordDialog
        title={title}
        fields={fields}
        row={editing}
        onCancel={() => setEditing(null)}
        onSave={save}
      />
    </div>
  );
}

function SortHeader({
  label,
  active,
  onClick,
}: {
  label: string;
  active: "asc" | "desc" | null;
  onClick: () => void;
}) {
  const Icon = active === "asc" ? ChevronUp : active === "desc" ? ChevronDown : ChevronsUpDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "label-console inline-flex items-center gap-1 hover:text-foreground",
        active ? "text-foreground" : "",
      )}
    >
      {label}
      <Icon className={cn("size-3", active ? "text-primary" : "opacity-40")} />
    </button>
  );
}

function RecordDialog({
  title,
  fields,
  row,
  onCancel,
  onSave,
}: {
  title: string;
  fields: FieldDef[];
  row: Record<string, unknown> | null;
  onCancel: () => void;
  onSave: (row: Record<string, unknown>) => void;
}) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [key, setKey] = useState<string | null>(null);

  if (row && key !== String(row.id)) {
    setKey(String(row.id));
    setDraft({ ...row });
  }
  if (!row && key !== null) setKey(null);

  const set = (k: string, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto border-border bg-panel">
        <DialogHeader>
          <DialogTitle className="text-base">{title.replace(/s$/, "")} record</DialogTitle>
          <DialogDescription className="readout text-[0.65rem]">{String(draft.id ?? "")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => {
            const value = draft[f.key];
            const wide = f.wide || f.kind === "textarea" || f.kind === "tags";
            return (
              <div key={f.key} className={wide ? "col-span-2" : ""}>
                <label className="label-console mb-1 block" htmlFor={`fld-${f.key}`}>
                  {f.label}
                  {f.required && <span className="text-primary"> *</span>}
                </label>
                {f.kind === "textarea" ? (
                  <Textarea
                    id={`fld-${f.key}`}
                    value={String(value ?? "")}
                    onChange={(e) => set(f.key, e.target.value)}
                    rows={4}
                    className="text-xs"
                    placeholder={f.placeholder}
                  />
                ) : f.kind === "select" ? (
                  <Select value={String(value ?? "")} onValueChange={(v) => set(f.key, v)}>
                    <SelectTrigger id={`fld-${f.key}`} className="h-8 text-xs">
                      <SelectValue placeholder={f.label} />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.kind === "boolean" ? (
                  <div className="flex h-8 items-center">
                    <Switch
                      id={`fld-${f.key}`}
                      checked={!!value}
                      onCheckedChange={(v) => set(f.key, v)}
                    />
                  </div>
                ) : f.kind === "tags" ? (
                  <Input
                    id={`fld-${f.key}`}
                    value={Array.isArray(value) ? value.join(", ") : String(value ?? "")}
                    onChange={(e) =>
                      set(
                        f.key,
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    className="h-8 text-xs"
                    placeholder="Comma separated"
                  />
                ) : (
                  <Input
                    id={`fld-${f.key}`}
                    type={f.kind === "number" ? "number" : f.kind === "date" ? "date" : "text"}
                    value={f.kind === "number" ? Number(value ?? 0) : String(value ?? "")}
                    onChange={(e) =>
                      set(f.key, f.kind === "number" ? Number(e.target.value) : e.target.value)
                    }
                    className="h-8 text-xs"
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onSave(draft)}>
            Save record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
