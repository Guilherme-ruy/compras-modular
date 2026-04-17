# Compras Modular

Sistema de gestão de pedidos de compras com fluxo de aprovação configurável.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + TailwindCSS |
| Backend | NestJS + TypeScript |
| ORM / DB | Prisma 7 + PostgreSQL 16 |
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
│       ├── auth/
│       ├── users/
│       ├── roles/
│       ├── departments/
│       ├── suppliers/
│       ├── purchases/
│       ├── workflows/
│       ├── dashboard/
│       ├── settings/
│       └── prisma/        # PrismaService (global)
├── frontend/             # React + Vite
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── SKILLS/               # Guidelines de desenvolvimento
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

### 2. Inicializar o banco

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

### 3. Iniciar o backend

```bash
npm run start:dev
# API: http://localhost:3000/api/v1
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
npm run db:migrate    # Aplicar migrations (produção)
npm run db:reset      # Resetar banco + recriar schema
npm run db:seed       # Recriar dados de seed
npm run db:generate   # Regenerar Prisma Client
npm run build         # Build TypeScript
npm run start:dev     # Dev com hot reload
npm run test          # Testes unitários
```

---

## Contas de Teste

| E-mail | Perfil | Departamento | Senha |
|---|---|---|---|
| admin@empresa.com | SUPERADMIN | Administração | 123456 |
| aprovador@empresa.com | APROVADOR | TI | 123456 |
| comprador@empresa.com | COMPRADOR | TI | 123456 |
| requisitante@empresa.com | REQUISITANTE | TI | 123456 |

---

## Módulos e Endpoints

### Auth
| Método | Endpoint | Descrição |
|---|---|---|
| POST | /auth/login | Login + token JWT |

### Users
| Método | Endpoint | Acesso |
|---|---|---|
| GET | /users | SUPERADMIN |
| POST | /users | SUPERADMIN |
| PUT | /users/profile | Autenticado |
| GET | /admin/users/:id | SUPERADMIN |
| PUT | /admin/users/:id | SUPERADMIN |
| POST | /admin/users/:id/impact | SUPERADMIN |

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

Seguindo as guidelines em `SKILLS/backend-dev-guidelines.md`:

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
DRAFT → PENDING_APPROVAL → [etapas] → PENDING_CLOSING → COMPLETED
                                    ↘ REJECTED
```

1. Solicitante cria o pedido (DRAFT)
2. Submete para aprovação → vai para a 1ª etapa
3. Aprovadores aprovam em sequência
4. Após última etapa:
   - `BUYER_CLOSE`: aguarda comprador fechar → PENDING_CLOSING → COMPLETED
   - `AUTO_APPROVE`: completa automaticamente → COMPLETED
5. Comprador pode anexar documentos pós-fechamento

---

## Banco de Dados — Principais Tabelas

| Tabela | Descrição |
|---|---|
| roles | Papéis do sistema |
| users | Usuários |
| user_departments | Vínculo N:N usuário-departamento |
| departments | Departamentos hierárquicos |
| suppliers | Fornecedores (com soft delete) |
| purchases | Pedidos de compra |
| purchase_items | Itens dos pedidos |
| purchase_approvals | Log de ações de aprovação |
| approval_workflows | Fluxos de aprovação por departamento |
| workflow_steps | Etapas dos fluxos |
| workflow_buyers | Compradores N:N por fluxo (normalizado) |
| system_settings | Configurações globais + tema |