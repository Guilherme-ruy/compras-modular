# 🎨 Compras Modular - Brand & Design System

## 1. Filosofia de Design (UI/UX)
O design do **Compras Modular** prioriza a **função sobre a forma**. O objetivo é ter uma interface utilitária, limpa e altamente intuitiva.
* **Curva de Aprendizado Zero:** Uso de padrões de mercadob (menu lateral esquerdo, barra superior de perfil, tabelas de dados centrais). Sem navegação exótica.
* **Acessibilidade e Clareza:** Alto contraste entre texto e fundo. Botões de ação principal sempre em destaque, botões secundários discretos.
* **Previsibilidade:** Se um botão aprova um pedido em uma tela, ele deve ter a mesma cor, ícone e posição em qualquer outra tela do sistema.

## 2. O Motor White-Label (Tematização)
Como o sistema será implantado por cliente (Single-Tenant), o frontend em React (usando Tailwind CSS, Material UI ou similar) consumirá a tabela `system_settings`. 
O design base é construído sobre tons de cinza neutros, permitindo que a injeção da **Cor Primária** do cliente (ex: Laranja para Terraplanagem, Azul para Clínica) assuma a identidade do sistema sem quebrar o layout.

## 3. Paleta de Cores Padrão (Fallback)
Caso o cliente não envie cores personalizadas, o sistema assume uma paleta corporativa neutra e moderna.

### Cores de Marca e Estrutura
* **Primary (Cor da Empresa):** `#0F172A` (Slate 900 - Um azul marinho quase preto). Usado no menu lateral, botões primários e links de destaque.
* **Background:** `#F8FAFC` (Slate 50). Fundo geral da aplicação. Um cinza muito claro que reduz o cansaço visual em jornadas de 8 horas.
* **Surface (Superfícies):** `#FFFFFF` (Branco). Usado em cards, formulários, modais e fundo de tabelas.
* **Text (Texto Principal):** `#334155` (Slate 700). Para leitura confortável, evitando o contraste agressivo do preto absoluto.

### Cores de Feedback (Status Semânticos)
Crucial para bater o olho e entender a situação da requisição de compra:
* **Success (Aprovado / Concluído):** `#10B981` (Emerald 500). Verde suave.
* **Warning (Pendente / Em Revisão):** `#F59E0B` (Amber 500). Amarelo/Laranja de alerta.
* **Danger (Rejeitado / Excluir):** `#EF4444` (Red 500). Vermelho claro para ações destrutivas.
* **Info (Rascunho / Informação):** `#3B82F6` (Blue 500). Azul padrão.

## 4. Tipografia
A tipografia deve ser de sistema ou uma fonte web sem serifa, limpa e otimizada para leitura em telas.
* **Fonte Principal:** `Inter`, `Roboto` ou a fonte nativa do sistema (`system-ui`).
* **Hierarquia:**
  * Títulos de Página (H1): 24px, Semi-Bold, Cor Escura.
  * Subtítulos (H2): 18px, Medium.
  * Texto Padrão (Body): 14px, Regular (Tamanho ideal para tabelas e painéis densos).
  * Texto de Apoio (Labels, Dicas): 12px, Cor mais clara (`#64748B`).

## 5. Componentes e Padrões de Interface
* **Botões:** Devem ter cantos levemente arredondados (`border-radius: 6px` ou `8px`). Sempre usar ícones ao lado do texto em