# ROADMAP — Compras Modular

Iniciativas priorizadas para tornar o sistema utilizável no dia-a-dia de uma empresa.  
Cada item descreve o que muda no banco, no backend e no frontend.

## Status das Iniciativas

| # | Iniciativa | Status |
|---|---|---|
| 6 | Categorias de Itens | ✅ Concluída |
| 2 | Redefinição de Senha | ✅ Concluída |
| 1 | Notificações | ✅ Concluída |
| 3 | Armazenamento de Arquivos (MinIO) | ⬜ Pendente |
| 4 | Exportação PDF e Excel | ⬜ Pendente |
| 5 | Multi-Cotação | ⬜ Pendente |

---

## Iniciativa 1 — Notificações

### Problema
Aprovadores não sabem que têm pedidos esperando. O fluxo de aprovação depende de comunicação manual fora do sistema.

### O que disparar notificação

| Evento | Quem recebe |
|---|---|
| Pedido submetido | Aprovador da etapa 1 |
| Etapa aprovada (e há próxima) | Aprovador da próxima etapa |
| Pedido aprovado (etapa final) | Solicitante + Compradores do fluxo |
| Pedido rejeitado | Solicitante |
| Pedido movido para `PENDING_CLOSING` | Compradores do fluxo |
| Pedido concluído | Solicitante |
| Cotação recebida (iniciativa 5) | Solicitante |

### Banco de dados

```prisma
model Notification {
  id         String    @id @default(uuid()) @db.Uuid
  userId     String    @map("user_id") @db.Uuid
  type       String    @db.VarChar(50)
  // tipos: PURCHASE_SUBMITTED | PURCHASE_APPROVED_STEP | PURCHASE_APPROVED_FINAL
  //        PURCHASE_REJECTED | PURCHASE_PENDING_CLOSING | PURCHASE_COMPLETED
  //        QUOTE_RECEIVED
  title      String    @db.VarChar(255)
  body       String
  purchaseId String?   @map("purchase_id") @db.Uuid
  readAt     DateTime? @map("read_at")
  createdAt  DateTime  @default(now()) @map("created_at")

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  purchase Purchase? @relation(fields: [purchaseId], references: [id], onDelete: SetNull)

  @@index([userId, readAt])
  @@map("notifications")
}
```

Adicionar relação em `User` e `Purchase` no schema.

### Backend — módulo `notifications`

```
src/notifications/
  notifications.module.ts
  notifications.service.ts       ← createForUser(), markRead(), findByUser()
  notifications.repository.ts
  notifications.controller.ts    ← GET /notifications, PATCH /notifications/:id/read
                                    PATCH /notifications/read-all
```

`NotificationsService.createForUser()` é chamado **dentro das transações** existentes em `PurchasesService` (submit, approve, reject, close). Não cria módulo de eventos separado por ora — chamada direta é mais simples e menos sujeita a falha silenciosa.

**Email** (opcional, ativável por variável de ambiente):
- Instalar `@nestjs-modules/mailer` + `nodemailer`
- Template HTML simples por tipo de evento
- Envio em `try/catch` que não bloqueia a transação principal — falha de email não derruba a ação

```env
# backend/.env — novos campos
MAIL_ENABLED=false
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@empresa.com
MAIL_PASS=senha_do_app
MAIL_FROM="Compras <noreply@empresa.com>"
```

### Frontend

**Header** — ícone de sino com badge de não-lidas:
```
Layout.tsx
  ↳ NotificationBell.tsx   ← polling a cada 30s (ou SSE futuramente)
      ↳ NotificationDropdown.tsx
```

- Badge vermelho com contagem de não-lidas
- Dropdown lista as últimas 15, com link para o pedido
- Clicar marca como lida e navega para `/app/purchases/:id`
- "Marcar todas como lidas"

**Polling** com `useQuery` e `refetchInterval: 30_000` — simples e sem WebSocket por enquanto.

---

