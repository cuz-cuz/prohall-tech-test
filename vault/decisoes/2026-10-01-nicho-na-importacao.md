# Importação restrita ao nicho feminino

## Contexto

A loja é de nicho feminino, mas a importação trazia as 24 categorias do DummyJSON — 194 produtos, incluindo camisas masculinas, notebooks e motocicletas. O recorte existia apenas no `seed_demo`, que filtrava na hora de criar anúncios. O painel administrativo, porém, lista produtos importados, então a equipe via o catálogo inteiro.

## Decisão

- mover as categorias do nicho para `apps/catalog/niche.py` como fonte única, lida pelo importador, pelo `seed_demo` e pelo painel;
- buscar por categoria (`/products/category/{slug}`) em vez de baixar tudo e descartar depois, uma chamada paginada por categoria;
- validar o slug contra um padrão antes de montar o caminho, porque ele vira parte da URL;
- recusar o mesmo produto vindo de duas categorias: cada produto do DummyJSON tem uma única categoria, então isso indicaria mudança de contrato;
- manter um filtro por categoria depois da normalização, mesmo com a busca já restrita, para que a garantia do nicho não dependa do que a origem devolve;
- oferecer `--all-categories` para importar tudo, preservando a capacidade anterior sem torná-la padrão;
- não apagar nada automaticamente; a remoção dos produtos fora do nicho já importados fica em `--remover-fora-do-nicho`, que preserva produtos com anúncio.

## Consequências

- a importação passou de 194 para 46 produtos e ficou mais rápida;
- a regra de nicho deixou de ser implícita no `seed_demo` e passou a ser explícita no código e nos testes;
- `ImportSummary` ganhou `skipped`, exposto pelo painel e pelo comando;
- os 148 produtos fora do nicho importados antes deste filtro continuam no banco até que alguém decida removê-los; o comando avisa a cada execução;
- incluir uma categoria nova passa a exigir uma linha em `niche.py`, e um slug inexistente falha de forma visível em vez de importar nada em silêncio.
