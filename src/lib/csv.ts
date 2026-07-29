/** Tiny quoted-field-aware CSV reader/writer. No dependency, runs in the browser. */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim().length));
}

function escapeCell(value: unknown): string {
  const s = value === undefined || value === null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: Array<Record<string, unknown>>, keys: string[]): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) lines.push(keys.map((k) => escapeCell(row[k])).join(","));
  return lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * Maps CSV rows onto records using a header alias map: { targetKey: [accepted headers] }.
 * Unknown columns are ignored; rows with no value in `requiredKey` are reported as skipped.
 */
export function mapCsvRows(
  rows: string[][],
  aliases: Record<string, string[]>,
  requiredKey: string,
): { records: Array<Record<string, string>>; skipped: number; matchedColumns: number } {
  if (!rows.length) return { records: [], skipped: 0, matchedColumns: 0 };
  const header = rows[0].map(norm);
  const index: Record<string, number> = {};
  for (const [key, names] of Object.entries(aliases)) {
    const i = header.findIndex((h) => h.length > 0 && names.some((n) => norm(n) === h));
    if (i >= 0) index[key] = i;
  }
  const records: Array<Record<string, string>> = [];
  let skipped = 0;
  for (const raw of rows.slice(1)) {
    const rec: Record<string, string> = {};
    for (const [key, i] of Object.entries(index)) rec[key] = (raw[i] ?? "").trim();
    if (!rec[requiredKey]) {
      skipped++;
      continue;
    }
    records.push(rec);
  }
  return { records, skipped, matchedColumns: Object.keys(index).length };
}
