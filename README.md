# The Studio OS

An offline-first operating system for recording studios: sessions, artists, equipment,
patchbay, maintenance, inventory, CRM, marketing, finance, calendar, tasks, training,
archive, and a local AI assistant backed by your own Ollama daemon.

Built with TanStack Start, TypeScript, React, and Tailwind CSS. All studio data lives in
the browser (`localStorage`) — nothing leaves the machine.

## Run with Docker

```sh
cp .env.example .env    # set STUDIO_OS_IMAGE, OLLAMA_NETWORK, OLLAMA_URL
docker compose up -d
```

Then open <http://localhost:8080>.

### Pointing at your existing Ollama

Studio OS does **not** start its own Ollama. It proxies `/api/ollama/*` from the server
to whatever `OLLAMA_URL` points at, so the browser never needs direct access and no
`OLLAMA_ORIGINS` configuration is required.

**Ollama in Docker (default).** Find the network your Ollama container is on:

```sh
docker inspect -f '{{json .NetworkSettings.Networks}}' ollama
```

Put that network name in `OLLAMA_NETWORK` and the container name in `OLLAMA_URL`
(e.g. `http://ollama:11434`), then `docker compose up -d`.

**Ollama on the host instead:**

```sh
docker compose -f docker-compose.host-ollama.yml up -d
```

Pick the model in the app under **Settings → Local AI**, and use *Test connection* to
verify. If you previously used the app in this browser, the saved Ollama URL persists —
change it to `/api/ollama` in Settings to use the proxy.

### Building the image yourself

```sh
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

Pushes to `main` and `v*.*.*` tags publish multi-arch images to GHCR via
`.github/workflows/docker-publish.yml`.

## Local development

```sh
bun install
bun run dev
```

Production build and run:

```sh
NITRO_PRESET=node-server bun run build
bun run start
```
