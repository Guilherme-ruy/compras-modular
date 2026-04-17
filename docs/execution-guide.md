# 🚀 Guia de Execução — Compras Modular

Este documento descreve as duas formas principais de rodar o sistema: **Desenvolvimento** (foco em agilidade e alterações em tempo real) e **Produção** (foco em estabilidade e isolamento).

---

## 🛠️ 1. Modo Desenvolvimento (Local)
Este é o modo ideal para programar. O banco de dados roda em Docker, mas o Backend e o Frontend rodam nativamente na sua máquina, permitindo **Hot Reload** (alterações de código são aplicadas instantaneamente).

### Pré-requisitos
- Node.js (v20 ou superior)
- Docker Desktop (apenas para o banco)

### Passo a Passo

1.  **Subir o Banco de Dados:**
    ```bash
    docker compose up db -d
    ```

2.  **Configurar o Backend:**
    ```bash
    cd backend
    npm install
    # Sincronizar banco e gerar cliente
    npx prisma generate
    npx prisma migrate dev
    # Popular dados (opcional)
    npm run db:seed
    # Iniciar
    npm run start:dev
    ```
    *Acesse a API em: http://localhost:3000/api/v1*
    *Swagger Docs em: http://localhost:3000/api/docs*

3.  **Configurar o Frontend:**
    Abra um novo terminal:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *Acesse o App em: http://localhost:5173*

---

## 🏗️ 2. Modo Produção (Docker Full)
Este modo simula o ambiente real de deploy. Tudo (Banco, API e Frontend com Nginx) roda dentro de containers isolados. **Não** recomendado para desenvolvimento ativo pois o build é mais lento.

### Pré-requisitos
- Docker Desktop

### Passo a Passo

1.  **Rodar o comando único:**
    ```bash
    docker compose up --build
    ```
    *O Docker irá compilar o TypeScript, gerar os assets do React e configurar o servidor Nginx automaticamente.*

2.  **Acessar os serviços:**
    - **Frontend:** http://localhost:5173
    - **API:** http://localhost:3000/api/v1

---

## 📋 Comandos Úteis

| Objetivo | Comando | Pasta |
| :--- | :--- | :--- |
| **Resetar Banco** | `npm run db:reset` | `/backend` |
| **Rodar Seed** | `npm run db:seed` | `/backend` |
| **Ver Logs Docker** | `docker compose logs -f` | Raiz |
| **Parar Tudo** | `docker compose down` | Raiz |
| **Limpar Volumes** | `docker compose down -v` | Raiz |

---

## 🔑 Contas de Teste (Padrão)
| E-mail | Role | Senha |
| :--- | :--- | :--- |
| `admin@empresa.com` | SUPERADMIN | `123456` |
| `aprovador@empresa.com` | APROVADOR | `123456` |
| `comprador@empresa.com` | COMPRADOR | `123456` |
| `requisitante@empresa.com` | REQUISITANTE | `123456` |
