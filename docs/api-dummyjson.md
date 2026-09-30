# Contrato da API DummyJSON — Produtos

> Verificado em 30 de setembro de 2026. A API é uma origem externa e pode evoluir; o cliente deve validar respostas e falhar de forma controlada.

Documentação oficial: <https://dummyjson.com/docs/products>

## Uso no projeto

O DummyJSON é usado somente para importar produtos. O PostgreSQL local é a fonte de verdade da loja depois da importação. Anúncios, menus, banners, clientes e pedidos nunca são persistidos no DummyJSON.

## Listagem paginada

```http
GET https://dummyjson.com/products?limit={limit}&skip={skip}
```

Exemplo de envelope:

```json
{
  "products": [],
  "total": 194,
  "skip": 0,
  "limit": 30
}
```

O valor de `total` é ilustrativo e não deve ser fixado no código.

### Paginação

1. iniciar com `skip=0`;
2. solicitar um `limit` explícito;
3. validar `products`, `total`, `skip` e `limit`;
4. persistir o lote;
5. avançar `skip` pela quantidade realmente recebida;
6. encerrar quando todos os itens forem processados ou a página vier vazia;
7. impedir loop infinito se a API responder paginação incoerente.

## Campos observados

```text
id
title
description
category
price
discountPercentage
rating
stock
tags
brand
sku
weight
dimensions
warrantyInformation
shippingInformation
availabilityStatus
reviews
returnPolicy
minimumOrderQuantity
meta
images
thumbnail
```

Campos mínimos persistidos pelo projeto:

```text
external_id ← id
title
description
category
brand
sku
source_price ← price
source_discount_percentage ← discountPercentage
source_stock ← stock
availability_status ← availabilityStatus
thumbnail_url ← thumbnail
images
raw_payload ← objeto completo
last_synced_at ← horário local da sincronização
```

Campos opcionais ou ausentes devem ser tratados sem interromper todo o lote. O campo `id` é obrigatório para persistência.

## Idempotência

- `external_id` possui constraint única;
- usar `update_or_create` ou operação equivalente;
- reimportar atualiza somente campos de origem externa;
- reimportar nunca modifica `Listing`;
- uma falha deve produzir mensagem clara e resumo consistente;
- testes usam mock da API externa.

## Dinheiro

O JSON representa `price` como número. Converter pela representação textual para `Decimal`; nunca executar cálculo financeiro com `float`.

## Timeout e erros

O cliente deve configurar timeout e tratar:

- erro de conexão;
- timeout;
- HTTP não esperado;
- JSON inválido;
- envelope ausente;
- produto sem identificador;
- paginação incoerente.

Logs podem conter endpoint, status, duração e contadores, mas nunca dados sensíveis.

## Operações que não serão usadas

Os endpoints de criação, atualização e exclusão do DummyJSON apenas simulam alterações e não persistem dados no serviço. Toda alteração comercial será salva no PostgreSQL.