## Iniciativa 2 — Redefinição de Senha

### Problema
Não existe forma de o usuário trocar ou recuperar a própria senha. O admin precisa fazer isso manualmente via banco.

### Dois fluxos

**Fluxo 1 — Esqueci minha senha (não autenticado)**
1. Usuário acessa `/forgot-password`, digita e-mail
2. Backend gera token seguro, armazena hash + expiração (1h), envia link por email
3. Usuário clica no link → `/reset-password?token=xxx`
4. Digita nova senha → backend valida token, atualiza hash, invalida o token

**Fluxo 2 — Trocar senha (autenticado, página de perfil)**
1. Usuário acessa `/app/profile`
2. Digita senha atual + nova senha + confirmação
3. Backend valida senha atual antes de atualizar

### Banco de dados

```prisma
model PasswordResetToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  tokenHash String    @unique @map("token_hash") @db.VarChar(255)
  // armazenar hash do token, nunca o token em claro
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@map("password_reset_tokens")
}
```

### Backend — novos endpoints em `auth`

```
POST /auth/forgot-password        { email }
POST /auth/reset-password         { token, newPassword }
POST /auth/change-password        { currentPassword, newPassword }  ← autenticado
```

Segurança:
- Token gerado com `crypto.randomBytes(32).toString('hex')`
- Armazenar `SHA-256(token)` no banco, enviar o token em claro só no email
- `POST /forgot-password` retorna sempre 200 mesmo se o email não existir (evita enumeração de usuários)
- Token expira em 1h e só pode ser usado uma vez

### Frontend

**Novas páginas públicas:**
- `src/pages/ForgotPassword.tsx` — formulário de email, mensagem de confirmação genérica
- `src/pages/ResetPassword.tsx` — lê `?token=` da URL, formulário nova senha + confirmação

**Nova seção na página de perfil:**
- `src/pages/Profile.tsx` — informações do usuário (somente leitura) + seção "Alterar Senha"
- Link "Meu Perfil" no menu lateral ou no avatar do header

**Login.tsx** — adicionar link "Esqueci minha senha" abaixo do botão de login.

---

## Iniciativa 3 — Armazenamento de Arquivos Real

### Problema
Anexos salvos como base64 em colunas JSON do PostgreSQL. Um pedido com 5 arquivos de 2MB cada injeta 10MB em uma linha. Isso degrada queries, backups e não escala.

### Solução — MinIO via Docker (S3-compatível)

MinIO roda on-premise, usa a API do S3, e pode ser migrado para AWS S3 real no futuro sem mudança de código.

### Docker Compose — adicionar serviço

```yaml
# docker-compose.yml
services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: compras_minio
      MINIO_ROOT_PASSWORD: compras_minio_secret
    ports:
      - "9000:9000"   # API S3
      - "9001:9001"   # Console web (acessar em localhost:9001)
    volumes:
      - minio_data:/data

volumes:
  minio_data:
```

### Backend — módulo `uploads`

```
src/uploads/
  uploads.module.ts
  uploads.service.ts     ← uploadFile(), deleteFile(), getPresignedUrl()
  uploads.controller.ts  ← POST /uploads (multipart/form-data)
```

**Dependências:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer @nestjs/platform-express
```

**Variáveis de ambiente:**
```env
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=compras_minio
STORAGE_SECRET_KEY=compras_minio_secret
STORAGE_BUCKET=compras-attachments
STORAGE_PUBLIC_URL=http://localhost:9000/compras-attachments
```

**Endpoint:**
```
POST /uploads
  Content-Type: multipart/form-data
  Body: file (max 10MB), context: "purchase_approval" | "supplier"

Response:
  { key: "purchases/uuid/filename.pdf", url: "http://...", name: "...", size: 12345 }
