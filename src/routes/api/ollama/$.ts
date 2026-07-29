import { createFileRoute } from "@tanstack/react-router";

/**
 * Server-side proxy to the operator's own Ollama daemon.
 *
 * The browser talks to `/api/ollama/...` (same origin, so no CORS config needed
 * on Ollama), and this handler forwards to `OLLAMA_URL` — set at runtime by
 * docker compose, e.g. `http://ollama:11434`.
 */
function targetBase() {
  return (process.env.OLLAMA_URL ?? "http://ollama:11434").replace(/\/$/, "");
}

async function proxy(request: Request, splat: string | undefined) {
  const incoming = new URL(request.url);
  const path = (splat ?? "").replace(/^\/+/, "");
  const target = `${targetBase()}/${path}${incoming.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      // required by undici/node when streaming a request body
      ...({ duplex: "half" } as Record<string, unknown>),
      redirect: "manual",
    });

    const outHeaders = new Headers(upstream.headers);
    outHeaders.delete("content-encoding");
    outHeaders.delete("content-length");
    outHeaders.delete("transfer-encoding");

    // Pass the body straight through so token streaming stays incremental.
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders,
    });
  } catch (error) {
    console.error("Ollama proxy failed:", error);
    return Response.json(
      {
        error: `Could not reach Ollama at ${targetBase()}. Check the OLLAMA_URL environment variable and that the container is on the same Docker network.`,
      },
      { status: 502 },
    );
  }
}

export const Route = createFileRoute("/api/ollama/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => proxy(request, params._splat),
      POST: async ({ request, params }) => proxy(request, params._splat),
      DELETE: async ({ request, params }) => proxy(request, params._splat),
    },
  },
});
