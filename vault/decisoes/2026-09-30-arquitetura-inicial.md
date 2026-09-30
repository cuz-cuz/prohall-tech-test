# Decisão: arquitetura inicial da loja

- Data: 30 de setembro de 2026
- Status: aceita

## Contexto

O desafio permite tecnologia livre e exige ADMIN, LOJA, banco recriável e regras transacionais. O responsável escolheu React, Django e PostgreSQL, com deploy na Vercel e Railway.

## Decisão

- React + Vite para a experiência pública;
- Django REST Framework para API e regras;
- Django Admin para a operação administrativa;
- PostgreSQL para desenvolvimento e produção;
- Vercel para frontend;
- Railway para backend e banco;
- `ImportedProduct` separado de `Listing`;
- snapshots em itens de pedido;
- busca obrigatória implementada primeiro com recursos do PostgreSQL;
- busca semântica permanece como diferencial posterior.

## Motivos

- Django Admin cobre rapidamente o requisito administrativo;
- PostgreSQL oferece transações, bloqueio de linha, `unaccent` e trigramas;
- separar produto e anúncio impede a sincronização externa de apagar decisões comerciais;
- snapshots preservam exatamente o que foi comprado;
- a solução é compatível com o prazo e pode ser defendida em entrevista.

## Consequências

- desenvolvimento local depende de PostgreSQL;
- o avaliador terá setup por Docker quando disponível;
- CORS, CSRF e cookies precisam considerar domínios distintos;
- o checkout deve ser implementado dentro de transação;
- alterações de arquitetura exigem nova nota de decisão.
