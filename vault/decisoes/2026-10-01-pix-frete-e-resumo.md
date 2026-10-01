# Pix simulado, frete fixo e resumo detalhado do pedido

## Contexto

A vitrine anunciava 10% de desconto no Pix e frete grátis a partir de um valor mínimo, mas o checkout só aceitava cartão e o total do pedido era sempre igual ao subtotal. O responsável pediu um Pix simulado e um resumo que mostrasse descontos e frete economizado.

## Decisão

- o pedido registra `payment_method` (`card` ou `pix`), `product_discount`, `pix_discount`, `shipping_fee` e `shipping_saved`;
- o total passa a ser `subtotal − pix_discount + shipping_fee`, garantido por constraint no PostgreSQL;
- o Pix aplica `PIX_DISCOUNT_PERCENT` sobre o subtotal dos produtos, calculado no servidor;
- o frete é um valor fixo simulado, `SHIPPING_FEE` (padrão R$ 19,90), dispensado quando o subtotal atinge o mínimo de frete grátis; nesse caso o valor dispensado é gravado como frete economizado;
- o mínimo de frete grátis é comparado com o subtotal antes do desconto Pix, para que pagar com Pix nunca faça o cliente perder o frete grátis;
- o Pix é simulado como o cartão: `pix_outcome` `paid` aprova e `expired` recusa sem baixar estoque;
- o QR code é um desenho ilustrativo que não codifica nada, e o "copia e cola" usa o prefixo `MOSAICO-PIX-SIMULADO`, fora do formato EMV do Banco Central, para que nenhum aplicativo bancário o interprete como cobrança real;
- o frontend reproduz o cálculo do servidor em `utils/orderBreakdown.js` apenas para exibição; o servidor continua sendo a autoridade.

## Consequências

- pedidos anteriores continuam válidos: são cartão, com descontos e frete zerados;
- a forma de pagamento entra na impressão digital de idempotência, então trocar de cartão para Pix com a mesma chave gera conflito;
- o valor do frete ainda não é editável no painel; muda-se pela variável de ambiente.
