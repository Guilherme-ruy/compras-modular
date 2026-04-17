# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + TailwindCSS + React Query |
| Backend | NestJS + TypeScript |
| ORM / DB | Prisma 7 + PostgreSQL 16 |
| Auth | JWT (Passport) |
| Container | Docker + Docker Compose |

## Comandos de Desenvolvimento

### Backend (`cd backend`)
```bash
npm run start:dev        # Dev com hot reload — API em localhost:3000/api/v1
npm run build            # Compilar TypeScript
npm run test             # Testes unitários

# Banco
npx prisma migrate dev   # Criar e aplicar migration de dev
npx prisma generate      # Regenerar Prisma Client após mudanças no schema
npm run db:seed          # Popular banco com dados de seed
npm run db:reset         # Resetar banco + recriar schema + seed
npm run db:migrate       # Aplicar migrations (produção)
```

### Frontend (`cd frontend`)
```bash
npm run dev              # Dev em localhost:5173
npm run build            # Build de produção
```

### Docker (raiz do projeto)
```bash
docker compose up db -d          # Só o banco (para dev local)
docker compose up --build        # Tudo em produção
docker compose logs -f backend   # Acompanhar logs do backend
docker compose down -v           # Parar e remover volumes
```

### Variáveis de ambiente
- `backend/.env` — `DATABASE_URL`, `JWT_SECRET`, `PORT=3000`, `NODE_ENV`
- `frontend/.env` — `VITE_API_URL=http://localhost:3000/api/v1`

## Arquitetura do Backend

Padrão estrito: `Controller → Service → Repository → PrismaService`

- **Controllers** (`src/*/NAME.controller.ts`): apenas roteiam, sem lógica de negócio
- **Services** (`src/*/NAME.service.ts`): toda lógica + validações + RBAC
- **Repositories** (`src/*/NAME.repository.ts`): encapsulam todas as queries Prisma
- **PrismaService** (`src/prisma/prisma.service.ts`): singleton global, injetado em todos os módulos

### Auth & RBAC
- JWT gerado em `auth.service.ts`; payload: `{ sub, email, name, roleName, roleId }`
- `JwtStrategy` (`auth/jwt.strategy.ts`) injeta `{ id, email, roleName, roleId }` como `request.user`
- `@CurrentUser()` decorator expõe esses dados nos controllers
- `@Roles(...)` decorator + `RolesGuard` controlam acesso por role
- Roles do sistema: `SUPERADMIN | ADMIN | APROVADOR | COMPRADOR | REQUISITANTE | VIEWER`

### Módulos
| Módulo | Caminho | Responsabilidade |
|---|---|---|
| auth | `src/auth/` | Login + JWT |
| users | `src/users/` | CRUD usuários + perfil |
| roles | `src/roles/` | Listagem de roles |
| departments | `src/departments/` | CRUD departamentos hierárquicos |
| suppliers | `src/suppliers/` | CRUD fornecedores + soft delete |
| purchases | `src/purchases/` | CRUD pedidos + engine de aprovação |
| workflows | `src/workflows/` | CRUD fluxos de aprovação |
| dashboard | `src/dashboard/` | Métricas agregadas |
| settings | `src/settings/` | Config do sistema + tema público |
| prisma | `src/prisma/` | PrismaService global |

### Fluxo de Aprovação
```
DRAFT → PENDING_APPROVAL → [etapas do workflow] → PENDING_CLOSING → COMPLETED
                                                ↘ REJECTED
```

## Arquitetura do Frontend

- **Roteamento**: `App.tsx` — rotas sob `/app/*` protegidas por `PrivateRoute` (checa `isAuthenticated`)
- **Auth**: `AuthContext` (`contexts/AuthContext.tsx`) — token em `localStorage`, user derivado do JWT
- **API**: `services/api.ts` — axios com interceptor de JWT e redirect automático no 401
- **Theme**: `ThemeContext` busca `/settings/theme` (público) na inicialização; `Layout` bloqueia render enquanto carrega
- **Features lazy**: `Dashboard` e `Settings` são lazy-loaded com `SuspenseLoader`

### Convenções de Query Params
O backend NestJS espera params em **camelCase**: `perPage`, `sortBy`, `sortOrder`, `departmentId`.
Não usar snake_case (`per_page`, `sort_by`) — são ignorados silenciosamente.

### Shape das Respostas de Lista
Respostas paginadas seguem: `{ data: T[], meta: { page, per_page, total, total_pages } }`.
O utilitário `utils/pagination.ts` (`normalizeListResponse`) trata tanto arrays simples quanto objetos paginados.

## Banco de Dados — Principais Tabelas

| Tabela | Descrição |
|---|---|
| roles | Papéis do sistema |
| users | Usuários (com `isActive` para soft disable) |
| user_departments | Vínculo N:N usuário-departamento |
| departments | Departamentos hierárquicos |
| suppliers | Fornecedores (com `isActive` para soft delete) |
| purchases | Pedidos de compra |
| purchase_items | Itens dos pedidos |
| purchase_approvals | Log de ações de aprovação |
| approval_workflows | Fluxos de aprovação por departamento |
| workflow_steps | Etapas dos fluxos |
| workflow_buyers | Compradores N:N por fluxo |
| system_settings | Configurações globais + tema |

## Contas de Teste

Senha padrão: `123456`

| E-mail | Role |
|---|---|
| admin@empresa.com | SUPERADMIN |
| aprovador@empresa.com | APROVADOR |
| comprador@empresa.com | COMPRADOR |
| requisitante@empresa.com | REQUISITANTE |
