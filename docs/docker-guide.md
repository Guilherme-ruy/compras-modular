# Docker — Guia Completo do Projeto Compras Modular

Este guia explica como funciona a infraestrutura Docker do projeto, o que cada arquivo faz, e como usar no dia a dia.

---

## Visão Geral da Arquitetura de Containers

```
┌─────────────────────────────────────────────────────────────┐
│                     docker-compose.yml                      │
│                                                             │
│  ┌──────────────┐    ┌─────────────────┐    ┌───────────┐  │
│  │   frontend   │───▶│    backend      │───▶│    db     │  │
│  │   Nginx:80   │    │  NestJS:3000    │    │  PG:5432  │  │
│  │  porta:5173  │    │  porta:3000     │    │ porta:5433│  │
│  └──────────────┘    └─────────────────┘    └───────────┘  │
│                                                             │
│                      Volume: postgres_data                  │
└─────────────────────────────────────────────────────────────┘
```

**Fluxo de dependências:** `db` precisa estar saudável → `backend` pode iniciar → `frontend` pode iniciar.

---

## Arquivo: `docker-compose.yml`

O docker-compose é o **orquestrador** — ele define quais containers existem, como se comunicam e em que ordem sobem.

### Serviço `db` (PostgreSQL)

```yaml
db:
  image: postgres:16-alpine       # Imagem oficial, versão 16, Alpine (leve)
  container_name: compras_db      # Nome fixo do container
  environment:
    POSTGRES_USER: compras_user       # Usuário do banco
    POSTGRES_PASSWORD: compras_password
    POSTGRES_DB: compras_db           # Banco criado automaticamente
  ports:
    - "5433:5432"                 # Host:5433 → Container:5432
                                  # (5433 para não conflitar com PG local)
  volumes:
    - postgres_data:/var/lib/postgresql/data  # Persiste os dados
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U compras_user -d compras_db"]
    interval: 10s                 # Verifica a cada 10s
    timeout: 5s
    retries: 5                    # 5 tentativas antes de considerar unhealthy
```

> **Por que healthcheck?** Garante que o banco está *de fato aceitando conexões* (não apenas que o processo iniciou) antes do backend tentar conectar.

### Serviço `backend` (NestJS)

```yaml
backend:
  build:
    context: ./backend            # Usa a pasta backend/ como contexto do build
    dockerfile: Dockerfile
  environment:
    DATABASE_URL: postgresql://compras_user:compras_password@db:5432/compras_db
    #                                                          ^^
    #                              Aqui usa "db" (nome do serviço), não localhost!
    JWT_SECRET: compras_super_secret_key_2026
    PORT: 3000
    NODE_ENV: production
  depends_on:
    db:
      condition: service_healthy  # Só sobe DEPOIS que o db passar no healthcheck
```

> **Importante:** Dentro da rede Docker, os serviços se comunicam pelo **nome do serviço** (ex: `db`), não por `localhost`.

### Serviço `frontend` (React + Nginx)

```yaml
frontend:
  build:
    context: ./frontend
    args:
      VITE_API_URL: http://localhost:3000/api/v1
      # ↑ Passada durante o BUILD (não em runtime), pois o Vite
      # embute variáveis VITE_* no JavaScript estático.
  ports:
    - "5173:80"                   # Acesse em http://localhost:5173
  depends_on:
    - backend
```

> **Por que `http://localhost:3000`?** O React roda no **browser do usuário**, que acessa `localhost:3000` (porta exposta pelo Docker). Dentro do container Nginx ele não precisa falar com o backend diretamente.

### Volume `postgres_data`

```yaml
volumes:
  postgres_data:
```

Volume nomeado gerenciado pelo Docker. Os dados do banco persistem mesmo que o container seja removido (`docker compose down`). Para apagar tudo: `docker compose down -v`.

---

## Arquivo: `backend/Dockerfile`

Build em dois estágios (**multi-stage build**) para minimizar o tamanho da imagem final.

### Stage 1: `builder`

```dockerfile
FROM node:22-alpine AS builder
```

Ambiente completo para compilar a aplicação:

1. **Instala todas as dependências** (incluindo `devDependencies` como TypeScript, NestJS CLI)
2. **Gera o Prisma Client** — cria os binários nativos a partir do schema
3. **Compila o TypeScript** → gera a pasta `dist/`

```dockerfile
COPY prisma.config.ts ./    # Config do Prisma 7 (datasource URL, paths)
RUN npx prisma generate     # Gera typings e binários do cliente Prisma
RUN npm run build           # tsc via NestJS CLI → dist/
```

### Stage 2: `production`

```dockerfile
FROM node:22-alpine AS production
```

Imagem limpa com **apenas o necessário para rodar**:

```dockerfile
RUN npm ci --omit=dev       # Somente dependências de produção

# Copia apenas o que foi gerado/necessário do stage builder:
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/... ...
COPY --from=builder /app/node_modules/pg* ...

COPY prisma ./prisma         # Pasta com schema + migrations
COPY prisma.config.ts ./     # Necessário para o `prisma migrate deploy`
```

