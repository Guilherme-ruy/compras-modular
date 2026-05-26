# 🛒 Guia do Módulo de Pedidos de Compra

Este documento descreve o fluxo completo dos pedidos de compra, desde a criação até a conclusão, incluindo as duas modalidades suportadas pelo sistema.

---

## 1. Modalidades de Compra

Ao criar um novo pedido, o solicitante escolhe como o fornecedor será definido:

| Modalidade | Quando usar | Fluxo |
| :--- | :--- | :--- |
| **Fornecedor já definido** (`DIRECT`) | Você já sabe com quem comprar — indica o fornecedor no formulário | DRAFT → PENDING_APPROVAL → ... → COMPLETED |
| **Solicitar cotações** (`QUOTE`) | Precisa de orçamentos — o setor de compras envia propostas | DRAFT → AWAITING_QUOTES → PENDING_APPROVAL → ... → COMPLETED |

---

## 2. Ciclo de Vida Completo

```
╔══════════════╗
║    DRAFT     ║  ← Criado pelo Requisitante ou Admin (editável)
╚══════╤═══════╝
       │
       ├─ [Modalidade DIRECT] ──────────────────────────────────────┐
       │  submit()                                                   │
       ▼                                                             │
╔══════════════════╗                                                 │
║ PENDING_APPROVAL ║  ← Percorre as etapas do WorkflowStep em ordem │
╚══════╤═══════════╝                                                 │
       │                                                             │
       ├─ [Modalidade QUOTE] ──────────────────────┐                │
       │  submit()                                  │                │
       ▼                                            │                │
╔═════════════════╗                                 │                │
║ AWAITING_QUOTES ║  ← Compradores adicionam propostas              │
╚══════╤══════════╝                                 │                │
       │  selectQuote()                             │                │
       └──────────────────────────────────────────►─┘                │
                                                                     │
       ┌────────────────────────────────────────────────────────────┘
       │  Aprovações percorrem os WorkflowSteps configurados
       ▼
╔═══════════════════╗
║  PENDING_CLOSING  ║  ← Só se o WorkflowStep final tiver finalAction = BUYER_CLOSE
╚══════╤════════════╝
       │  close()
       ▼
╔═══════════╗
║ COMPLETED ║  ← Compra encerrada; documentos pós-fechamento ainda podem ser anexados
╚═══════════╝

A qualquer etapa de PENDING_APPROVAL:
  reject() → ╔══════════╗
              ║ REJECTED ║
              ╚══════════╝
```

### Descrição dos Status

| Status | Label na Interface | O que significa |
| :--- | :--- | :--- |
| `DRAFT` | Rascunho | Pedido criado, ainda editável |
| `AWAITING_QUOTES` | Aguardando Cotações | Pedido aberto para propostas dos compradores |
| `PENDING_APPROVAL` | Pendente de Aprovação | Percorrendo as etapas do fluxo de aprovação |
| `PENDING_CLOSING` | Pendente de Fechamento | Aprovações concluídas; aguardando o comprador baixar |
| `COMPLETED` | Concluído | Ciclo encerrado |
| `REJECTED` | Rejeitado | Pedido recusado por um aprovador |

---

## 3. Criando um Pedido (`DRAFT`)

**Quem pode:** REQUISITANTE, ADMIN, SUPERADMIN (VIEWER não pode).

### Formulário — Informações Gerais

1. **Modalidade da Compra** — escolha entre os cartões:
   - *Fornecedor já definido*: campo Fornecedor fica ativo
   - *Solicitar Cotações*: campo Fornecedor fica desabilitado (definido depois)

2. **Centro de Custo / Departamento** — define onde a compra será lançada e qual fluxo de aprovação será usado. Departamentos sem fluxo configurado aparecem como `(bloqueado - sem fluxo)` e não permitem criar pedidos.

3. **Fornecedor** — obrigatório em modalidade DIRECT; substituído por aviso informativo em QUOTE.

