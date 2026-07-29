# The Studio OS

An offline-first operating system for recording studios: sessions, artists, equipment,
patchbay, maintenance, inventory, CRM, marketing, finance, calendar, tasks, training,
archive, and a local AI assistant backed by your own Ollama daemon.

Built with TanStack Start, TypeScript, React, and Tailwind CSS. Accounts and every studio
record are stored on the server inside the container's `/data` volume — shared by every
machine that reaches it, and never sent anywhere else.

## Run with Docker

```sh
cp .env.example .env    # set STUDIO_OS_IMAGE, OLLAMA_NETWORK, OLLAMA_URL, STUDIO_ADMIN_*
docker compose up -d
```

Then open <http://localhost:8080>.

### Accounts and roles

Accounts live server-side in `/data/users.json` (passphrases are salted and
scrypt-hashed; sessions are encrypted HTTP-only cookies), so everyone signs in with the
same roster from any machine on your network.

On the very first start, one owner account is created from `STUDIO_ADMIN_EMAIL` and
`STUDIO_ADMIN_PASSWORD`. Leave the password blank and a random one is generated and
printed to the logs:

```sh
docker compose logs studio-os | grep studio-os
```

Sign in as that owner and open **Users** in the sidebar to create everyone else and
assign roles:

| Role | Can do |
| --- | --- |
| `owner` | Everything, including accounts, finance and data import/reset |
| `engineer` | Sessions, clients, campaigns, training, settings |
| `assistant` | Sessions, equipment, archive, inventory, tickets |
| `intern` | Read-only across the studio, plus tasks and notes |

Anyone can change their own passphrase under **Settings → Accounts**.

### Data storage and backups

The shared database is `/data/studio.json` on the `studio-data` volume, written
atomically on every change. Back it up with:

```sh
docker run --rm -v studio-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/studio-backup.tgz -C /data .
```

**Settings → Data** also offers a JSON export, plus owner-only import and reset which
overwrite the shared database for everyone.


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
