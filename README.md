# Compras Modular

Sistema de gestão de pedidos de compras com fluxo de aprovação configurável, categorias de itens, notificações em tempo real e redefinição de senha.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 7 + TailwindCSS 4 + TanStack Query 5 |
| Backend | NestJS 11 + TypeScript |
| ORM / DB | Prisma 7 + `@prisma/adapter-pg` + PostgreSQL 16 |
| Auth | JWT (Passport) |
| Container | Docker + Docker Compose |

---

## Estrutura do Projeto

```
compras-modular/
├── backend/              # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   └── src/
│       ├── auth/           # Login + JWT + reset/change password
│       ├── users/
│       ├── roles/
│       ├── departments/
│       ├── suppliers/
│       ├── purchases/      # Engine de aprovação
│       ├── workflows/
│       ├── categories/     # Categorias hierárquicas de itens
│       ├── notifications/  # Notificações em tempo real (polling)
│       ├── dashboard/
│       ├── settings/
│       └── prisma/         # PrismaService (global)
├── frontend/             # React + Vite
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── ROADMAP.md            # Iniciativas de desenvolvimento priorizadas
```

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://compras_user:compras_password@localhost:5433/compras_db"
JWT_SECRET="compras_super_secret_key_2026"
PORT=3000
NODE_ENV=development
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## Rodando Localmente (sem Docker)

### 1. Subir o banco de dados

```bash
docker compose up db -d
```

> O banco expõe a porta **5433** no host (mapeada para 5432 no container).

### 2. Inicializar o banco

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
```

### 3. Iniciar o backend

```bash
npm run start:dev
# API:     http://localhost:3000/api/v1
# Swagger: http://localhost:3000/api/docs
```

### 4. Iniciar o frontend

```bash
cd ../frontend
npm install
npm run dev
# App: http://localhost:5173
```

---

## Rodando com Docker (Produção)

```bash
docker compose up --build
```

| Serviço | URL |
|---|---|
| API | http://localhost:3000/api/v1 |
| Frontend | http://localhost:5173 |
| Swagger | http://localhost:3000/api/docs |

---

## Comandos Úteis

```bash
# Backend — dentro de /backend
npm run start:dev         # Dev com hot reload
npm run build             # Build TypeScript para dist/
npm run test              # Testes unitários (Jest)
npm run lint              # ESLint

npx prisma migrate dev    # Criar e aplicar migration de dev
npx prisma db seed        # Recriar dados de seed
npx prisma generate       # Regenerar Prisma Client após alterar schema
npx prisma studio         # Visualizar banco no browser
```

---

## Contas de Teste

| E-mail | Perfil | Departamento | Senha |
|---|---|---|---|
| admin@empresa.com | SUPERADMIN | Administração | Teste123 |
| aprovador@empresa.com | APROVADOR | TI | 123456 |
| comprador@empresa.com | COMPRADOR | TI | 123456 |
| requisitante@empresa.com | REQUISITANTE | TI | 123456 |

> **Nota:** A senha do admin foi alterada durante os testes. Use `Teste123`.

---

## Módulos e Endpoints

### Auth
| Método | Endpoint | Descrição |
|---|---|---|
| POST | /auth/login | Login + token JWT |
| POST | /auth/forgot-password | Solicitar link de reset (sempre 200) |
| POST | /auth/reset-password | Redefinir senha via token |
| POST | /auth/change-password | Trocar senha (autenticado) |

### Users
| Método | Endpoint | Acesso |
|---|---|---|
| GET | /users | SUPERADMIN |
| POST | /users | SUPERADMIN |
| PUT | /users/profile | Autenticado |
| GET | /admin/users/:id | SUPERADMIN |
| PUT | /admin/users/:id | SUPERADMIN |

### Departments
| Método | Endpoint | Acesso |
|---|---|---|
| GET | /departments | Autenticado |
| GET | /departments/:id | SUPERADMIN |
| POST | /departments | SUPERADMIN |
| PUT | /departments/:id | SUPERADMIN |

### Suppliers
| Método | Endpoint | Acesso |
|---|---|---|
| GET | /suppliers | Autenticado |
| GET | /suppliers/:id | Autenticado |
| POST | /suppliers | Autenticado |
| PUT | /suppliers/:id | Autenticado |
| PATCH | /suppliers/:id/status | Autenticado |
| DELETE | /suppliers/:id | Autenticado |

### Categories
| Método | Endpoint | Acesso |
|---|---|---|
| GET | /categories | Autenticado |
| GET | /categories/tree | Autenticado |
| GET | /categories/:id | Autenticado |
| POST | /categories | ADMIN+ |
| PUT | /categories/:id | ADMIN+ |
| PATCH | /categories/:id/status | ADMIN+ |

### Purchases
| Método | Endpoint | Acesso |
|---|---|---|
| GET | /purchases | Autenticado (scoped) |
| GET | /purchases/:id | Autenticado (scoped) |
| POST | /purchases | Autenticado |
| PUT | /purchases/:id | Solicitante |
| POST | /purchases/:id/submit | Autenticado |
| POST | /purchases/:id/approve | APROVADOR |
| POST | /purchases/:id/reject | APROVADOR |
| POST | /purchases/:id/close | COMPRADOR/Solicitante |
| POST | /purchases/:id/post-close-documents | COMPRADOR |

### Notifications
| Método | Endpoint | Acesso |
|---|---|---|
| GET | /notifications | Autenticado |
| GET | /notifications/unread-count | Autenticado |
| PATCH | /notifications/:id/read | Autenticado |
| PATCH | /notifications/read-all | Autenticado |

### Workflows
| Método | Endpoint | Acesso |
|---|---|---|
| GET | /workflows | Autenticado |
| POST | /workflows | SUPERADMIN |
| PUT | /workflows/:id | SUPERADMIN |
| DELETE | /workflows/:id | SUPERADMIN |

### Settings
| Método | Endpoint | Acesso |
|---|---|---|
| GET | /settings/theme | Público |
| GET | /settings | SUPERADMIN |
| PUT | /settings | SUPERADMIN |

### Dashboard
| Método | Endpoint | Acesso |
|---|---|---|
| GET | /dashboard/metrics | Autenticado |

---

## Arquitetura do Backend

```
Controller → Service → Repository → PrismaService
```

- **Controllers**: apenas roteiam, sem lógica de negócio
- **Services**: toda a lógica de negócio + validações + RBAC
- **Repositories**: encapsulam todas as queries Prisma
- **PrismaService**: singleton global injetado em todos os módulos

---

## Fluxo de Aprovação

```
DRAFT
  ↓ submit() — notifica aprovadores da etapa 1
PENDING_APPROVAL
  ↓ approve() — percorre WorkflowSteps em ordem
[Etapa 1 → Etapa 2 → ... → Etapa Final]
  ↓ quando finalAction = BUYER_CLOSE
PENDING_CLOSING   — notifica solicitante + compradores
  ↓ close()
COMPLETED         — notifica solicitante
              ↘ REJECTED (qualquer etapa) — notifica solicitante
```

Cada transição gera notificações automáticas para os usuários afetados.

---

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
| password_reset_tokens | Tokens de redefinição de senha (SHA-256, expiram em 1h) |
| notifications | Notificações por usuário com suporte a `readAt` |
| system_settings | Configurações globais + tema (JSON) |