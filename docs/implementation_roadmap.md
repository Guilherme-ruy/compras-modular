### FASE 2: Autenticação e Configuração Base (Golang)
1. Crie os repositórios para `users`, `roles` e `system_settings`.
2. Implemente a autenticação via JWT. O token deve carregar o `user_id` e a `role` para facilitar as validações de permissão nas rotas seguintes.
3. Crie a rota `GET /settings/theme` para alimentar o frontend com a identidade visual do cliente logo no carregamento.