# Arquitetura Read-Only (Soft Lockout) - Guia de Implementação

Este guia documenta o comportamento do sistema Compras Modular em relação à gestão de assinaturas (SaaS) quando um inquilino (Tenant) não possui uma assinatura ativa (cancelado ou expirado).

## 1. O Conceito de Soft Lockout
Quando uma assinatura expira ou é cancelada, o sistema **NÃO bloqueia o acesso visual** do usuário aos seus dados históricos (pedidos, relatórios, cadastros). Em vez disso, o sistema entra em modo **Somente Leitura** (Soft Lockout). 
Isso transmite confiança corporativa, permitindo que a empresa exporte dados e realize auditorias, reduzindo a fricção e incentivando o retorno.

## 2. Implementação no Backend
O controle de acesso é centralizado no arquivo `subscription.guard.ts`.
- **Rotas de Leitura (`GET`):** São liberadas automaticamente. Qualquer listagem ou busca funcionará normalmente para usuários inativos.
- **Rotas de Mutação (`POST`, `PUT`, `PATCH`, `DELETE`):** São interceptadas. Se a assinatura não for `active` (ou `trialing` válido), a API retornará o erro HTTP `402 Payment Required`.

## 3. Implementação no Frontend
O sistema lida com o estado Read-Only através de interceptação global, evitando a necessidade de espalhar lógica por diversas telas.

- **Alerta Visual:** O componente `Layout.tsx` exibe o `ReadOnlyBanner.tsx` fixo no topo da tela quando o status do Tenant é inativo.
- **Interrupção de Fluxo:** O interceptador do Axios (`api.ts`) escuta respostas `402 Payment Required`. Ao receber esse erro, ele força a exibição do Modal de Assinatura (através do parâmetro `?upgrade=true` na URL).

## ⚠️ Regras para Criação de Novas Telas (Para IA / Desenvolvedores)

Para manter a base de código limpa ao criar novas telas (CRUDs) no futuro, **siga rigorosamente esta regra**:

> **NÃO programe modais de bloqueio manual nem crie lógica para esconder botões ("Salvar", "Criar") com base no status da assinatura na sua nova tela.**

1. **Construa a tela normalmente:** Assuma que o usuário tem permissão total. Deixe o botão de "Salvar" ou "Criar Registro" visível, colorido e clicável.
2. **Deixe a arquitetura trabalhar:** Quando o usuário clicar no botão, o Frontend fará a requisição `POST` ou `PUT`. O Backend retornará `402`. O interceptador global capturará o erro, pausará o fluxo natural da tela e abrirá o Modal de Assinatura por cima.
3. **Resultado Esperado:** Isso cria um atrito intencional que converte mais assinaturas (o usuário clica porque quer muito executar a ação, e então é convidado a pagar) sem poluir o código dos componentes React individuais.
