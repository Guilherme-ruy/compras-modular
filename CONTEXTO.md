# 📋 Contexto da Sessão — Compras Modular

> **Para o assistente:** Ao ser acionado com este documento, leia tudo, confirme que entendeu o estado atual e **pergunte ao usuário quais serão as mudanças nas roles** antes de prosseguir com qualquer coisa.

---

## 🗓️ Última sessão: 14/04/2026

---

## ✅ O que foi feito (concluído)

### Migração completa Go → NestJS + Prisma
- Backend Go **removido** e substituído por **NestJS + TypeScript**
- ORM migrado para **Prisma 7** com PostgreSQL 16
- Pasta `backend-nest/` renomeada para `backend/`

### Backend NestJS — 100% funcional localmente
Todos os módulos implementados com arquitetura **Controller → Service → Repository → PrismaService**:
- `auth` — login JWT
- `users` — CRUD + perfil
- `roles` — listagem
- `departments` — CRUD hierárquico
- `suppliers` — CRUD + soft delete
- `purchases` — CRUD + engine de aprovação (submit/approve/reject/close)
- `workflows` — CRUD + versioning
- `dashboard` — métricas agrupadas
- `settings` — config + tema público
- `prisma` — PrismaService global com `@prisma/adapter-pg`

### Schema do banco
- Migration inicial criada: `20260415010315_init`
- Seed com upsert (idempotente): 6 roles, 2 departamentos, 4 usuários, 1 workflow TI
- Tabela `WorkflowBuyer` normalizada (substituiu array JSON `buyerUserIds`)

### Infraestrutura Docker
- `docker-compose.yml` — 3 serviços: `db`, `backend`, `frontend`
- `backend/Dockerfile` — multi-stage build
- `frontend/Dockerfile` — Vite build + Nginx
- `frontend/nginx.conf` — SPA fallback + cache + gzip
- `.gitignore` — limpo (removidas entradas do Go)

### Documentação criada
- `README.md` — guia geral atualizado
- `docs/docker-guide.md` — documentação completa de Docker

---

## 🚧 Onde parou (pendente)

### ❌ Docker build do seed ainda com problema
O `CMD` do `backend/Dockerfile` tenta rodar o seed em produção, mas foi encontrado um problema com o caminho do `ts-node` no container.

**Última tentativa:** compilar o `prisma/seed.ts` para JS durante o build stage com `tsc` direto e rodar como `node dist/prisma/seed.js`.

**O Dockerfile atual (última versão, ainda não testada):**
```dockerfile
# No stage builder — compila o seed para JS
RUN node_modules/.bin/tsc prisma/seed.ts \
    --esModuleInterop true \
    --module commonjs \
    --target es2020 \
    --moduleResolution node \
    --resolveJsonModule true \
    --skipLibCheck true \
    --outDir dist/prisma

# No CMD do production stage
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js && node dist/main"]
```

**Próximo passo imediato:** testar esse rebuild e verificar os logs do container backend.

```bash
docker compose down
docker compose up --build -d
docker compose logs -f backend
```

---

## 🔧 Pendências planejadas

### 1. Roles — AGUARDANDO CONFIRMAÇÃO DO USUÁRIO
> ⚠️ O usuário informou que quer **modificar as roles** do sistema, mas ainda não definiu quais serão as mudanças.
>
> **Ao retomar: perguntar ao usuário quais serão as novas roles antes de qualquer alteração.**

As roles atuais no seed são:
```
SUPERADMIN | ADMIN | APROVADOR | COMPRADOR | REQUISITANTE | VIEWER
```

Possíveis impactos de mudança:
- `prisma/seed.ts` — lista de roles no seed
- `src/auth/auth.guard.ts` — guards com `@Roles(...)`
- `src/*/controllers` — decorators `@Roles(...)` em cada endpoint
- `src/purchases/purchases.service.ts` — lógica de RBAC inline

### 2. Frontend — não verificado
O frontend React/Vite **não foi ajustado** para a nova API (`/api/v1/...`). Endpoints, autenticação, e integração devem ser revisados.

### 3. Seed no Docker — finalizar
Confirmar que o seed roda corretamente dentro do container após o rebuild descrito acima.

---

## 📁 Estrutura atual do projeto

```
compras-modular/
├── backend/              # NestJS + Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   ├── migrations/
│   │   └── prisma.config.ts (raiz do backend)
│   └── src/
│       ├── auth/ | users/ | roles/ | departments/
│       ├── suppliers/ | purchases/ | workflows/
│       ├── dashboard/ | settings/ | prisma/
│       └── main.ts | app.module.ts
├── frontend/             # React + Vite + Nginx
│   ├── nginx.conf
│   ├── Dockerfile
│   └── .env
├── docs/
│   └── docker-guide.md
├── SKILLS/               # Guidelines de dev
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🔑 Credenciais e Portas

| Serviço | URL / Conexão |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api/v1 |
| Swagger | http://localhost:3000/api/docs |
| PostgreSQL | localhost:5433 / user: compras_user / pass: compras_password / db: compras_db |

**Contas de teste (senha: `123456`):**
- `admin@empresa.com` → SUPERADMIN
- `aprovador@empresa.com` → APROVADOR
- `comprador@empresa.com` → COMPRADOR
- `requisitante@empresa.com` → REQUISITANTE
