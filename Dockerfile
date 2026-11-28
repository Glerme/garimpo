# Sistema (Next.js). Rastro e WhatsApp têm os próprios Dockerfiles em servicos/.
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

FROM base AS build
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY scripts ./scripts
RUN npm ci
COPY . .
ARG DATABASE_URL=file:./dados/garimpo.db
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/v1/openapi.json').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
# Aplica as tabelas (idempotente) e sobe.
CMD ["sh", "-c", "node scripts/db.mjs && npx next start -p 3000"]
