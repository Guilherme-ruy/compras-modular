# 🎯 Compras Modular - Visão do Produto e Objetivos (PRD)

## 1. O Problema
Empresas de médio porte em setores tradicionais (como terraplanagem, distribuição de bebidas e clínicas odontológicas) frequentemente sofrem com processos de compras desorganizados. Os pedidos são feitos via WhatsApp ou planilhas soltas, dificultando o controle de orçamentos, rastreabilidade de aprovações e auditoria de gastos. Sistemas ERP de prateleira costumam ser caros, rígidos e cheios de funcionalidades que essas empresas não utilizam.

## 2. A Solução: Compras Modular
O "Compras Modular" é um sistema web focado exclusivamente na jornada de aquisição. Ele atua como um motor de aprovações e requisições ágil, seguro e altamente customizável. O software será comercializado no modelo de implantação isolada (*Single-Tenant*), onde cada cliente recebe sua própria instância (Frontend, Backend e Banco de Dados) configurada com a sua identidade visual.

## 3. Objetivos Principais do Sistema

### Objetivo 1: Extensibilidade Baseada em Metadados (O Core)
O sistema deve ser genérico no seu fluxo principal (Criar Pedido -> Aprovar -> Concluir), mas altamente adaptável nos detalhes. 
* *Meta:* Utilizar campos flexíveis (`JSONB`) para que a mesma base de código suporte pedir uma "Peça de Trator com placa X" (Terraplanagem) ou "Seringas para o Dente Y" (Clínica), sem alterar as tabelas principais do banco de dados.

### Objetivo 2: Motor de Workflows Dinâmico e Hierárquico
Empresas diferentes têm burocracias diferentes. O sistema não pode forçar um fluxo de aprovação único.
* *Meta:* Permitir que cada departamento tenha sua própria "esteira" de aprovação, configurada por ordem de prioridade, cargos específicos ou valores de pedido.

### Objetivo 3: White-Label Nativo (Design System)
O cliente final não deve sentir que está usando um software genérico de terceiros.
* *Meta:* O frontend (React) deve consumir um arquivo de configuração central (`theme_config`) carregado via API, adaptando cores primárias, secundárias e logotipos dinamicamente no momento do login.

### Objetivo 4: Arquitetura Orientada a Módulos (Backend)
Embora seja um monólito inicialmente, o código deve ser escrito pensando em separação de domínios (*Clean Architecture*).
* *Meta:* O código em Golang deve manter o módulo de "Compras" isolado do módulo de "Autenticação" e "Workflows", permitindo que novos módulos (ex: "Orçamentos" ou "Estoque") sejam acoplados no futuro como "plugins", sem reescrever o núcleo do sistema.

## 4. O que este sistema NÃO é (Fora de Escopo Inicial)
* **Não é um SaaS Multi-Tenant:** Não haverá múltiplos clientes dividindo o mesmo banco de dados.
* **Não é um ERP completo:** Inicialmente, não fará controle financeiro avançado (contas a pagar/receber), emissão de notas fiscais ou folha de pagamento. O foco é 100% no processo de Requisição e Aprovação de Compras.