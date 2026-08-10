# ============================================================
# Estágio 1 — build: compila o TypeScript
# ============================================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copiar só os manifestos primeiro aproveita o cache do Docker:
# enquanto as dependências não mudarem, este passo não roda de novo.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ============================================================
# Estágio 2 — runtime: só o necessário para executar
# ============================================================
FROM node:24-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# JavaScript compilado vindo do estágio anterior
COPY --from=builder /app/dist ./dist

# Migrations são arquivos .sql — não passam pelo compilador
COPY migrations ./migrations

# Nunca rodar como root: se a aplicação for comprometida,
# o invasor herda os privilégios do processo.
USER node

EXPOSE 3333

CMD ["node", "dist/server.js"]