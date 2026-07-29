## Goal

`docker compose up` pulls a prebuilt image from GHCR and the Studio OS runs at `http://localhost:8080`, talking to the **Ollama container you already run on that server** — no second Ollama, no cloud services.

## Tying into your existing Ollama

Today the AI Assistant calls Ollama **from the browser** using a URL saved in Settings (`localStorage`), which means it needs `OLLAMA_ORIGINS="*"` and a host-reachable port. In a container setup that's fragile, so the plan adds a **server-side proxy**:

- New server route `src/routes/api/ollama/$.ts` that forwards `GET/POST` to `process.env.OLLAMA_URL` (default `http://ollama:11434`), streaming responses through unchanged.
- `src/features/assistant/ollama.ts` default base URL becomes `/api/ollama`; the Settings field stays, so you can still point directly at a host URL if you prefer.
- Result: no CORS config needed on your Ollama, the target is set by an env var at runtime (not baked into the image), and the browser never needs direct network access to Ollama.

Compose joins your existing Ollama's network instead of creating one:

```yaml
services:
  studio-os:
    image: ghcr.io/<owner>/<repo>:latest
    ports: ["8080:3000"]
    environment:
      OLLAMA_URL: ${OLLAMA_URL:-http://ollama:11434}
      OLLAMA_MODEL: ${OLLAMA_MODEL:-llama3.2}
    restart: unless-stopped
    networks: [ollama-net]

networks:
  ollama-net:
    external: true
    name: ${OLLAMA_NETWORK:-ollama_default}
```

A committed `.env.example` documents the three knobs:
- `OLLAMA_NETWORK` — the Docker network your Ollama container is already on (`docker network ls` to find it).
- `OLLAMA_URL` — `http://<ollama-container-name>:11434`.
- Alternative if Ollama runs on the host rather than in Docker: drop the external network and use `OLLAMA_URL=http://host.docker.internal:11434` with `extra_hosts: ["host.docker.internal:host-gateway"]` (both variants documented).

## The rest of the Dockerization

### 1. Build for a Node server
The project currently builds for a Cloudflare/edge target, which can't run in a plain container. Switch the nitro preset to `node-server` in `vite.config.ts`, add a `start` script running `node .output/server/index.mjs`.

### 2. `Dockerfile` (multi-stage)
- `builder`: `oven/bun`, install with frozen lockfile, `bun run build`.
- `runner`: `node:22-alpine`, non-root user, copy only `.output/`, `ENV PORT=3000 HOST=0.0.0.0`, `EXPOSE 3000`, `CMD ["node", ".output/server/index.mjs"]`.
- `.dockerignore` for `node_modules`, `.output`, `.git`, `.lovable`, logs.

### 3. GitHub Actions → GHCR
`.github/workflows/docker-publish.yml`: build and push on pushes to main and on tags, `linux/amd64` + `linux/arm64`, auth via the built-in `GITHUB_TOKEN`, tags `latest` + SHA + semver. Public image so `compose up` needs no login.

### 4. README
Quick start, how to find your Ollama network/container name, the host-Ollama fallback, and a note that app data lives in browser `localStorage` (nothing to mount yet).

## Technical notes
- Only functional code change is the proxy route + default base URL; existing direct-URL behaviour still works via Settings.
- Streaming must be preserved through the proxy — I'll verify a real token stream, not just a 200.
- No Postgres/pgvector service: app state is client-side today. Easy to add when a real backend lands.
- Multi-arch roughly doubles CI time; say the word and I'll drop arm64.
