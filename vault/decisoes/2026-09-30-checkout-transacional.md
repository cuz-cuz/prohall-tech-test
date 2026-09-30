# Decisão: checkout transacional e fronteira da conta do cliente

- Data: 30 de setembro de 2026
- Status: aceita

## Contexto

A Fase 7 precisa persistir pedidos, impedir venda acima do estoque, manter valores exatos e tolerar reenvios. A autenticação, a sessão do cliente e “Meus pedidos” estão reservados à Fase 8, embora todo pedido já precise pertencer a um cliente.

## Decisão

1. criar nesta fase um `Customer` comercial mínimo, identificado por e-mail único normalizado;
2. vincular `Order` ao `Customer`, deixando a associação com usuário Django e sessão para a Fase 8;
3. executar validação, snapshots, pagamento e eventual redução de estoque em uma única transação atômica;
4. bloquear anúncios com `select_for_update`, em ordem estável de ID;
5. recalcular valores exclusivamente com `Decimal` e preços atuais do backend;
6. usar UUID único mais impressão digital do payload para idempotência;
7. receber e persistir somente os quatro dígitos fictícios necessários à simulação.

## Motivos

- mantém a implementação dentro do escopo da fase sem criar uma autenticação parcial;
- o vínculo comercial já permite preservar o histórico que a Fase 8 exporá;
- o bloqueio e a transação evitam estoque negativo em requisições concorrentes no PostgreSQL;
- a impressão digital impede que uma mesma chave represente compras diferentes;
- reduzir os dados de pagamento elimina a possibilidade de armazenar um cartão completo por engano.

## Consequências

- a Fase 8 deve ligar o `Customer` ao mecanismo de autenticação do Django e estabelecer a sessão após o checkout;
- a concorrência real de bloqueio precisa ser validada em PostgreSQL, pois SQLite ignora `select_for_update`;
- pedidos recusados permanecem no histórico, mas não alteram estoque;
- reenvio idêntico retorna o pedido existente; reutilização da chave com outro payload retorna conflito.
