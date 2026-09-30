# Decisão: importação atômica do catálogo externo

- Data: 30 de setembro de 2026
- Status: aceita

## Contexto

A importação do DummyJSON precisa ser paginada, repetível e incapaz de deixar o banco parcialmente atualizado quando uma página ou produto for inválido.

## Decisão

1. buscar todas as páginas antes de escrever no banco;
2. validar envelope, paginação, identificadores duplicados e todos os produtos;
3. normalizar dinheiro com `Decimal`;
4. somente depois abrir uma transação atômica;
5. executar `update_or_create` por `external_id`;
6. atualizar apenas campos do `ImportedProduct`;
7. nunca modificar anúncios comerciais durante a sincronização.

## Motivos

- o catálogo atual é pequeno e cabe confortavelmente em memória;
- falhas externas não mantêm uma transação de banco aberta;
- um produto inválido impede qualquer escrita do lote;
- a constraint única e o upsert tornam a operação idempotente;
- a separação entre produto e anúncio protege decisões comerciais.

## Consequências

- a importação depende de conseguir ler todo o catálogo antes de persistir;
- crescimento muito grande da API pode exigir processamento por lotes com checkpoints;
- a API mudar o total durante a leitura é tratada como inconsistência e aborta a execução;
- produtos removidos da origem não são apagados automaticamente nesta fase.
