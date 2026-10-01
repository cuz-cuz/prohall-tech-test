# Condições comerciais exibidas na vitrine

Data: 30 de setembro de 2026.

## Decisão

A API pública passa a calcular e expor as condições usadas pela interface:

- 10% de desconto informativo no Pix;
- parcelamento informativo em até 12 vezes sem juros;
- frete grátis para itens ou carrinhos a partir de R$ 199,00;
- desconto percentual baseado somente no preço promocional do anúncio;
- popularidade baseada somente na quantidade de itens em pedidos aprovados.

Os valores são configuráveis por ambiente com `PIX_DISCOUNT_PERCENT`, `MAX_INSTALLMENTS` e `FREE_SHIPPING_MINIMUM`.

## Motivo

Preço, estoque e regras comerciais não podem nascer no frontend. Centralizar os parâmetros no Django mantém a vitrine consistente e permite alterar a política sem espalhar números pela interface.

## Limites

O checkout desta entrega continua simulando cartão e cobra o preço efetivo integral do anúncio. A condição de Pix é uma apresentação comercial, sem integração ou pagamento Pix real. Não existe entidade de cupom; a ordenação “Maior desconto” usa promoções reais para evitar anunciar um benefício inexistente.

O compartilhamento do carrinho envia o endereço da página e um resumo textual. Ele não replica o conteúdo do `localStorage` no navegador de outra pessoa.
