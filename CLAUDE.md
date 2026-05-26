# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 7 + TailwindCSS 4 + TanStack Query 5 |
| Backend | NestJS 11 + TypeScript |
| ORM / DB | Prisma 7 + `@prisma/adapter-pg` + PostgreSQL 16 |
| Auth | JWT (Passport) |
| Container | Docker + Docker Compose |

## Comandos de Desenvolvimento

### Backend (`cd backend`)
```bash
npm run start:dev        # Dev com hot reload — API em localhost:3000/api/v1
npm run build            # Compilar TypeScript para dist/
npm run test             # Testes unitários (Jest)
npm run lint             # ESLint

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
npm run lint             # ESLint
```

### Docker (raiz do projeto)
```bash
docker compose up db -d          # Só o banco (para dev local)
docker compose up --build        # Tudo em produção
docker compose logs -f backend   # Acompanhar logs do backend
docker compose down -v           # Parar e remover volumes
```

> O banco expõe a porta **5433** no host (mapeada para 5432 no container). Use `localhost:5433` em ferramentas externas como DBeaver.

### Swagger
Documentação da API disponível em `http://localhost:3000/api/docs` durante o dev.

### Variáveis de ambiente
**`backend/.env`**
```
DATABASE_URL="postgresql://compras_user:compras_password@localhost:5433/compras_db"
JWT_SECRET="compras_super_secret_key_2026"
PORT=3000
NODE_ENV=development
```
**`frontend/.env`**
```
VITE_API_URL=http://localhost:3000/api/v1
```

## Arquitetura do Backend

Padrão estrito: `Controller → Service → Repository → PrismaService`

- **Controllers**: apenas roteiam e extraem dados da request; zero lógica de negócio
- **Services**: toda lógica, validações e RBAC; incluem `buildPermissions()` para calcular ações permitidas por role
- **Repositories**: encapsulam todas as queries Prisma; services nunca chamam `this.prisma` diretamente
- **PrismaService** (`src/prisma/prisma.service.ts`): singleton global via `PrismaModule` (global: true)

### Auth & RBAC
- JWT gerado em `auth.service.ts`; payload: `{ sub, email, name, roleName, roleId, departments: string[] }`
- `JwtStrategy` injeta `{ id, email, roleName, roleId, departments }` como `request.user`
- `@CurrentUser()` decorator expõe esses dados nos controllers
- `@Roles(...)` decorator + `RolesGuard` controlam acesso por role
- Roles: `SUPERADMIN | ADMIN | APROVADOR | COMPRADOR | REQUISITANTE | VIEWER`

### Escopo de dados por role
Services como `purchases` e `departments` filtram dados em `findAll()` por role:
- `SUPERADMIN` / `ADMIN`: veem tudo
- Demais roles: veem apenas registros dos seus departamentos (`request.user.departments`)

### Módulos
| Módulo | Caminho | Responsabilidade |
|---|---|---|
| auth | `src/auth/` | Login + JWT + forgot/reset/change-password |
| users | `src/users/` | CRUD usuários + perfil; `admin-users.controller.ts` para operações admin |
| roles | `src/roles/` | Listagem de roles |
| departments | `src/departments/` | CRUD com hierarquia via `parentId` auto-referencial |
| suppliers | `src/suppliers/` | CRUD fornecedores + soft delete via `deletedAt` |
| categories | `src/categories/` | CRUD categorias hierárquicas de itens |
| purchases | `src/purchases/` | CRUD pedidos + engine de aprovação + notificações |
| workflows | `src/workflows/` | CRUD fluxos de aprovação por departamento |
| notifications | `src/notifications/` | Notificações por evento; `notify()` chamado dentro das transações |
| dashboard | `src/dashboard/` | Métricas agregadas (sem repository — queries diretas no service) |
| settings | `src/settings/` | Config do sistema + endpoint público `/settings/theme` |
| prisma | `src/prisma/` | PrismaService global |

## Fluxo de Aprovação (Engine de Compras)

