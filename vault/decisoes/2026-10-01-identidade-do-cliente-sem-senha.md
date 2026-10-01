# Identidade do cliente sem senha e nome do comprador no pedido

## Contexto

O responsável questionou como funciona o cadastro de clientes, por existir uma área de pedidos. Não há cadastro: `Customer` nasce no primeiro checkout, por `get_or_create` sobre o e-mail normalizado, não tem senha e não se liga ao `User` do Django. O acesso posterior usa código de seis dígitos enviado por e-mail.

A revisão desse fluxo expôs um defeito ativo. O checkout já atualizava `Customer.name` quando o cliente informava um nome diferente, e `OrderSerializer` lia esse nome ao vivo. Um cliente recorrente que digitasse o nome de outra forma renomeava retroativamente todos os seus pedidos anteriores, inclusive na visão da equipe no painel.

## Decisão

- manter a identidade sem senha, decidido explicitamente pelo responsável, por tirar atrito da compra e por não assumir a guarda de senha de cliente;
- manter a atualização de `Customer.name`, que representa o nome atual da conta;
- gravar `Order.customer_name` no checkout, com o nome informado naquela compra, estendendo ao pedido a regra de snapshot que já valia para `OrderItem`;
- preservar a forma do JSON (`customer.name` e `customer.email`), evitando alteração no frontend;
- continuar lendo o e-mail da conta, por ser a chave de identidade: ele não muda sem se tornar outro cliente, logo não precisa de snapshot;
- fazer a busca de pedidos do painel consultar o snapshot além do nome da conta, para que o termo pesquisado corresponda ao que a tabela mostra;
- na migration, copiar o nome atual da conta para os pedidos existentes, por ser o único nome disponível para eles.

## Consequências

- o histórico passa a ser fiel ao momento da compra e deixa de depender de dado mutável;
- quem controla o e-mail controla a conta — propriedade inerente ao acesso sem senha, aceita conscientemente e que deve ser dita na apresentação;
- `Order` ganhou migration (`0003_order_customer_name`), a primeira do app desde a restrição de total;
- pedidos anteriores à migration carregam o nome vigente no momento do backfill, não necessariamente o da compra; não havia dado melhor a recuperar;
- se o cadastro com senha for adotado depois, o snapshot continua correto e independente do modelo de autenticação.