4. **Prioridade** — sugerida automaticamente pelo valor total dos itens:
   - Até R$ 999,99 → Baixa
   - R$ 1.000 a R$ 4.999,99 → Média
   - R$ 5.000 a R$ 19.999,99 → Alta
   - R$ 20.000+ → Urgente
   
   Pode ser ajustada manualmente; após a primeira alteração manual, a sugestão automática é desativada.

5. **Justificativa** — campo obrigatório.

### Formulário — Itens

Cada item possui: descrição, link de referência (opcional), quantidade, preço unitário e categoria (opcional, hierárquica). O sistema exibe o **Total Estimado** em tempo real.

> O pedido é salvo como **Rascunho** (DRAFT) ao confirmar o formulário. Só avança para aprovação quando o solicitante clicar em "Enviar para Aprovação" / "Abrir para Cotações" na tela de detalhes.

---

## 4. Fluxo DIRECT — Envio para Aprovação

**Na tela de detalhes, botão "Enviar para Aprovação":**

1. O sistema encontra o fluxo de aprovação ativo do departamento.
2. Status muda para `PENDING_APPROVAL` e `currentStep` aponta para a primeira etapa.
3. O aprovador responsável pela etapa 1 recebe notificação.

**Aprovação etapa a etapa:**

- Cada aprovador vê o botão **Aprovar** ativo somente quando o pedido estiver na sua etapa.
- **Aprovar** → avança para próxima etapa (ou finaliza se for a última).
- **Rejeitar** → obrigatório inserir comentário; pedido vai para `REJECTED`.
- Ao aprovar a última etapa:
  - `finalAction = AUTO_APPROVE` → status muda para `COMPLETED`
  - `finalAction = BUYER_CLOSE` → status muda para `PENDING_CLOSING`

---

## 5. Fluxo QUOTE — Cotações

### 5.1 Submetendo o Pedido

**Botão "Abrir para Cotações"** — disponível para o solicitante (ou admin) enquanto `DRAFT`.

- Status muda para `AWAITING_QUOTES`.
- Todos os usuários com role **COMPRADOR** recebem notificação.
- A tela de detalhes exibe a seção **"Cotações Recebidas"**.

### 5.2 Adicionando Cotações (Compradores)

**Quem pode:** COMPRADOR, ADMIN, SUPERADMIN (quando o pedido está `AWAITING_QUOTES`).

Na seção *Cotações Recebidas*, clicar em **"+ Adicionar cotação"** abre o formulário:

| Campo | Obrigatório | Descrição |
| :--- | :---: | :--- |
| Fornecedor | ✅ | Seleciona da lista de fornecedores ativos |
| Valor total da proposta | ✅ | Digitação no formato de centavos (ex: `150000` = R$ 1.500,00) |
| Observações | — | Condições, prazo, validade da proposta |

Cada cotação adicionada é **registrada no histórico do pedido** com a ação `QUOTE_RECEIVED`. O solicitante recebe notificação.

### 5.3 Selecionando a Cotação Vencedora

**Quem pode:** o solicitante (requesterId) ou ADMIN/SUPERADMIN.

Na lista de cotações, clicar em **"Selecionar"** ao lado da cotação desejada:

1. A cotação escolhida é marcada como `isSelected = true`.
2. O pedido recebe `supplierId` e `totalAmount` da cotação selecionada.
3. Status avança para `PENDING_APPROVAL` (fluxo de aprovação é iniciado).
4. O evento `QUOTE_SELECTED` é registrado no histórico.

---

## 6. Fechamento da Compra (`PENDING_CLOSING`)

**Quem pode:** usuários listados como **Compradores do Fluxo** do departamento.

O comprador pode:
- Adicionar um comentário de fechamento.
- Anexar documentos (notas fiscais, comprovantes) — até 5 arquivos, 2 MB cada.
- Clicar em **"Fechar Compra"** → status muda para `COMPLETED`.

> Se nenhum comprovante for anexado, o sistema exibe um alerta de confirmação antes de concluir.

---

## 7. Documentos Pós-Fechamento

Mesmo após `COMPLETED`, compradores configurados no fluxo podem **"Registrar Documentos"** adicionais. O evento fica registrado no histórico como `POST_CLOSE_DOCUMENTS_ADDED` sem reabrir o pedido.