```
DRAFT
  ↓ submit() — purchaseType = DIRECT
PENDING_APPROVAL
  ↓ approve() — percorre WorkflowSteps em ordem
[Etapa 1 → Etapa 2 → ... → Etapa Final]
  ↓ quando finalAction = BUYER_CLOSE
PENDING_CLOSING
  ↓ close()
COMPLETED
              ↘ REJECTED (qualquer etapa pode rejeitar)

DRAFT
  ↓ submit() — purchaseType = QUOTE
AWAITING_QUOTES
  ↓ COMPRADOR/ADMIN submetem cotações via POST /purchases/:id/quotes
  ↓ solicitante/admin seleciona vencedora via POST /purchases/:id/quotes/:quoteId/select
PENDING_APPROVAL → ... → COMPLETED
```

- `Purchase.purchaseType`: `DIRECT` (fornecedor já definido, fluxo padrão) | `QUOTE` (solicitar cotações)
- `Quote`: proposta submetida por compradores; `isSelected` marca a vencedora; seleção vincula `supplierId`/`totalAmount` ao pedido e avança para `PENDING_APPROVAL`
- `WorkflowStep` pode ser direcionado a uma **role** ou a um **usuário específico**
- `ApprovalWorkflow` versiona fluxos via `previousWorkflowId`
- `PurchaseApproval` é o log imutável de cada ação de aprovação

## Arquitetura do Frontend

### Organização de código
- **`src/pages/`**: páginas ligadas diretamente às rotas (CRUD simples)
- **`src/features/`**: módulos complexos com subpastas `api/`, `components/`, `types/` — atualmente `dashboard` e `settings`
- **`src/components/`**: componentes reutilizáveis (layout, UI, tabelas)
- **`src/contexts/`**: `AuthContext` (estado de auth) e `ThemeContext` (tema do sistema)
- **`src/services/api.ts`**: instância Axios central com interceptores
- **`src/utils/pagination.ts`**: `normalizeListResponse()` — normaliza respostas paginadas e arrays simples

### Auth e API
- `AuthContext`: token em `localStorage`; `user` derivado do decode do JWT (sem chamada extra ao backend)
- `api.ts` request interceptor: adiciona `Authorization: Bearer <token>`
- `api.ts` response interceptor: redireciona para `/login` no 401
- `ThemeContext`: busca `/settings/theme` (público) na inicialização; `Layout` bloqueia render enquanto carrega

### Convenções de Query Params
O backend espera params em **camelCase**: `perPage`, `sortBy`, `sortOrder`, `departmentId`.
Não usar snake_case — são ignorados silenciosamente.

### Shape das Respostas de Lista
```ts
{ data: T[], meta: { page, per_page, total, total_pages } }
```
Usar `normalizeListResponse()` de `utils/pagination.ts` para tratar tanto arrays simples quanto objetos paginados.

## Banco de Dados — Principais Tabelas

| Tabela | Descrição |
|---|---|
| roles | Papéis do sistema |
| users | Usuários (`isActive` para soft disable) |
| user_departments | Vínculo N:N usuário-departamento |
| departments | Departamentos hierárquicos (`parentId` auto-referencial) |
| suppliers | Fornecedores (`isActive` + `deletedAt` para soft delete) |
| categories | Categorias de itens hierárquicas (`parentId` auto-referencial) |
| purchases | Pedidos de compra |
| purchase_items | Itens dos pedidos (com `categoryId` opcional) |
| purchase_approvals | Log imutável de ações de aprovação |
| approval_workflows | Fluxos por departamento (`previousWorkflowId` para versionamento) |
| workflow_steps | Etapas dos fluxos (por role ou usuário específico, ordenadas) |
| workflow_buyers | Compradores N:N por fluxo |
| password_reset_tokens | Tokens de reset de senha (SHA-256, expiram em 1h, uso único) |
| notifications | Notificações por usuário com suporte a `readAt` |
| quotes | Cotações de fornecedores para pedidos `AWAITING_QUOTES`; `isSelected` marca vencedora |
| system_settings | Configurações globais + tema (JSON) |

## Contas de Teste

Senha padrão: `123456`

| E-mail | Role |
|---|---|
| admin@empresa.com | SUPERADMIN | senha: Teste123
| aprovador@empresa.com | APROVADOR |
| comprador@empresa.com | COMPRADOR |
| requisitante@empresa.com | REQUISITANTE |
