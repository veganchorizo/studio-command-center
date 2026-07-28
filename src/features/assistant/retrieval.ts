import { db } from "@/features/data/store";

export type Snippet = { id: string; source: string; text: string; score: number };

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "it", "with", "that", "this",
  "what", "which", "how", "why", "do", "does", "i", "we", "you", "my", "our", "at", "be", "are",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

/**
 * Keyword retrieval over the local database — the offline stand-in for a
 * vector index. Scores documents by term frequency weighted by inverse
 * document frequency, no network involved.
 */
export function retrieve(query: string, limit = 6): Snippet[] {
  const terms = tokenize(query);
  if (!terms.length) return [];

  const s = db();
  const corpus: Array<{ id: string; source: string; text: string }> = [
    ...s.knowledge.map((d) => ({
      id: d.id,
      source: `Knowledge · ${d.title}`,
      text: `${d.title}\n${d.tags.join(" ")}\n${d.body}`,
    })),
    ...s.sessions.map((x) => ({
      id: x.id,
      source: `Session · ${x.title} (${x.date})`,
      text: [x.title, x.artist, x.engineer, x.room, x.project, x.patching, x.cueMixes, x.notes, x.problems, x.microphones.join(" "), x.outboard.join(" ")].join("\n"),
    })),
    ...s.equipment.map((e) => ({
      id: e.id,
      source: `Equipment · ${e.manufacturer} ${e.model}`,
      text: [e.manufacturer, e.model, e.category, e.location, e.rack, e.status, e.notes, e.knownIssues, e.favoriteUses.join(" "), e.maintenanceHistory.map((m) => `${m.type} ${m.note}`).join(" ")].join("\n"),
    })),
    ...s.tickets.map((t) => ({
      id: t.id,
      source: `Maintenance · ${t.equipment}`,
      text: [t.equipment, t.fault, t.status, t.assignee, t.resolution].join("\n"),
    })),
    ...s.artists.map((a) => ({
      id: a.id,
      source: `Artist · ${a.name}`,
      text: [a.name, a.genre, a.label, a.preferredMic, a.preferredChain, a.notes].join("\n"),
    })),
  ];

  const docTokens = corpus.map((d) => tokenize(d.text));
  const N = corpus.length || 1;
  const df = new Map<string, number>();
  for (const tokens of docTokens) {
    for (const t of new Set(tokens)) df.set(t, (df.get(t) ?? 0) + 1);
  }

  const scored = corpus.map((doc, i) => {
    const tokens = docTokens[i];
    let score = 0;
    for (const term of terms) {
      const tf = tokens.filter((t) => t === term || t.startsWith(term)).length;
      if (!tf) continue;
      const idf = Math.log(1 + N / (1 + (df.get(term) ?? 0)));
      score += (tf / (tf + 2)) * idf;
    }
    return { ...doc, score };
  });

  return scored
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((d) => ({ ...d, text: d.text.slice(0, 900) }));
}

export function buildSystemPrompt(snippets: Snippet[], studioName: string) {
  const context = snippets.length
    ? snippets.map((s, i) => `[${i + 1}] ${s.source}\n${s.text}`).join("\n\n---\n\n")
    : "No matching records in the local database.";
  return [
    `You are the in-house assistant for ${studioName}, a recording studio.`,
    "Answer from the studio records below. Cite the bracketed source numbers you used.",
    "If the records do not cover the question, say so plainly rather than inventing detail.",
    "Be concise and practical — the reader is an engineer mid-session.",
    "",
    "STUDIO RECORDS:",
    context,
  ].join("\n");
}
