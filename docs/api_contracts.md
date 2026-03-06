# 🔌 Contratos de API (RESTful - Golang)

Todas as rotas devem ser prefixadas com `/api/v1` e protegidas por JWT Middleware (exceto `/auth/login`). Como a aplicação é Single-Tenant, o backend assume que todos os dados pertencem à empresa atual.

## Autenticação e Configurações
* `POST /auth/login` -> Retorna JWT e as permissões do usuário.
* `GET /settings/theme` -> Rota pública/desprotegida que o React chama ao carregar a página de login para pintar a tela com as cores da empresa (`theme_config`).
* `PUT /settings` -> Atualiza os dados da empresa (Apenas Role ADMIN/SUPERADMIN).

## Compras e Workflows (Mantém-se a lógica, sem filtros de Tenant)
* `POST /purchases` -> Cria o rascunho.
* `GET /purchases` -> Lista compras. (RBAC: Viewer/Admin veem todas, Requester vê as do seu departamento).
* `POST /purchases/{id}/submit` -> Envia para aprovação.
* `POST /purchases/{id}/approve` -> Aprova o step atual.
* `POST /purchases/{id}/reject` -> Rejeita a compra.