```

**Chaves de arquivo por contexto:**
- `purchases/{purchaseId}/{uuid}-{filename}` — anexos de aprovação
- `suppliers/{supplierId}/{uuid}-{filename}` — documentos do fornecedor

### Mudança no shape dos anexos

**Antes (base64):**
```json
[{ "name": "nota.pdf", "data": "data:application/pdf;base64,JVBERi0x..." }]
```

**Depois (referência):**
```json
[{ "name": "nota.pdf", "key": "purchases/abc/uuid-nota.pdf", "url": "http://...", "size": 45231 }]
```

Não muda o tipo da coluna no banco (continua `Json`) — muda apenas o conteúdo.

### Frontend

**Upload antigo:** converte para base64 no browser, envia tudo junto com a ação.

**Upload novo:**
1. Usuário seleciona arquivo
2. Frontend faz `POST /uploads` imediatamente com `multipart/form-data`
3. Backend retorna `{ key, url, name, size }`
4. Frontend guarda referências (não mais base64)
5. Ao confirmar a ação (aprovar/fechar), envia só as referências

`PurchaseDetails.tsx` — substituir a lógica de `readFileAsDataUrl()` por upload imediato ao selecionar o arquivo.

**Exibição de anexos:** links com `url` direta do MinIO (ou presigned URL para buckets privados).

### Migração dos dados existentes

Criar script `backend/src/scripts/migrate-attachments.ts`:
- Lê todos os `PurchaseApproval` com attachments base64
- Faz upload de cada arquivo para o MinIO
- Atualiza o JSON com a nova estrutura
- Idem para `Supplier.attachments`

---

## Iniciativa 4 — Exportação PDF e Excel

### Problema
Compradores, gestores e contabilidade precisam de documentos para arquivamento, auditoria e relatórios financeiros. Hoje precisam fazer screenshot ou copiar dados manualmente.

### O que exportar

| Exportação | Formato | Endpoint |
|---|---|---|
| Pedido individual completo | PDF | `GET /purchases/:id/export/pdf` |
| Lista de pedidos (com filtros) | Excel | `GET /purchases/export/excel` |
| Relatório de gastos por período | Excel | `GET /purchases/reports/spending` |

### Backend

**Dependências:**
```bash
npm install pdfkit exceljs
# pdfkit = geração de PDF programática, sem headless browser
# exceljs = geração de XLSX
```

**PDF do pedido** (`pdfkit`):
- Cabeçalho: logo da empresa (de `SystemSettings`), número do pedido, data
- Seções: fornecedor, itens (tabela), total, justificativa, prioridade
- Histórico de aprovações com assinaturas (nome + data)
- Rodapé: gerado em + usuário que exportou

**Excel da lista** (`exceljs`):
- Uma linha por pedido
- Colunas: Nº, Data, Departamento, Solicitante, Fornecedor, Valor, Status, Prioridade
- Aceita os mesmos query params de `GET /purchases` (filtros de status, departamento, período)
- Linha de totais no final

**Excel de gastos por período:**
- Parâmetros: `startDate`, `endDate`, `groupBy` (department | supplier | month)
- Múltiplas abas: Resumo, Por Departamento, Por Fornecedor, Por Mês

### Frontend

**Na tela de detalhes do pedido** (`PurchaseDetails.tsx`):
- Botão "Exportar PDF" no header, ao lado de "Editar Pedido"
- Faz `GET /purchases/:id/export/pdf` e abre o arquivo (`window.open` ou `<a download>`)

**Na lista de pedidos** (`PurchaseList.tsx`):
- Botão "Exportar Excel" aplicando os filtros ativos da tabela
- Faz download do arquivo com os mesmos parâmetros da listagem atual

**No dashboard** (futuro):
- Botão "Relatório de gastos" com seletor de período e agrupamento

---

## Iniciativa 5 — Multi-Cotação

### Problema
Hoje o fluxo assume que o fornecedor já é conhecido ao criar o pedido. Na prática, compras frequentemente precisam de cotação: pede-se o item, compradores buscam preços, e só então o melhor fornecedor é vinculado.

### Abordagem — toggle no momento da criação

O usuário indica no formulário se:
- **Fornecedor já definido** → fluxo atual, supplier obrigatório desde o início
- **Solicitar cotações** → supplier opcional, pedido entra com status `AWAITING_QUOTES`

### Novo status no fluxo

```
DRAFT
  ↓ submit() — modo DIRECT
