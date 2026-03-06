# Compras Modular - B2B Procurement System

Este é o repositório do projeto **Compras Modular**, uma arquitetura de Monólito Modular (projetada para fácil transição para Microsserviços), rodando em modelo Single-Tenant. O sistema foi desenvolvido combinando robustez e tipagem do **Golang** no Backend e tematização dinâmica White-Label em **React/Vite** no Frontend.

## 🛠 Pré-requisitos
Para rodar este projeto em uma nova máquina, você precisa ter instalado:
- **Docker** e **Docker Compose** (Para o banco de dados PostgreSQL)
- **Go** (Versão 1.20+ recomendada)
- **Node.js** (Versão 18+ com npm)

---

## ⚙️ Configuração dos Ambientes (.env)
### para rodar local*

Por padrão de segurança, arquivos `.env` não devem ser comitados. Na sua nova máquina, crie os arquivos conforme abaixo:

### 1. Backend (`backend/.env`)
Crie o arquivo na pasta `backend/` com o seguinte conteúdo:
```env
DB_HOST=127.0.0.1
DB_USER=compras_user
DB_PASSWORD=compras_password
DB_NAME=compras_db
DB_PORT=5433

JWT_SECRET=compras_super_secret_key_2026
PORT=8080
```
> *Nota: Utilizamos a porta 5433 externamente no Docker para evitar conflito com qualquer PostgreSQL que você já tenha rodando na porta 5432 original da sua máquina local.*

### 2. Frontend (`frontend/.env`)
Crie o arquivo na pasta `frontend/` com o seguinte conteúdo:
```env
VITE_API_URL=http://localhost:8080/api/v1
```

---

## 🚀 Como Executar o Projeto

Abra 3 instâncias separadas no seu terminal (ou 3 abas).

### Terminal 1: Banco de Dados 🐘
Inicie o PostgreSQL isolado via Docker (na raiz do projeto):
```bash
docker-compose up db -d
```
*(Se no futuro quiser resetar o banco de dados totalmente, rode `docker-compose down -v` antes de subir)*

### Terminal 2: Backend e Carga Inicial (Seed) 🐹
Vá para a pasta do backend, instale as dependências (caso seja o primeiro uso), aplique a carga inicial com Mock Data e inicie o servidor da API.
```bash
cd backend
go mod tidy
go run cmd/seed/main.go
go run cmd/api/main.go
```
Você verá: `Starting server on :8080`

### Terminal 3: Frontend Web ⚛️
Vá para a pasta do frontend, instale os pacotes (apenas na primeira vez na máquina nova) e inicie o Vite Dev Server:
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Contas de Teste e Workflows
Acesse `http://localhost:5173` no seu navegador. As contas abaixo foram geradas pelo Seed (`main.go`) com a **senha padrão para todas elas: `123456`**

1. **`joao@empresa.com`** (Perfil: `REQUESTER`)
   - Papel de Solicitante (Departamento de TI).
   - Pode criar Pedidos de Compra (Drafts).
   - Pode "Enviar para Aprovação".

2. **`maria@empresa.com`** (Perfil: `APPROVER`)
   - Papel de Aprovadora 1 (Departamento de TI).
   - Só entra em cena depois que João envia o pedido.
   - Pode Aprovar a etapa dela ou Rejeitar com envio obrigatório de comentários.

3. **`admin@empresa.com`** (Perfil: `SUPERADMIN`)
   - Usuário onipotente para ações críticas do sistema.
   - O Mock de workflow de TI foi configurado para que, caso o valor escale demais (ou seja o passo 2), exija aprovação adicional deste Admin.

---

### 🎨 Motor White-Label Dinâmico
Você notará que a interface do painel web carrega imediatamente uma estética "Green" (Verde). Isso não está chumbado no código do React! Ao logar, observe a requisição de Rede: o banco de dados carrega as diretrizes estéticas nativas da empresa salva na tabela de configurações e projeta dinamicamente sobre o Tailwind V4 via CSS Variables, provando assim a eficácia como Software White-Label B2B!