---

## 8. Histórico do Pedido (Timeline)

Todos os eventos do pedido aparecem em ordem cronológica na seção **"Histórico do Pedido"**.

| Ação (`action`) | Cor | Quem gera | Descrição exibida |
| :--- | :--- | :--- | :--- |
| `SUBMITTED` | 🔵 Azul | Solicitante / Admin | "Abriu o pedido para cotações" ou "Enviou para aprovação" |
| `QUOTE_RECEIVED` | 🩵 Céu | Comprador | "Enviou uma cotação" |
| `QUOTE_SELECTED` | 🟢 Esmeralda | Solicitante / Admin | "Selecionou a cotação vencedora — pedido encaminhado para aprovação" |
| `APPROVED` | 🟢 Esmeralda | Aprovador | "Aprovou a etapa" |
| `REJECTED` | 🔴 Vermelho | Aprovador | "Rejeitou a compra" |
| `COMPLETED` | 🟣 Marca | Comprador | "Fechou e concluiu o pedido" |
| `POST_CLOSE_DOCUMENTS_ADDED` | 🔷 Índigo | Comprador | "Anexou documentos após o fechamento" |

Comentários e arquivos anexados ficam visíveis em cada cartão do histórico. URLs nos comentários são renderizadas como links clicáveis.

---

## 9. Permissões por Role (Resumo)

| Ação | SUPERADMIN / ADMIN | APROVADOR | COMPRADOR | REQUISITANTE | VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Criar pedido | ✅ | — | — | ✅ | — |
| Editar rascunho (próprio) | ✅ | — | — | ✅ | — |
| Editar rascunho (qualquer) | ✅ | — | — | — | — |
| Submeter para aprovação | ✅ | — | — | ✅ (próprio) | — |
| Visualizar pedidos de qualquer dept. | ✅ | — | — | — | ✅ |
| Visualizar AWAITING_QUOTES | ✅ | — | ✅ | — | — |
| Adicionar cotação | ✅ | — | ✅ | — | — |
| Selecionar cotação vencedora | ✅ | — | — | ✅ (próprio) | — |
| Aprovar / Rejeitar etapa | ✅ | ✅ (se designado) | — | — | — |
| Fechar compra | ✅ | — | ✅ (se no fluxo) | — | — |
| Anexar docs pós-fechamento | ✅ | — | ✅ (se no fluxo) | — | — |

> **Escopo departamental:** REQUISITANTE e APROVADOR veem apenas pedidos dos seus departamentos vinculados. COMPRADOR vê os dos seus departamentos **mais** todos os pedidos `AWAITING_QUOTES` do sistema.

---

## 10. Notificações

O sistema envia notificações internas automaticamente nos seguintes eventos:

| Evento | Quem recebe |
| :--- | :--- |
| Pedido submetido (DIRECT) | Aprovadores da primeira etapa do fluxo |
| Pedido aberto para cotações (QUOTE) | Todos os usuários COMPRADOR ativos |
| Nova cotação adicionada | Solicitante do pedido |
| Cotação selecionada / pedido aprovado em etapa | Próximos aprovadores |
| Pedido aprovado final | Solicitante |
| Pedido rejeitado | Solicitante |
| Pedido em pendência de fechamento | Compradores do fluxo |
| Pedido concluído | Solicitante |

As notificações aparecem no sino (🔔) no cabeçalho da aplicação e podem ser marcadas como lidas individualmente ou em lote.

---

## 11. Atalho "Novo Pedido" na Lista

O botão **"+ Novo pedido"** na tela de listagem possui dois comportamentos:

- **Clique no botão principal** → abre o formulário sem pré-seleção (padrão DIRECT).
- **Clique na seta (▾)** → abre um menu com as duas opções:
  - *Fornecedor já definido* — pré-seleciona DIRECT
  - *Solicitar cotações* — pré-seleciona QUOTE

A pré-seleção é passada via query param `?type=QUOTE` e pode ser alterada dentro do formulário.