PENDING_APPROVAL → ... → COMPLETED

  ↓ submit() — modo QUOTE
AWAITING_QUOTES
  ↓ compradores submetem cotações (POST /purchases/:id/quotes)
  ↓ solicitante/admin seleciona melhor cotação (POST /purchases/:id/quotes/:quoteId/select)
PENDING_APPROVAL → ... → COMPLETED
```

### Banco de dados

```prisma
// Adicionar em Purchase:
purchaseType  String @default("DIRECT") @map("purchase_type") @db.VarChar(10)
// DIRECT = fornecedor já definido
// QUOTE  = aguardando cotação

model Quote {
  id          String   @id @default(uuid()) @db.Uuid
  purchaseId  String   @map("purchase_id") @db.Uuid
  supplierId  String   @map("supplier_id") @db.Uuid
  submittedBy String   @map("submitted_by") @db.Uuid
  totalAmount Decimal  @map("total_amount") @db.Decimal(10, 2)
  notes       String   @default("")
  attachments Json     @default("[]")  // cotação em PDF, proposta, etc.
  isSelected  Boolean  @default(false) @map("is_selected")
  createdAt   DateTime @default(now()) @map("created_at")

  purchase  Purchase @relation(fields: [purchaseId], references: [id], onDelete: Cascade)
  supplier  Supplier @relation(fields: [supplierId], references: [id])
  submitter User     @relation(fields: [submittedBy], references: [id])

  @@index([purchaseId])
  @@map("quotes")
}
```

### Backend — novos endpoints

```
POST   /purchases/:id/quotes                   ← COMPRADOR/ADMIN submete cotação
GET    /purchases/:id/quotes                   ← lista cotações do pedido
POST   /purchases/:id/quotes/:quoteId/select   ← seleciona cotação → vincula supplier → avança para PENDING_APPROVAL
DELETE /purchases/:id/quotes/:quoteId          ← remove cotação (antes da seleção)
```

Quem pode submeter cotação: `COMPRADOR`, `ADMIN`, `SUPERADMIN`.  
Quem pode selecionar: solicitante original, `ADMIN`, `SUPERADMIN`.

A seleção:
1. Marca `isSelected = true` na cotação escolhida
2. Atualiza `Purchase.supplierId` e `Purchase.totalAmount` com os valores da cotação
3. Avança o status para `PENDING_APPROVAL` e popula `currentStepId` (igual ao `submit()` atual)

### Frontend

**`PurchaseCreate.tsx`** — toggle no topo do formulário:

```
● Fornecedor já definido   ○ Solicitar cotações
```

- Modo "já definido": comportamento atual, campo supplier obrigatório
- Modo "solicitar cotações": campo supplier some (ou vira opcional com aviso), aparece texto explicativo

**`PurchaseDetails.tsx`** — nova seção "Cotações" para pedidos `AWAITING_QUOTES`:
- Lista de cotações recebidas: fornecedor, valor total, quem submeteu, data, anexos
- Botão "Adicionar cotação" (para COMPRADOR)
- Botão "Selecionar esta cotação" em cada linha (para solicitante/admin)
- Após seleção, o pedido entra em `PENDING_APPROVAL` e o fluxo segue normalmente

**`PurchaseList.tsx`** — nova coluna/badge `AGUARDANDO COTAÇÕES` no status.

**Notificação** (integra com Iniciativa 1):
- Pedido submetido como QUOTE → notifica todos os compradores do fluxo
- Cotação submetida → notifica solicitante
- Cotação selecionada → notifica aprovadores da etapa 1

---

## Iniciativa 6 — Categorias de Itens ✅ CONCLUÍDA

> Implementada e testada em 2026-04-27. Schema migrado, módulo `categories` no backend (CRUD + árvore + flat), seed de categorias iniciais, seletor por item em `PurchaseCreate`, coluna de categoria em `PurchaseDetails`, páginas `CategoryList` e `CategoryForm`, item no menu lateral (ADMIN/SUPERADMIN).

### Problema
Itens de pedido são texto livre. Sem categorização, não é possível gerar relatórios de gastos por área (TI, Marketing, etc.) nem identificar padrões de compra.

### Banco de dados

```prisma
model Category {
  id       String  @id @default(uuid()) @db.Uuid
  name     String  @db.VarChar(255)
  parentId String? @map("parent_id") @db.Uuid
  isActive Boolean @default(true) @map("is_active")

  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
  items    PurchaseItem[]

  @@map("categories")
}

