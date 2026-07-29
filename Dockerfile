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

COPY --from=builder /app/.output ./.output

RUN addgroup -S studio && adduser -S studio -G studio && chown -R studio:studio /app
USER studio

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
