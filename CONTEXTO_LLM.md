# Contexto do Projeto: Compras Modular (SaaS B2B)

Este documento foi criado para servir de "ponto de partida" (handoff) para futuras sessões com IAs ou desenvolvedores. Ele resume o que é o sistema, a arquitetura, o que já foi construído, decisões de design e os próximos passos.

## 1. Visão Geral do Sistema
O **Compras Modular** é uma plataforma SaaS (Software as a Service) voltada para a gestão de compras B2B. A aplicação foi construída utilizando uma arquitetura Multi-Tenant rigorosa, onde diversas empresas podem se cadastrar e gerenciar seus pedidos de compras, fornecedores, usuários e departamentos de forma totalmente isolada no mesmo banco de dados.

## 2. Stack Tecnológica
*   **Frontend:** React (criado via Vite), TypeScript, TailwindCSS, React Router, Lucide Icons (para iconografia minimalista).
*   **Backend:** Node.js com NestJS, TypeScript.
*   **Banco de Dados:** PostgreSQL, orquestrado através do Prisma ORM.
*   **Infraestrutura Local:** Docker (Container para o Postgres).
*   **Integrações:** Stripe (para cobranças, trial e gerenciamento de assinaturas).

## 3. Onde Paramos (Status Atual)

### 3.1. Autenticação e Multi-Tenant
*   Fluxo de Login, Cadastro, Recuperação de Senha (com envio simulado de e-mail) implementados.
*   Isolamento de Tenant (Inquilinato) está em funcionamento: o `tenantId` é gerado no cadastro e associado a todas as entidades pertencentes àquela empresa. No backend, middlewares/guards garantem a injeção do `tenantId` automaticamente.

### 3.2. Módulo de Assinatura (SaaS) e Stripe
*   **Trial de 30 dias automático:** Quando um tenant é criado, ganha 30 dias grátis baseados no campo `createdAt` da tabela `Tenant`. O status inicial é `trialing`.
*   **Banner de Urgência Dinâmico (TrialBanner):** Implementado no frontend (`Layout.tsx`). Ele exibe os dias restantes e muda de cor dependendo da urgência:
    *   `> 15 dias`: Verde (Marca padrão).
    *   `14 a 8 dias`: Azul.
    *   `7 a 4 dias`: Laranja (Alerta).
    *   `<= 3 dias`: Vermelho (Urgente com ícone de fogo).
*   **Lazy Customer Creation:** Clientes não são criados na Stripe no momento do cadastro. Eles são criados na Stripe apenas no momento em que clicam em "Assinar Agora" e o backend (`/stripe/checkout`) gera a sessão.
*   **Modal de Upgrade:** Telas bloqueadas (erro HTTP 402 - Payment Required) não redirecionam mais para uma página isolada. O interceptor do axios injeta `?upgrade=true` na URL. O `Layout` lê o parâmetro e sobrepõe um Modal elegante (Dialog) em cima da tela atual do usuário para que ele assine sem perder o contexto de onde estava.

### 3.3. Design System e UI/UX
*   **Estética Premium e Minimalista:** Toda a aplicação segue uma paleta de cores consistente (usando `brand-600` como principal e tons `slate`).
*   **Topbar:** O perfil no cabeçalho superior foi condensado em apenas duas linhas (sem "badges" espalhafatosos). Exemplo:
    `Usuário • Administrador`
    `sucesso@teste.com`

## 4. Como Continuar (Próximos Passos e Roadmap)

Para você (LLM) que está assumindo este projeto a partir de agora, aqui estão as tarefas prioritárias para dar andamento à aplicação:

### A. Webhooks do Stripe (Prioridade Máxima 🚨)
*   Atualmente, o usuário clica em assinar, passa o cartão no Checkout do Stripe e é redirecionado de volta para `/app?upgrade=true&success=true`.
*   **Falta fazer:** Criar o endpoint de Webhook no `StripeController` para escutar os eventos vindos da Stripe (ex: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`).
*   **Objetivo:** Quando a Stripe enviar o webhook de que foi pago, o backend deve atualizar a tabela `Tenant`, alterando `subscriptionStatus` de `trialing` (ou `inactive`) para `active`, e salvar o `stripeCustomerId` e `stripeSubscriptionId`.

### B. Funcionalidade Cross-Tenant (SUPERADMIN)
*   Foi conversada a ideia de um "Login Global" para administradores do próprio SaaS.
*   **Falta fazer:** Criar uma lógica onde um usuário com a role `SUPERADMIN` (da dona do sistema) possa fazer login e selecionar/mudar de `tenantId` em tempo de execução para prestar suporte às empresas cadastradas.

### C. Refinamento dos Módulos (CRUDs)
*   Apesar dos componentes visuais para Pedidos (Purchases), Fornecedores, Departamentos e Fluxos de Aprovação (Workflows) estarem criados nas rotas do frontend, suas conexões finais com os respectivos endpoints no backend precisam de testes e validação das regras de negócios.

### D. Preparação para Produção
*   Remover chaves de teste da Stripe e substituir por variáveis de ambiente.
*   Configurar o envio real de e-mails (ex: AWS SES, SendGrid, Resend) para recuperação de senha.
*   Configuração do Dockerfile final do Frontend (Nginx) e Backend (Node) para deploy em nuvem (ex: AWS, Render, VPS).

### E. Roadmap Funcional Pendente (do ROADMAP.md original)
Ainda existem grandes épicos mapeados no `ROADMAP.md` que precisam ser construídos para enriquecer a experiência do produto:

*   **1. Armazenamento de Arquivos Real (MinIO/S3):**
    *   **Problema:** Atualmente, os anexos de pedidos e fornecedores estão sendo salvos em `base64` dentro do JSON no Postgres. Isso não escala e degrada a performance.
    *   **Solução pendente:** Implementar o módulo `uploads` usando `MinIO` (S3-compatible) no Docker Compose, criando os buckets, endpoints de upload imediato (`POST /uploads`) usando `multer` e `@aws-sdk/client-s3`, e guardando apenas as URLs e Keys no banco de dados.

*   **2. Exportação PDF e Excel:**
    *   **Problema:** Os usuários não conseguem extrair dados de compras e listas para enviar a contabilidade ou diretorias.
    *   **Solução pendente:** Criar endpoints usando bibliotecas como `pdfkit` e `exceljs` para exportar o PDF de um pedido individual detalhado (com logo da empresa e histórico de aprovações) e o Excel listando vários pedidos com base nos filtros da tela.

---
**Nota para IAs:** Ao modificar componentes de UI, mantenha sempre o padrão minimalista e não utilize o React Router para criar novas páginas inteiras caso a funcionalidade possa ser resolvida elegantemente com Modais/Dialogs que reaproveitem o contexto (Layout) atual do usuário.
