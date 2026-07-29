/**
 * The only module in the app that makes a network call — and it goes to an
 * Ollama daemon on the operator's own machine, never to a hosted service.
 *
 * Ollama must allow the browser origin, e.g.
 *   OLLAMA_ORIGINS="*" ollama serve
 */

export type OllamaMessage = { role: "system" | "user" | "assistant"; content: string };

export async function listModels(baseUrl: string): Promise<string[]> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`);
  if (!res.ok) throw new Error(`Ollama responded ${res.status}`);
  const data = (await res.json()) as { models?: Array<{ name: string }> };
  return (data.models ?? []).map((m) => m.name);
}

export async function streamChat(opts: {
  baseUrl: string;
  model: string;
  messages: OllamaMessage[];
  signal?: AbortSignal;
  onToken: (chunk: string) => void;
}): Promise<void> {
  const res = await fetch(`${opts.baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: opts.model, messages: opts.messages, stream: true }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw new Error(`Ollama responded ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed) as { message?: { content?: string }; done?: boolean };
        if (parsed.message?.content) opts.onToken(parsed.message.content);
      } catch {
        // partial JSON line — ignore and wait for the rest
      }
    }
  }
}

export function connectionHint(baseUrl: string) {
  if (baseUrl.startsWith("/")) {
    return `Could not reach Ollama through ${baseUrl}. Check that OLLAMA_URL points at your Ollama container and that both containers share a Docker network.`;
  }
  return `Could not reach Ollama at ${baseUrl}. Start it with OLLAMA_ORIGINS="*" ollama serve so the browser is allowed to connect, then test again from Settings.`;
}

