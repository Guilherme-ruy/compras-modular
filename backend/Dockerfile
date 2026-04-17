# ─────────────────────────────────────────────────────────────
# Stage 1: Builder
#   - Instala TODAS as dependências (dev + prod)
#   - Gera o Prisma Client
#   - Compila o TypeScript (src/ + prisma/seed.ts) para dist/
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copia os manifestos de dependência primeiro (cache layer)
COPY package*.json ./
COPY tsconfig.json ./

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm ci

# Copia o schema e o config do Prisma, e gera o client
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# Copia o restante do código e compila
COPY . .

# Compila a aplicação
RUN npm run build

# Compila o seed.ts para seed.js (sem ts-node em produção)
RUN node_modules/.bin/tsc prisma/seed.ts \
    --esModuleInterop true \
    --module commonjs \
    --target es2020 \
    --moduleResolution node \
    --resolveJsonModule true \
    --skipLibCheck true \
    --outDir dist/prisma

# ─────────────────────────────────────────────────────────────
# Stage 2: Production
#   - Imagem enxuta, apenas o necessário para rodar
#   - Copia o build compilado e o Prisma Client gerado
#   - Roda migration, seed (JS puro) e sobe o servidor
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copia os manifestos e instala SOMENTE as dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o código compilado (app + seed compilado)
COPY --from=builder /app/dist ./dist

# Copia o Prisma Client gerado (binários nativos)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/@prisma/adapter-pg ./node_modules/@prisma/adapter-pg
COPY --from=builder /app/node_modules/pg ./node_modules/pg
COPY --from=builder /app/node_modules/pg-pool ./node_modules/pg-pool
COPY --from=builder /app/node_modules/pg-types ./node_modules/pg-types

# Copia os arquivos do Prisma necessários em runtime
COPY prisma ./prisma
# ESM nativo — sem ts-node. O prisma.config.ts (dev) não é copiado.
COPY prisma.config.mjs ./prisma.config.mjs

EXPOSE 3000

# 1) Aplica migrations pendentes (idempotente — seguro rodar sempre)
# 2) Popula o banco com dados iniciais via JS puro compilado (idempotente)
# 3) Inicia a API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js && node dist/src/main"]
