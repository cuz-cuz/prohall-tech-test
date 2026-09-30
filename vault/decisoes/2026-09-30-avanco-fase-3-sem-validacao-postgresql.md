# Avanço da Fase 3 antes da validação PostgreSQL da Fase 2

## Contexto

A Fase 2 deixou migrations e testes de persistência prontos, mas este computador não possui Docker e as credenciais do PostgreSQL local não estão disponíveis. Por isso, ainda não foi possível executar a importação duas vezes no PostgreSQL e confirmar a permanência dos 194 produtos.

## Decisão

O responsável autorizou explicitamente iniciar a Fase 3 antes dessa validação. A implementação pode avançar, mas a pendência não é considerada resolvida nem substituída por testes em outro banco.

## Mitigação

- manter a validação PostgreSQL/Docker na lista de pendências;
- executar testes sem banco neste ambiente;
- usar SQLite em memória apenas como verificação complementar da integração;
- antes da entrega final, aplicar migrations e rodar toda a suíte no PostgreSQL do Docker;
- executar `import_products` duas vezes e confirmar que a contagem permanece 194.
