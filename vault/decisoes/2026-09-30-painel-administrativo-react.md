# Painel administrativo React como interface principal

## Contexto

O plano inicial escolheu o Django Admin para cumprir rapidamente o escopo obrigatório. Depois de concluir a loja e as regras críticas, o responsável decidiu que a experiência administrativa também deve ter identidade visual própria e fluxos mais claros antes do deploy.

## Decisão

- criar o painel principal no frontend React, sob `/admin`;
- criar endpoints protegidos sob `/api/admin/`;
- autenticar com usuários Django ativos que possuam `is_staff`;
- usar sessão Django, cookie HttpOnly e CSRF, sem introduzir JWT;
- manter o Django Admin do backend em `/admin/` como contingência;
- dividir a implementação nas fases 11, 12 e 13;
- deslocar deploy e documentação final para as fases 14 e 15.

## Escopo funcional

- dashboard operacional;
- produtos importados somente leitura e sincronização DummyJSON;
- criação e manutenção de anúncios;
- organização de menus e seus anúncios;
- manutenção e agendamento de banners;
- pedidos e clientes somente leitura;
- feedback, filtros, paginação e uso em celular e desktop.

## Segurança

- todos os endpoints administrativos verificam autenticação, atividade e `is_staff` no backend;
- operações de escrita exigem CSRF;
- permissões não dependem apenas de proteção de rota no React;
- totais de pedidos, snapshots, produtos importados e clientes não recebem edição indevida;
- hashes e códigos temporários de acesso não são retornados pela API;
- credenciais administrativas continuam fora do Git.

## Consequências

- a stack permanece React, Django, DRF e PostgreSQL;
- haverá mais API e testes antes do deploy;
- o painel poderá ser avaliado e ajustado por fase;
- o Django Admin reduz o risco operacional caso o painel próprio tenha uma falha.
