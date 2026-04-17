# Progresso — Compras Modular

> Arquivo de rastreamento de tarefas e contexto entre sessões.
> Atualizado em: 15/04/2026

---

## ✅ Concluído

- Migração completa Go → NestJS + Prisma
- Backend NestJS 100% estruturado (auth, users, roles, departments, suppliers, purchases, workflows, dashboard, settings)
- Schema Prisma + migration inicial `20260415010315_init`
- Seed idempotente (upsert): 6 roles, 2 deps, 4 usuários, 1 workflow TI
- Tabela `WorkflowBuyer` normalizada
- Docker Compose com 3 serviços (db, backend, frontend)
- Documentação: README.md, docs/execution-guide.md

---

## 🐛 Bugs Identificados e Corrigidos (15/04/2026)

### [CRÍTICO] ✅ Dashboard — shape da API não bate com o frontend
- **Problema**: `dashboard.service.ts` retornava `{ totalPurchases, byStatus, recentPurchases }`, mas o frontend espera `{ pending_purchases_count, total_approved_amount, purchases_this_month, rejected_this_month, spend_by_department }`. Isso causava `TypeError: Cannot read properties of undefined (reading 'toString')` no `useSuspenseQuery`, que subia pro ErrorBoundary e bloqueava a rota `/app/dashboard`.
- **Correção**: Reescrito `dashboard.service.ts` para retornar o shape exato que o frontend consome.

### [MENOR] ✅ Dashboard — query params snake_case vs camelCase
- **Problema**: Frontend enviava `per_page`, `sort_by`, `sort_order` (snake_case) mas backend espera `perPage`, `sortBy`, `sortOrder` (camelCase). Params eram ignorados.
- **Correção**: Atualizado `Dashboard.tsx` para usar params camelCase na query de pedidos pendentes.

### [MENOR] ✅ Sidebar — rotas admin visíveis apenas para SUPERADMIN
- **Problema**: ADMIN não via workflows/users/departments. Sidebar só verifica `roleName === 'SUPERADMIN'`.
- **Correção**: Adicionado ADMIN ao critério de visibilidade das rotas administrativas.

---

## 🚧 Pendente

### ~~Docker — seed ainda com problema~~ ✅ RESOLVIDO (15/04/2026)
- **Problema 1**: `ts-node` não instalado em produção → `prisma.config.ts` não carregava
  - Solução: criado `prisma.config.mjs` (ESM nativo, sem ts-node); produção usa `.mjs`, dev usa `.ts`
- **Problema 2**: `node dist/main` — NestJS compila para `dist/src/main.js` (não `dist/main.js`)
  - Solução: CMD corrigido para `node dist/src/main`; `start:prod` no package.json também corrigido
- Stack Docker **100% funcional**: migrate → seed → API

### Roles — aguardando confirmação do usuário
- Usuário mencionou querer modificar as roles, mas ainda não definiu quais mudanças
- Roles atuais: `SUPERADMIN | ADMIN | APROVADOR | COMPRADOR | REQUISITANTE | VIEWER`
- Impactos: seed.ts, guards `@Roles(...)`, lógica RBAC em purchases.service.ts
- **Pendência**: perguntar ao usuário antes de qualquer alteração

### Frontend — integração com nova API (revisão geral)
- Verificar todos os endpoints e shapes de response em cada página
- Checar se há outros params snake_case sendo enviados para endpoints que esperam camelCase

### JWT — departments ausentes no payload
- `auth.service.ts` não inclui `departments` no JWT
- Frontend lê `decoded.departments` → array vazio
- Avaliar se isso impacta scoping de pedidos por departamento no frontend

---

## 🔑 Referência Rápida

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api/v1 |
| Swagger | http://localhost:3000/api/docs |
| PostgreSQL | localhost:5433 / compras_user / compras_password / compras_db |

**Contas de teste (senha: 123456):**
- `admin@empresa.com` → SUPERADMIN
- `aprovador@empresa.com` → APROVADOR
- `comprador@empresa.com` → COMPRADOR
- `requisitante@empresa.com` → REQUISITANTE