### Comando de inicialização

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && npx ts-node prisma/seed.ts && node dist/main"]
```

| Etapa | O que faz |
|---|---|
| `prisma migrate deploy` | Aplica todas as migrations pendentes (idempotente — não faz nada se já aplicadas) |
| `npx ts-node prisma/seed.ts` | Popula o banco com dados iniciais usando `upsert` — **seguro rodar sempre**, não duplica dados |
| `node dist/main` | Inicia a API NestJS compilada |

> **Por que ts-node está na imagem de produção?** O seed é escrito em TypeScript e o `ts-node` é necessário para executá-lo diretamente. Ele é copiado do stage `builder` para não precisar ser instalado via `npx` (o que exigiria interação do usuário).

> **Por que não usar `prisma migrate dev`?** O `migrate dev` é apenas para ambiente de desenvolvimento — ele pode criar migrations novas e resetar o banco. O `migrate deploy` é seguro para produção e só aplica o que já foi gerado.

---

## Arquivo: `frontend/Dockerfile`

### Stage 1: `builder` (Vite Build)

```dockerfile
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
```

O `ARG` recebe o valor passado pelo `docker-compose.yml` em tempo de build. O `ENV` o torna disponível como variável de ambiente durante o `npm run build`, onde o Vite o lê e **embute no JavaScript estático**.

```dockerfile
RUN npm run build           # Gera dist/ com todos os assets
```

### Stage 2: `production` (Nginx)

```dockerfile
FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
```

O Nginx serve os arquivos estáticos e resolve o problema de **roteamento SPA** (Single Page Application): qualquer rota inexistente no servidor devolve o `index.html`, deixando o React Router fazer o trabalho.

---

## Arquivo: `frontend/nginx.conf`

```nginx
location / {
    try_files $uri $uri/ /index.html;  # SPA fallback
}

location ~* \.(js|css|png|svg|ico|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";  # Cache agressivo para assets
}

gzip on;   # Compressão gzip para respostas menores
```

---

## Comandos do Dia a Dia

### Subir tudo (primeira vez ou após mudanças de código)

```bash
docker compose up --build
```

### Subir em background

```bash
docker compose up --build -d
```

### Ver logs em tempo real

```bash
# Todos os serviços
docker compose logs -f

# Apenas o backend
docker compose logs -f backend

# Apenas o banco
docker compose logs -f db
```

### Parar tudo (mantém dados do banco)

```bash
docker compose down
```

### Parar tudo E apagar dados do banco

```bash
docker compose down -v
```

### Rebuild apenas de um serviço

```bash
docker compose up --build backend -d
```

### Executar o seed no container do backend

```bash
docker compose exec backend npx ts-node prisma/seed.ts
```

### Acessar o banco via psql de dentro do container

```bash
docker compose exec db psql -U compras_user -d compras_db
```

---

## Portas Expostas

| Serviço | Porta no Host | Porta no Container | URL de Acesso |
|---|---|---|---|
| Frontend (Nginx) | `5173` | `80` | http://localhost:5173 |
| Backend (NestJS) | `3000` | `3000` | http://localhost:3000/api/v1 |
| Swagger Docs | `3000` | `3000` | http://localhost:3000/api/docs |
| PostgreSQL | `5433` | `5432` | `localhost:5433` (DBeaver, etc.) |

> A porta do banco é `5433` (e não `5432`) para evitar conflito caso você já tenha um PostgreSQL instalado localmente na máquina.

---

## Credenciais

### Banco de Dados

| Campo | Valor |
|---|---|
| Host (local) | `localhost` |
| Porta | `5433` |
| Usuário | `compras_user` |
| Senha | `compras_password` |
| Database | `compras_db` |

### Contas de Teste (após o seed)

| E-mail | Perfil | Senha |
|---|---|---|
| admin@empresa.com | SUPERADMIN | 123456 |
| aprovador@empresa.com | APROVADOR | 123456 |
| comprador@empresa.com | COMPRADOR | 123456 |
| requisitante@empresa.com | REQUISITANTE | 123456 |

---

## Solução de Problemas Comuns

### ❌ "Cannot connect to Docker daemon"

Docker Desktop não está aberto. Abra o aplicativo Docker Desktop e aguarde o ícone ficar verde.

### ❌ Backend fica em restart loop logo depois de subir

O banco ainda não está pronto quando o backend tenta conectar. O healthcheck deveria evitar isso, mas se acontecer:

```bash
docker compose down
docker compose up --build
```

### ❌ "Port 5433 already in use"

Algum processo está usando a porta. Encerre-o ou mude a porta no `docker-compose.yml`:
```yaml
ports:
  - "5434:5432"   # mude 5433 para 5434 (ou qualquer outra livre)
```
Atualize também o `backend/.env` para uso local.

### ❌ "database files are incompatible with server" (erro no DB)

O volume foi inicializado com uma versão diferente do PostgreSQL. Solução: apagar o volume e recriar.

```bash
docker compose down -v   # ⚠️ apaga todos os dados
docker compose up --build
```

### ❌ Frontend abre mas não consegue chamar a API (CORS ou connection refused)

Verifique se `VITE_API_URL` no `docker-compose.yml` está correto. Lembre-se: o valor deve ser acessível pelo **browser do usuário**, não pelo container.
