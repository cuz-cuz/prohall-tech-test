# Frete grátis configurável e marcação por anúncio

## Contexto

O responsável perguntou onde configurar o frete grátis e, ao ver a resposta, identificou dois problemas. O valor só existia na variável de ambiente `FREE_SHIPPING_MINIMUM`, exigindo novo deploy para mudar em produção. E, apesar do nome, a regra era **por produto**: o selo aparecia quando o preço unitário atingia o mínimo, não quando a compra atingia.

Pediu três coisas: tornar o valor editável pelo painel, permitir marcar frete grátis dentro do próprio produto e informar no carrinho quanto falta para conquistá-lo.

## Decisão

- criar `StoreSettings` em `apps.core`, uma linha única garantida por `CheckConstraint(id=1)`, com `load()` que cria a linha na primeira leitura;
- `FREE_SHIPPING_MINIMUM` passa a ser somente a semente da primeira linha, decisão do responsável; o valor vigente vive no banco e muda sem deploy;
- expor `GET`/`PATCH` em `/api/admin/settings/`, sob a mesma permissão de staff dos demais recursos, e criar a página Configurações no painel;
- o mínimo passa a valer sobre o **subtotal do carrinho**, substituindo a comparação com o preço unitário;
- adicionar `Listing.free_shipping` como marcação explícita do anúncio;
- decisão do responsável: a marcação **vale só para aquele item**. Ela destaca o produto na vitrine, mas o frete do pedido continua dependendo apenas do subtotal atingir o mínimo, que nunca é contornado;
- o filtro `free_shipping` do catálogo passa a consultar a marcação, não mais o preço;
- a migration marca os anúncios que já atendiam à regra antiga, para a vitrine não perder selos no momento da migração;
- o carrinho informa `Adicione mais R$ x em produtos e receba frete grátis` e troca para o estado conquistado ao atingir o valor.

## Consequências

- o texto da vitrine foi reescrito para não prometer o que a regra não entrega: um produto marcado diz "Frete grátis neste produto" e, junto, que o pedido fica grátis a partir do mínimo;
- marcar um anúncio não libera frete do pedido, então a equipe precisa saber que as duas coisas são independentes — está dito na página de Configurações e no editor;
- `StoreSettings.delete()` levanta erro, para a linha única não sumir por engano;
- o frete continua sem custo calculado em lugar nenhum: tudo isso é apresentação, como o resto das condições comerciais;
- um segundo parâmetro comercial no painel (Pix, parcelas) agora tem lugar natural para morar.
