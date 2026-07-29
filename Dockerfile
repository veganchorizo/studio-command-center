# syntax=docker/dockerfile:1

# ---- build ----
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
RUN bun run build

# ---- runtime ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV OLLAMA_URL=http://ollama:11434
# Accounts, sessions and every studio record live here — mount a volume on it.
ENV STUDIO_DATA_DIR=/data

COPY --from=builder /app/.output ./.output

RUN addgroup -S studio && adduser -S studio -G studio \
  && mkdir -p /data && chown -R studio:studio /app /data
USER studio

VOLUME ["/data"]
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
