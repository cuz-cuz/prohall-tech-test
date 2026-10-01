# Restauração controlada do ambiente de demonstração

Data: 1º de outubro de 2026

## Decisão

Disponibilizar em Configurações do painel uma restauração completa dos dados funcionais da demonstração, restrita a superusuários e habilitada explicitamente por `DEMO_RESET_ENABLED`.

## Proteções

- exigir a frase `RESTAURAR DEMONSTRAÇÃO`;
- preservar todos os usuários Django, inclusive o administrador que iniciou a operação;
- baixar e validar completamente o DummyJSON antes de remover qualquer registro;
- apagar e recriar pedidos, clientes, produtos importados, anúncios, menus e banners dentro de uma única transação;
- restaurar o mínimo de frete grátis para o valor inicial do ambiente;
- usar uma lease persistida no PostgreSQL para impedir duas execuções simultâneas;
- bloquear as tabelas funcionais durante a transação para impedir checkout ou edição administrativa intercalados com a reconstrução;
- aplicar cooldown configurável e registrar horário, usuário e resumo da última execução;
- limpar o carrinho local do navegador que concluiu a restauração.

## Motivos

O projeto será uma demonstração pública do desafio. Avaliadores precisam poder alterar a operação comercial e devolver a loja a um estado conhecido sem acesso ao terminal, mas uma exclusão genérica do banco colocaria credenciais, migrations e a própria sessão administrativa em risco.

## Consequências

- o recurso permanece oculto para usuários staff que não sejam superusuários;
- a flag é falsa por padrão e precisa ser ativada conscientemente no Railway;
- indisponibilidade ou payload inválido do DummyJSON aborta antes da etapa destrutiva;
- o primeiro bootstrap do ambiente continua separado, pois a restauração pressupõe um superusuário já criado.
