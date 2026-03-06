# 🗄️ Esquema de Banco de Dados (PostgreSQL) - Instância Única

## Visão Geral
O banco de dados foi modelado para uma implantação isolada (Single-Tenant). Ele atende a uma única empresa por instância, suportando controle de acesso baseado em papéis (RBAC) e um motor de workflows dinâmico.

## Tabelas Principais

### 1. system_settings (Configurações da Empresa/Template)
Tabela de linha única (Single Row) que guarda a identidade da implantação atual.
* `id` (INT, PK) - Fixo como 1.
* `company_name` (VARCHAR)
* `document` (VARCHAR) - CNPJ/CPF
* `theme_config` (JSONB) - Cores e logo para o React renderizar o White-Label.

### 2. departments (Setores)
* `id` (UUID, PK)
* `name` (VARCHAR) - Ex: TI, Obras, Diretoria
* `parent_id` (UUID, FK, Nullable) - Para hierarquia de departamentos.

### 3. roles (Papéis e Permissões)
* `id` (UUID, PK)
* `name` (VARCHAR) - SUPERADMIN, ADMIN, APPROVER, VIEWER, REQUESTER
* `permissions` (JSONB) - Matriz de acesso granular.

### 4. users (Usuários)
* `id` (UUID, PK)
* `department_id` (UUID, FK, Nullable)
* `role_id` (UUID, FK)
* `name`, `email`, `password_hash`
* `is_active` (BOOLEAN)

### 5. purchases (Pedidos de Compra)
* `id` (UUID, PK)
* `requester_id` (UUID, FK)
* `department_id` (UUID, FK)
* `total_amount` (DECIMAL)
* `status` (VARCHAR) - DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
* `current_step_id` (UUID, FK, Nullable)
* `metadata` (JSONB) - Campos flexíveis do nicho (ex: Placa, CRO).

### 6. purchase_items (Itens do Pedido)
* `id` (UUID, PK)
* `purchase_id` (UUID, FK)
* `description` (VARCHAR)
* `quantity` (DECIMAL)
* `unit_price` (DECIMAL)

### 7. approval_workflows (Regras de Esteira)
* `id` (UUID, PK)
* `department_id` (UUID, FK)
* `min_amount` (DECIMAL)

### 8. workflow_steps (Níveis da Esteira)
* `id` (UUID, PK)
* `workflow_id` (UUID, FK)
* `step_order` (INT)
* `approver_role_id` (UUID, FK, Nullable)
* `approver_user_id` (UUID, FK, Nullable)

### 9. purchase_approvals (Histórico/Logs)
* `id` (UUID, PK)
* `purchase_id` (UUID, FK)
* `step_id` (UUID, FK)
* `acted_by` (UUID, FK)
* `action` (VARCHAR) - APPROVED, REJECTED
* `comments` (TEXT)
* `acted_at` (TIMESTAMP)