# Manual de Cargos e Regras de Workflow - Compras Modular

Este documento detalha os níveis de acesso e as regras de negócio que governam o ciclo de vida dos pedidos de compra no sistema.

## 1. Níveis de Acesso (Cargos)

O sistema utiliza RBAC (Role-Based Access Control) para definir permissões fundamentais.

### 👑 SUPERADMIN / ADMIN
- **Escopo**: Global (Todos os departamentos).
- **Controle de Usuários**: Pode criar, editar e desativar qualquer usuário.
- **Configurações**: Gerencia preferências do sistema, aparência e dados da empresa.
- **Fluxos**: Único nível que pode configurar as etapas de aprovação por departamento.
- **Pedidos**: Visibilidade total. Pode intervir em qualquer pedido, inclusive **editar e submeter rascunhos de outros usuários**.
- **Administração**: Pode prosseguir totalmente em qualquer pedido no sistema.

### 👤 REQUISITANTE
- **Escopo**: Departamental (Apenas departamentos vinculados).
- **Ações**: 
    - Criar rascunhos de pedidos.
    - Editar seus próprios rascunhos.
    - Submeter pedidos para aprovação.
- **Regra de Ouro**: Não pode aprovar o próprio pedido (a menos que seja o único approver configurado, o que é má prática).

### ✅ APROVADOR
- **Escopo**: Departamental / Operacional.
- **Ações**: 
    - Visualizar detalhes dos pedidos que chegam à sua etapa de aprovação.
    - **Aprovar**: Move o pedido para a próxima etapa ou para o estado de aprovação final.
    - **Rejeitar**: Encerra o pedido com status "REJEITADO". Obrigatório inserir comentário de justificativa.

### 🛒 COMPRADOR
- **Escopo**: Departamental / Execução.
- **Ações**: 
    - Visualizar pedidos aprovados.
    - **Finalizar (Close)**: Dá o "baixa" no pedido após a compra ser efetuada.
    - **Pós-Fechamento**: Anexar notas fiscais e comprovantes em pedidos já concluídos.
- **Configuração**: Deve estar listado explicitamente na lista de "Compradores" do fluxo do departamento.

### 👁️ VIEWER
- **Escopo**: Global de Leitura.
- **Ações**: Visualizar todos os pedidos e relatórios, mas não pode criar, editar ou aprovar nada.

---

## 2. Regras de Fluxo (Workflow Rules)

O comportamento do pedido é determinado pelo **Fluxo de Aprovação** configurado para o departamento.

### 🔄 Ciclo de Vida do Pedido
1.  **Rascunho (DRAFT)**: Pedido criado pelo requisitante. Pode ser editado livremente pelo dono ou por um Administrador.
2.  **Pendente Aprovação (PENDING_APPROVAL)**: Após o "Submit" (feito pelo dono ou Admin), o pedido entra no workflow.
3.  **Aprovado (APPROVED)**: Todas as etapas foram concluídas com sucesso.
4.  **Pendente Fechamento (PENDING_CLOSING)**: (Opcional) Aguardando o Comprador finalizar.
5.  **Concluído (COMPLETED)**: Ciclo encerrado.
6.  **Rejeitado (REJECTED)**: Ciclo interrompido por um aprovador.

### 🛡️ Validações Críticas
- **Departamento Sem Fluxo**: Se um departamento não tiver um fluxo ativo, o botão de "Criar Pedido" exibe um aviso e o sistema bloqueia a criação para evitar pedidos "órfãos".
- **Departamento Inativo**: Impede novos pedidos, mesmo que tenha fluxo.
- **Hierarquia de Aprovação**: O sistema segue estritamente a ordem das etapas (`stepOrder`). O Aprovaador da etapa 2 só verá o pedido após a aprovação da etapa 1.

### ⚙️ Configurações Especiais de Fluxo
- **Ação Final**:
    - `AUTO_APPROVE`: Assim que o último aprovador dá o OK, o pedido vira "APROVADO" imediatamente.
    - `BUYER_CLOSE`: Após as aprovações, o pedido fica "Pendente Fechamento" para que o Comprador confirme que a negociação foi concluída.
- **Compradores do Fluxo**: Apenas os usuários marcados como compradores no fluxo de um departamento podem ver e finalizar os pedidos "Pendente Fechamento" daquele setor.