// Adicionar em PurchaseItem:
categoryId String?   @map("category_id") @db.Uuid
category   Category? @relation(fields: [categoryId], references: [id])
```

### Seed de categorias iniciais

```
Tecnologia da Informação
  ├── Hardware
  ├── Software / Licenças
  └── Infraestrutura de Rede
Material de Escritório
Serviços
  ├── Manutenção
  ├── Consultoria
  └── Terceirização
Marketing e Comunicação
Infraestrutura / Instalações
Recursos Humanos
Viagens e Despesas
Outros
```

### Backend — módulo `categories`

```
src/categories/
  categories.module.ts
  categories.service.ts
  categories.repository.ts
  categories.controller.ts
```

```
GET    /categories           ← lista em árvore (com filhos aninhados)
GET    /categories/flat      ← lista plana para selects
POST   /categories           ← ADMIN/SUPERADMIN
PUT    /categories/:id
DELETE /categories/:id       ← só se não houver itens vinculados
```

`findAll()` retorna árvore aninhada (parent → children[]) para facilitar renderização de grupos no select.

### Frontend

**`PurchaseCreate.tsx`** — em cada linha de item, adicionar campo "Categoria":

```
[Descrição ___________] [Link opcional] [Qtd] [Preço Unit.] [Categoria ▾] [🗑]
```

- Select agrupado: pai como `<optgroup>`, filhos como `<option>`
- Campo opcional por ora — não bloqueia submissão sem categoria
- Valor carregado no modo edição

**Nova página de gestão** (visível só para ADMIN/SUPERADMIN):

```
src/pages/CategoryList.tsx   ← listagem em árvore + botões de criar/editar/desativar
src/pages/CategoryForm.tsx   ← criação e edição, com select de categoria pai
```

Adicionar no menu lateral, abaixo de "Departamentos".

**`PurchaseDetails.tsx`** — exibir categoria ao lado da descrição do item na tabela:

```
| Descrição           | Categoria          | Qtd | Unidade | Total    |
| Notebook Dell XPS   | TI > Hardware      |  2  | R$ ...  | R$ ...   |
```

**Dashboard** — ao implementar relatórios (Iniciativa 4), usar `categoryId` para agrupar gastos por categoria.

---

## Ordem de implementação sugerida

| Fase | Iniciativa | Dependências |
|---|---|---|
| 1ª | Categorias de itens | Nenhuma — isolada, não quebra nada existente |
| 1ª | Redefinição de senha | Nenhuma — isolada |
| 2ª | Armazenamento de arquivos | Precisa do MinIO no Docker Compose |
| 2ª | Notificações in-app | Pode começar sem email |
| 3ª | Exportação PDF/Excel | Precisa dos dados estabilizados |
| 3ª | Multi-cotação | Depende de notificações (para avisar compradores) |

Categorias e redefinição de senha podem ser desenvolvidas em paralelo por serem completamente independentes. Multi-cotação é a mais complexa e deve vir depois de notificações estar funcionando.
