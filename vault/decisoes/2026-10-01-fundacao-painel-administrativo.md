# Fundação do painel administrativo React

## Contexto

A Fase 11 exige um painel próprio em `/admin`, protegido para a equipe, sem substituir o Django Admin e sem antecipar as operações de escrita da Fase 12.

## Decisão

- concentrar a API administrativa em `apps.backoffice`, sob `/api/admin/`;
- reutilizar usuários Django e `SessionAuthentication`, sem JWT;
- exigir usuário ativo com `is_staff` por uma permissão única aplicada a todos os recursos protegidos;
- proteger login e logout com CSRF e manter cookies de sessão HttpOnly conforme as configurações existentes;
- publicar apenas endpoints paginados e somente leitura para produtos importados, pedidos e clientes nesta fase;
- omitir campos internos ou sensíveis, incluindo payload bruto, hashes, códigos temporários, fingerprints e dados de senha;
- derivar a última importação do maior `ImportedProduct.last_synced_at`, pois uma execução já grava o mesmo instante em todos os produtos sincronizados dentro da transação;
- manter `/admin/` do backend como Django Admin de contingência e usar `/admin` no host do frontend para o painel React.

## Consequências

- nenhuma migration foi necessária na Fase 11;
- preço, estoque, totais e permissões continuam sob autoridade exclusiva do backend;
- a Fase 12 poderá adicionar comandos comerciais na mesma fronteira protegida sem expor os modelos públicos;
- o resumo da última importação informa horário e quantidade sincronizada, mas detalhes de criados/atualizados só poderão ser históricos se uma execução futura for persistida explicitamente.
